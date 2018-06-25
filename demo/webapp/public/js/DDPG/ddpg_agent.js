
// This class is called from js/DDPG/index.js
class DDPGAgent {

    /**
     * @param env (metacar.env) Set in js/DDPG/index.js
     */
    constructor(env){
        this.stopTraining = false;
        this.env = env;
        // Default Config
        this.config = {
            "stateSize": 17,
            "nbActions": 2,
            "layerNorm": false,
            "normalizeObservations": true,
            "seed": 0,
            "criticL2Reg": 0.01,
            "batchSize": 64,
            "actorLr": 0.0001,
            "criticLr": 0.001,
            "memorySize": 20000,
            "gamma": 0.99,
            "noiseDecay": 0.99,
            "rewardScale": 1,
            "nbEpochs": 500,
            "nbEpochsCycle": 20,
            "nbTrainSteps": 50,
            "tau": 0.01,
            "paramNoiseAdaptionInterval": 50,
        };
        // From js/DDPG/noise.js
        this.noise = new AdaptiveParamNoiseSpec();

        // Configure components.

        // Buffer replay
        // The baseline use 1e6 but this size should be enough for this problem
        this.memory = new Memory(this.config.memorySize);
        // Actor and Critic are from js/DDPG/models.js
        this.actor = new Actor(this.config);
        this.critic = new Critic(this.config);

        // Seed javascript
        Math.seedrandom(0);

        this.rewardsList = [];
        this.epiDuration = [];

        // DDPG
        this.ddpg = new DDPG(this.actor, this.critic, this.memory, this.noise, this.config);
    }

    /**
     * Play one step
     */
    play(){
        // Get the current state
        const state = this.env.getState().linear;
        // Pick an action
        const tfActions = this.ddpg.predict(tf.tensor2d([state]));
        const actions = tfActions.buffer().values;
        agent.env.step([actions[0], actions[1]]);
        tfActions.dispose();
    }

    /**
     * Get the estimation of the Q value given the state
     * and the action
     * @param state number[]
     * @param action [a, steering]
     */
    getQvalue(state, a){
        return this.ddpg.getQvalue(state, a);
    }

    stop(){
        this.stopTraining = true;
    }

    /**
     * Step into the training environement
     * @param tfPreviousStep (tf.tensor2d) Current state
     * @param mPreviousStep number[]
     * @return {done, state} One boolean and the new state
     */
    stepTrain(tfPreviousStep, mPreviousStep){
        // Get actions
        const tfActions = this.ddpg.perturbedPrediction(tfPreviousStep);
        //const TruetfActions = this.ddpg.perturbedPrediction(tfPreviousStep);
        //const rdNormal = tf.randomNormal(TruetfActions.shape, 0, this.noisyActions, "float32", this.config.seed);
        //const noisyActions = TruetfActions.add(rdNormal);
        //const tfActions = tf.clipByValue(noisyActions, -1, 1);

        // Step in the environment with theses actions
        let mAcions = tfActions.buffer().values;
        let mReward = this.env.step([mAcions[0], mAcions[1]]);
        this.rewardsList.push(mReward);
        // Get the new observations
        let mState = this.env.getState().linear;
        let tfState = tf.tensor2d([mState]);
        let mDone = 0;

        if (mReward == -1){
            mDone = 1;
        }

        // Add the new tuple to the buffer
        this.ddpg.memory.append(mPreviousStep, [mAcions[0], mAcions[1]], mReward, mState, mDone);

        // Dispose tensor
        tfPreviousStep.dispose();
        //TruetfActions.dispose();
        //noisyActions.dispose();
        tfActions.dispose();
        //rdNormal.dispose();
        //rd.dispose();
        //trueTfActions.dispose();
        return {mDone, mState, tfState}
    }

    initTrainParam(){
        this.stopTraining = false;
        this.noisyActions = 2.0;
    }

    /**
     * Train DDPG Agent
     */
    async train(realTime){
        this.initTrainParam();
        // One epoch
        for (let e=0; e < this.config.nbEpochs; e++){
            // Perform cycles.
            this.rewardsList = [];
            this.stepList = [];
            this.distanceList = [];
            for (let c=0; c < this.config.nbEpochsCycle; c++){

                if (c%10==0){
                    logTfMemory();
                }

                // Perform rollouts.
                // Get current observation
                let mPreviousStep = this.env.getState().linear;
                let tfPreviousStep = tf.tensor2d([mPreviousStep]);
                let step = 0;

                console.time("LoopTime");
                for (step=0; step < 800; step++){
                    let rel = this.stepTrain(tfPreviousStep, mPreviousStep);
                    mPreviousStep = rel.mState;
                    tfPreviousStep = rel.tfState;
                    if (rel.mDone){
                        break;
                    }
                    if (this.stopTraining){
                        this.env.render(true);
                        return;
                    }
                    if (realTime && step % 10 == 0)
                        await tf.nextFrame();
                }
                this.stepList.push(step);
                console.timeEnd("LoopTime");
                let distance = this.ddpg.adaptParamNoise();
                this.distanceList.push(distance[0]);

                this.env.randomRoadPosition();
                tfPreviousStep.dispose();
                console.log("e="+ e +", c="+c);
         
                //this.ddpg.targetUpdate();
                await tf.nextFrame();
            }
            if (this.ddpg.memory.length == this.config.memorySize){
                this.noisyActions = Math.max(0.1, this.noisyActions * this.config.noiseDecay);
                this.ddpg.noise.desiredActionStddev = Math.max(0.1, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
                let lossValuesCritic = [];
                let lossValuesActor = [];
                console.time("Training");                
                for (let t=0; t < 100; t++){
                    let lossC = this.ddpg.optimizeCritic();
                    lossValuesCritic.push(lossC);
                }
                for (let t=0; t < 100; t++){
                    let lossA = this.ddpg.optimizeActor();
                    lossValuesActor.push(lossA);
                }
                console.timeEnd("Training");
                console.log("desiredActionStddev:", this.ddpg.noise.desiredActionStddev);
                setMetric("CriticLoss", mean(lossValuesCritic));
                setMetric("ActorLoss", mean(lossValuesActor));
            } 
            setMetric("Reward", mean(this.rewardsList));
            setMetric("EpisodeDuration", mean(this.stepList));
            setMetric("Distance", mean(this.distanceList));
            await tf.nextFrame();
        }
            

            this.env.render(true);
        }

};