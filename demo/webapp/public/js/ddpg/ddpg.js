
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
    constructor(actor, critic, memory, noise, config){
        this.actor = actor;
        this.critic = critic;
        this.memory = memory;
        this.noise = noise;
        this.config = config;
        this.tfGamma = tf.scalar(config.gamma);

        // Inputs
        this.obsInput = tf.input({batchShape: [null, this.config.stateSize]});
        this.actionInput = tf.input({batchShape: [null, this.config.nbActions]});

        // Randomly Initialize actor network μ(s)
        this.actor.buildModel(this.obsInput);
        // Randomly Initialize critic network Q(s, a)
        this.critic.buildModel(this.obsInput, this.actionInput);

 
        // Define in js/DDPG/models.js
        // Init target network Q' and μ' with the same weights
        this.actorTarget = copyModel(this.actor, Actor);
        this.criticTarget = copyModel(this.critic, Critic);
        // Perturbed Actor (See parameter space noise Exploration paper)
        this.perturbedActor = copyModel(this.actor, Actor);
        //this.adaptivePerturbedActor = copyModel(this.actor, Actor);

        this.setLearningOp();
    }

    setLearningOp(){
        this.criticWithActor = (tfState) => {
            return tf.tidy(() => {
                const tfAct = this.actor.predict(tfState);
                return this.critic.predict(tfState, tfAct);
            });
        };
        this.criticTargetWithActorTarget = (tfState) => {
            return tf.tidy(() => {
                const tfAct = this.actorTarget.predict(tfState);
                return this.criticTarget.predict(tfState, tfAct);
            });
        };

        this.actorOptimiser = tf.train.adam(this.config.actorLr);
        this.criticOptimiser = tf.train.adam(this.config.criticLr);

        this.criticWeights = [];
        for (let w = 0; w < this.critic.model.trainableWeights.length; w++){
            this.criticWeights.push(this.critic.model.trainableWeights[w].val);
        }
        this.actorWeights = [];
        for (let w = 0; w < this.actor.model.trainableWeights.length; w++){
            this.actorWeights.push(this.actor.model.trainableWeights[w].val);
        }

        assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev, this.config.seed);
    }


    /**
     * Distance Measure for DDPG
     * See parameter space noise Exploration paper
     * @param observations (Tensor2d) Observations
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
        if (batch.obs0.length == 0){
            assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev, this.config.seed);
            return [0];
        }

        let distanceV = null;

        if (batch.obs0.length > 0){
            const tfObs0 = tf.tensor2d(batch.obs0);
            const distance = this.distanceMeasure(tfObs0);
    
            assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev, this.config.seed);
    
            distanceV = distance.buffer().values;
            this.noise.adapt(distanceV[0]);

            distance.dispose();
            tfObs0.dispose();
        }

        return distanceV;
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
        targetUpdate(this.criticTarget, this.critic, this.config);
        targetUpdate(this.actorTarget, this.actor, this.config);
    }
    
    trainCritic(batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals){

        let costs; 

        const criticLoss = this.criticOptimiser.minimize(() => {
                const tfQPredictions0 = this.critic.model.predict([tfObs0, tfActions]);
                const tfQPredictions1 = this.criticTargetWithActorTarget(tfObs1);
                
                const tfQTargets = tfRewards.add(tf.scalar(1).sub(tfTerminals).mul(this.tfGamma).mul(tfQPredictions1));
        
                const erros = tf.sub(tfQTargets, tfQPredictions0).square();
                costs = erros.buffer().values;

                return erros.mean();
        }, true, this.criticWeights);

        // For experience Replay
        this.memory.appendBackWithCost(batch, costs);

        const loss = criticLoss.buffer().values[0];
        criticLoss.dispose();

        targetUpdate(this.criticTarget, this.critic, this.config);

        return loss;
    }

    trainActor(tfObs0){

        const actorLoss = this.actorOptimiser.minimize(() => {
            const tfQPredictions0 = this.criticWithActor(tfObs0); 
            return tf.mean(tfQPredictions0).mul(tf.scalar(-1.))
        }, true, this.actorWeights);

        targetUpdate(this.actorTarget, this.actor, this.config);

        const loss = actorLoss.buffer().values[0];
        actorLoss.dispose(); 

        return loss;
    }

    getTfBatch(){
        // Get batch
        const batch = this.memory.popBatch(this.config.batchSize);
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
            batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals
        }
    }

    optimizeCritic(){
        const {batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const loss = this.trainCritic(tfActions, tfObs0, tfObs1, tfRewards, tfTerminals);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return loss;
    }

    optimizeActor(){
        const {batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const loss = this.trainActor(tfObs0);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return loss;
    }

    optimizeCriticActor(){
        const {batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const lossC = this.trainCritic(batch, tfActions, tfObs0, tfObs1, tfRewards, tfTerminals);
        const lossA = this.trainActor(tfObs0);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return {lossC, lossA};
    }
}