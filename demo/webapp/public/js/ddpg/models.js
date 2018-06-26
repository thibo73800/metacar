/**
 * Copy a model
 * @param model Actor|Critic instance
 * @param instance Actor|Critic
 * @return Copy of the model
 */
function copyModel(model, instance){
    return tf.tidy(() => {
        nModel = new instance(model.config);
        // action might be not required
        nModel.buildModel(model.obs, model.action);
        const weights = model.model.weights;
        for (let m=0; m < weights.length; m++){
            nModel.model.weights[m].val.assign(weights[m].val);
        }
        return nModel;
    })
}

/**
 * Copy the value of of the model into the perturbedModel and
 * add a random pertubation
 * @param model Actor|Critic instance
 * @param perturbedActor Actor|Critic instance
 * @param stddev (number)
 * @return Copy of the model
 */
function assignAndStd(model, perturbedModel, stddev, seed){
    return tf.tidy(() => {
        const weights = model.model.trainableWeights;
        for (let m=0; m < weights.length; m++){
            let shape = perturbedModel.model.trainableWeights[m].val.shape;
            let randomTensor = tf.randomNormal(shape, 0, stddev, "float32", seed);
            let nValue = weights[m].val.add(randomTensor);
            perturbedModel.model.trainableWeights[m].val.assign(nValue);
        }
    });
}

/**
 * Update the target models
 * @param target Actor|Critic instance
 * @param perturbedActor Actor|Critic instance
 * @param config (Object)
 * @return Copy of the model
 */
function targetUpdate(target, original, config){
    return tf.tidy(() => {
        const originalW = original.model.trainableWeights;
        const targetW = target.model.trainableWeights;
    
        const one = tf.scalar(1);
        const tau = tf.scalar(config.tau);
    
        for (let m=0; m < originalW.length; m++){
            const lastValue = target.model.trainableWeights[m].val.clone();
            let nValue = tau.mul(originalW[m].val).add(targetW[m].val.mul(one.sub(tau)));
            target.model.trainableWeights[m].val.assign(nValue);
            const diff = lastValue.sub(target.model.trainableWeights[m].val).mean().buffer().values;
            if (diff[0] == 0){
                console.warn("targetUpdate: Nothing have been changed!")
            }
        }
    });
}


class Actor{

    /**
        @param config (Object)
     */
    constructor(config) {
        this.stateSize = config.stateSize;
        this.nbActions = config.nbActions;
        this.layerNorm = config.layerNorm;

        this.firstLayerSize = config.actorFirstLayerSize;
        this.secondLayerSize = config.actorSecondLayerSize;

        this.seed = config.seed;
        this.config = config;
        this.obs = null;
    }

    /**
     * 
     * @param obs tf.input
     */
    buildModel(obs){
        this.obs = obs;

        // First layer
        this.firstLayer = tf.layers.dense({
            units: this.firstLayerSize,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'relu',
            useBias: true,
            biasInitializer: "zeros"
        });
        // Second layer
        this.secondLayer = tf.layers.dense({
            units: this.secondLayerSize,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'relu',
            useBias: true,
            biasInitializer: "zeros"
        });
        // Ouput layer
        this.outputLayer = tf.layers.dense({
            units: this.nbActions,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'tanh',
            useBias: true,
            biasInitializer: "zeros"
        });
        // Actor prediction
        this.predict = (tfState) => {
            return tf.tidy(() => {               
                if (tfState){
                    obs = tfState;
                }

                let l1 = this.firstLayer.apply(obs);
                let l2 = this.secondLayer.apply(l1);

                return this.outputLayer.apply(l2);
            });
        }
        const output = this.predict();
        this.model = tf.model({inputs: obs, outputs: output});
    }
};

class Critic {

    /**
     * @param config (Object)
     */
    constructor(config) {
        this.stateSize = config.stateSize;
        this.nbActions = config.nbActions;
        this.layerNorm = config.layerNorm;

        this.firstLayerSSize = config.criticFirstLayerSSize
        this.firstLayerASize = config.criticFirstLayerASize;
        this.secondLayerSize = config.criticSecondLayerSize;

        this.seed = config.seed;
        this.config = config;
        this.obs = null;
        this.action = null;
    }

    /**
     * 
     * @param obs tf.input
     * @param action tf.input
     */
    buildModel(obs, action){
        this.obs = obs;
        this.action = action;

        // Used to merged the two first Layer later.
        this.add = tf.layers.add();

        // First layer
        this.firstLayerS = tf.layers.dense({
            units: this.firstLayerSSize,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        // First layer
        this.firstLayerA = tf.layers.dense({
            units: this.firstLayerASize,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        // Second layer
        this.secondLayer = tf.layers.dense({
            units: this.secondLayerSize,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'relu',
            useBias: true,
            biasInitializer: "zeros"
        });

        // Ouput layer
        this.outputLayer = tf.layers.dense({
            units: 1,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'linear',
            useBias: true,
            biasInitializer: "zeros"
        });
        
        // Critic prediction
        this.predict = (tfState, tfActions) => {
            return tf.tidy(() => {
                if (tfState && tfActions){
                    obs = tfState;
                    action = tfActions;
                }
                
                let l1A = this.firstLayerA.apply(action);
                let l1S = this.firstLayerS.apply(obs)
                // Merged layers
                let concat = this.add.apply([l1A, l1S])

                let l2 = this.secondLayer.apply(concat);
               
               return this.outputLayer.apply(l2);
            });
        }

        const output = this.predict();
        this.model = tf.model({inputs: [obs, action], outputs: output});
    }
};
