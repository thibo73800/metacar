
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

        this.trainActorCt = 0;
        this.trainCriticCt = 0;
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
                const tfQPredictions1 = this.criticTargetWithActorTarget(tfObs1);
                
                const tfQTargets = tfRewards.add(tf.scalar(1).sub(tfTerminals).mul(this.tfGamma).mul(tfQPredictions1));
        
                return tf.sub(tfQTargets, tfQPredictions0).square().mean();
        }, true, this.criticWeights);

        const loss = criticLoss.buffer().values[0];
        criticLoss.dispose();

        //if (this.trainCriticCt % 200 == 0 && this.trainCriticCt != 0){
        targetUpdate(this.criticTarget, this.critic, this.config);
            //console.log("Update");
            // Saniity Check
        //}
        this.trainCriticCt += 1;

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
        //sanityTfLoss.dispose();

        return loss;
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

    optimizeCritic(){
        const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const loss = this.trainCritic(tfActions, tfObs0, tfObs1, tfRewards, tfTerminals);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return loss;
    }

    optimizeActor(it=1){
        const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const loss = this.trainActor(tfObs0, it);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return loss;
    }

    optimizeCriticActor(){
        const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();

        const lossC = this.trainCritic(tfActions, tfObs0, tfObs1, tfRewards, tfTerminals);
        const lossA = this.trainActor(tfObs0);

        tfActions.dispose();
        tfObs0.dispose();
        tfObs1.dispose(); 
        tfRewards.dispose();
        tfTerminals.dispose();

        return {lossC, lossA};
    }

    trainRecord(){

        let lossValues = [];

        for (let i=0; i < 32; i++){

            const {tfActions, tfObs0, tfObs1, tfRewards, tfTerminals} = this.getTfBatch();
    
            const actorLoss = this.actorOptimiser.minimize(() => {
                const tfAPredictions0 = this.actor.model.predict(tfObs0); 
                const loss = tfActions.sub(tfAPredictions0).square().mean();
                return loss;
            }, true, this.actorWeights);
    
            const loss = actorLoss.buffer().values[0];
            lossValues.push(loss);

            actorLoss.dispose(); 
            tfActions.dispose();
            tfObs0.dispose();
            tfObs1.dispose(); 
            tfRewards.dispose();
            tfTerminals.dispose();
        }
        console.log("Mean loss", mean(lossValues));
    }

}