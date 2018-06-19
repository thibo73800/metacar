// This class is called from js/DDPG/index.js
class DDPG {

    constructor(){
        // Default Config
        this.config = {
            "stateSize": 25,
            "nbActions": 2,
            "layerNom": true,
            "normalizeObservations": true,
            "seed": 0,
            "criticL2Reg": 0.01,
            "batchSize": 64,
            "actorLr": 0.0001,
            "criticLr": 0.001,
            "gamma": 0.99,
            "rewardScale": 1,
            "nbEpochs": 500,
            "nbEpochsCycle": 800,
            "nbTrainSteps": 50,
            "nbRolloutStep": 100
        };
        // Inputs
        const obsInput = tf.input({shape: [this.config.stateSize]});
        const actionInput = tf.input({shape: [this.config.nbActions]});

        // From js/DDPG/noise.js
        this.paramNoise = new AdaptiveParamNoiseSpec();
        // Buffer replay
        // The baseline use 1e6 but this size should be enough
        this.memory = new Memory(1000);
        // Actor and Critic are from js/DDPG/models.js
        this.actor = new Actor(
                this.config.stateSize, this.config.nbActions, this.config.layerNom, this.config.seed);
        this.critic = new Critic(
                this.config.stateSize, this.config.nbActions, this.config.layerNom, this.config.seed);
        this.actor.buildModel(obsInput);
        this.critic.buildModel(obsInput, actionInput);
    }
};