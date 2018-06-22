
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
            "stateSize": 26,
            "nbActions": 2,
            "layerNom": true,
            "normalizeObservations": true,
            "seed": 0,
            "criticL2Reg": 0.01,
            "batchSize": 32,
            "actorLr": 0.0001,
            "criticLr": 0.001,
            "gamma": 0.99,
            "rewardScale": 1,
            "nbEpochs": 500,
            "nbEpochsCycle": 100,
            "nbTrainSteps": 50,
            "tau": 0.001,
            "paramNoiseAdaptionInterval": 50,
        };
        // From js/DDPG/noise.js
        this.noise = new AdaptiveParamNoiseSpec();

        // Configure components.

        // Buffer replay
        // The baseline use 1e6 but this size should be enough for this problem
        this.memoryPos = new Memory(5000);
        this.memoryNeg = new Memory(5000);
        // Actor and Critic are from js/DDPG/models.js
        this.actor = new Actor(this.config);
        this.critic = new Critic(this.config);

        // Seed javascript
        Math.seedrandom(0);

        this.rewardsList = [];

        // DDPG
        this.ddpg = new DDPG(this.actor, this.critic, this.memoryPos, this.memoryNeg, this.noise, this.config);
    }

    /**
     * Play one step
     */
    play(){
        // Get the current state
        const state = agent.env.getState().linear;
        // Pick an action
        const tfActions = agent.ddpg.predict(tf.tensor2d([state]));
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
        if (mReward >= 0)
            this.ddpg.memoryPos.append(mPreviousStep, [mAcions[0], mAcions[1]], mReward, mState, mDone);
        else
            this.ddpg.memoryNeg.append(mPreviousStep, [mAcions[0], mAcions[1]], mReward, mState, mDone);

        // Dispose tensor
        tfPreviousStep.dispose();
        tfActions.dispose();
        return {mDone, mState, tfState}
    }

    /**
     * Train DDPG Agent
     */
    async train(realTime){
        this.stopTraining = false;
        // One epoch
        for (let e=0; e < this.config.nbEpochs; e++){
            // Perform cycles.
            for (let c=0; c < this.config.nbEpochsCycle; c++){
                if (c%10==0){
                    logTfMemory();
                }
                this.rewardsList = [];
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
                    if (realTime)
                        await tf.nextFrame();
                }
                console.timeEnd("LoopTime");
                this.env.reset();
                tfPreviousStep.dispose();
                // Mean is define is js/utils.js                
                console.log("e="+ e +", c="+c);
                setMetric("Reward", mean(this.rewardsList));
                setMetric("EpisodeDuration", step);
                this.ddpg.adaptParamNoise();
                await tf.nextFrame();
            }
            console.time("LoopTrain");
            for (let t=0; t < 100; t++){
                this.ddpg.optimizeCritic();
            }
            for (let t=0; t < 100; t++){
                this.ddpg.optimizeActor();
            }
            console.timeEnd("LoopTrain");
            this.ddpg.targetUpdate();
        }
        this.env.render(true);
    }

};