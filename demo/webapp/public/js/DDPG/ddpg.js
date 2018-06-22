
function logTfMemory(){
    let mem = tf.memory();
    console.log("numBytes:" + mem.numBytes + 
                "\nnumBytesInGPU:" + mem.numBytesInGPU + 
                "\nnumDataBuffers:" + mem.numDataBuffers + 
                "\nnumTensors:" + mem.numTensors);
}

// This class is called from js/DDPG/ddpg_agent.js
class DDPG {

    /**
     * @param config (Object)
     * @param actor (Actor class)
     * @param critic (Critic class)
     * @param memory (Memory class)
     * @param noise (Noise class)
     */
    constructor(actor, critic, memoryPos, memoryNeg, noise, config){
        this.actor = actor;
        this.critic = critic;
        this.memoryPos = memoryPos;
        this.memoryNeg = memoryNeg;
        this.noise = noise;
        this.config = config;
        this.tfGamma = tf.scalar(config.gamma);

        // Inputs
        let obsInput = tf.input({batchShape: [null, this.config.stateSize]});
        let actionInput = tf.input({batchShape: [null, this.config.nbActions]});

        if (config.normalizeObservations){
            tf.layers.batchNormalization({
                scale: true,
                center: true
            }).apply(obsInput);
        }

        // Randomly Initialize actor network μ(s)
        this.actor.buildModel(obsInput);
        // Randomly Initialize critic network Q(s, a)
        this.critic.buildModel(obsInput, actionInput);

        // Define in js/DDPG/models.js
        // Init target network Q' and μ' with the same weights
        this.actorTarget = copyModel(this.actor, Actor);
        this.criticTarget = copyModel(this.critic, Critic);
        // Perturbed Actor (See parameter space noise Exploration paper)
        this.perturbedActor = copyModel(this.actor, Actor);
        //this.adaptivePerturbedActor = copyModel(this.actor, Actor);

        this.actorOptimiser = tf.train.adam(this.config.actorLr);
        this.criticOptimiser = tf.train.adam(this.config.criticLr);

        this.criticWeights = [];
        for (let w = 0; w < this.critic.model.weights.length; w++){
            this.criticWeights.push(this.critic.model.weights[w].val);
        }

        this.actorWeights = [];
        for (let w = 0; w < this.actor.model.weights.length; w++){
            this.actorWeights.push(this.actor.model.weights[w].val);
        }

        // Return a batch from positive and negative experiences
        this.memory = {
            getBatch: (size) => {
                let batch1 = this.memoryPos.getBatch(size/2);
                let batch2 = this.memoryNeg.getBatch(size/2);
                return {
                    'obs0': batch1.obs0.concat(batch2.obs0),
                    'obs1': batch1.obs1.concat(batch2.obs1),
                    'rewards': batch1.rewards.concat(batch2.rewards),
                    'actions': batch1.actions.concat(batch2.actions),
                    'terminals': batch1.terminals.concat(batch2.terminals),
                };
            }
        };

        assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev);
    }


    /**
     * Distance Measure for DDPG
     * See parameter space noise Exploration paper
     * obs (Tensor2d) Observations
     */
     distanceMeasure(observations) {
        return tf.tidy(() => {
            const pertubedPredictions = this.perturbedActor.model.predict(observations);
            const predictions = this.actor.model.predict(observations);

            const distance = tf.square(pertubedPredictions.sub(predictions)).mean().sqrt();
            return distance;
        });
    }

    /**
     * AdaptParamNoise
     */
    adaptParamNoise(){
        const batch = this.memory.getBatch(this.config.batchSize);
        const tfObs0 = tf.tensor2d(batch.obs0);
        const distance = this.distanceMeasure(tfObs0);

        assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev);

        const distanceV = distance.buffer().values;
        this.noise.adapt(distanceV[0]);
        setMetric("Distance", distanceV[0])

        distance.dispose();
        tfObs0.dispose();
    }

    /**
     * Eval the actions and the Q function
     * @param states (tf.tensor2d)
     * @return actions and qValues
     */
    eval(observation){
        const tfActions = this.perturbedActor.model.predict(observation);
        const tfQValues = this.critic.model.predict([observation, tfActions]);
        return {tfActions, tfQValues};
    }

    /**
     * Get the estimation of the Q value given the state
     * and the action
     * @param state number[]
     * @param action [a, steering]
     */
    getQvalue(state, a){
        const st = tf.tensor2d([state]);
        const tfa = tf.tensor2d([a]);
        const q = this.critic.model.predict([st, tfa]);
        const v = q.buffer().values
        st.dispose();
        tfa.dispose();
        q.dispose();
        return v[0];
    }

    /**
     * @param observation (tf.tensor2d)
     * @return (tf.tensor1d)
     */
    predict(observation){
        const tfActions = this.actor.model.predict(observation);
        return tfActions;
    }

    /**
     * @param observation (tf.tensor2d)
     * @return (tf.tensor1d)
     */
    perturbedPrediction(observation){
        const tfActions = this.perturbedActor.model.predict(observation);
        return tfActions;
    }

    /**
     * Update the two target network
     */
    targetUpdate(){
        // Define in js/DDPG/models.js
        //assignModel(this.critic, this.criticTarget);
        //assignModel(this.actor, this.actorTarget);
        targetUpdate(this.criticTarget, this.critic, this.config);
        targetUpdate(this.actorTarget, this.actor, this.config);
    }
    
    trainCritic(tfActions, tfObs0, tfObs1, tfRewards, tfTerminals){

        const criticLoss = this.criticOptimiser.minimize(() => {
                const tfQPredictions0 = this.critic.model.predict([tfObs0, tfActions]);
            
                const tfAPredictions = this.actorTarget.model.predict(tfObs1);
                const tfQPredictions = this.criticTarget.model.predict([tfObs1, tfAPredictions]);
        
                const tfQTargets = tfRewards.add(tf.scalar(1).sub(tfTerminals).mul(this.tfGamma).mul(tfQPredictions));
        
                const loss = tf.sub(tfQTargets, tfQPredictions0).square().mean();
                return loss;
        }, true, this.criticWeights);

        setMetric("CriticLoss", criticLoss.buffer().values[0]);
        criticLoss.dispose();
    }

    trainActor(tfObs0, it){
        for (let i = 0; i < it; i++){
            const actorLoss = this.actorOptimiser.minimize(() => {
                const tfAPredictions0 = this.actor.model.predict(tfObs0); 
                const tfQPredictions0 = this.critic.model.predict([tfObs0, tfAPredictions0]);
                const loss = tf.mean(tfQPredictions0).mul(tf.scalar(-1));
                return loss;
            }, true, this.actorWeights);
            const vLoss = actorLoss.buffer().values[0];
            setMetric("ActorLoss", actorLoss.buffer().values[0]);
            actorLoss.dispose(); 
        }
    }

    getTfBatch(){
        // Get batch
        const batch = this.memory.getBatch(this.config.batchSize);
        // Convert to tensors
        const tfActions = tf.tensor2d(batch.actions);
        const tfObs0 = tf.tensor2d(batch.obs0);
        const tfObs1 = tf.tensor2d(batch.obs1);
        const _tfRewards = tf.tensor1d(batch.rewards);
        const _tfTerminals = tf.tensor1d(batch.terminals);

        const tfRewards = _tfRewards.expandDims(1);
        const tfTerminals = _tfTerminals.expandDims(1);

        _tfRewards.dispose();
        _tfTerminals.dispose();

        return {
            tfActions, tfObs0, tfObs1, tfRewards, tfTerminals
        }
    }

    async optimizeCritic(){
        const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        this.trainCritic(tfActions, tfObs0, tfObs1, tfRewards, tfTerminals);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();
    }

    async optimizeActor(it=1){
        const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        this.trainActor(tfObs0, it);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();
    }
}