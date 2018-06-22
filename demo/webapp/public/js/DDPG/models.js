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
 * Usefull method to copy a model
 * @param model Actor
 * @param perturbedActor Actor
 * @param stddev (number)
 * @return Copy of the model
 */
function assignAndStd(actor, perturbedActor, stddev){
    return tf.tidy(() => {
        const weights = actor.model.weights;
        for (let m=0; m < weights.length; m++){
            let shape = perturbedActor.model.weights[m].val.shape;
            let randomTensor = tf.randomNormal(shape, 0, stddev);
            let nValue = weights[m].val.add(randomTensor);
            perturbedActor.model.weights[m].val.assign(nValue);
        }
    });
}

/**
 * Usefull method to copy a model
 * @param model Actor
 * @param perturbedActor Actor
 * @return Copy of the model
 */
function assignModel(model, targetModel){
    return tf.tidy(() => {
        const weights = model.model.weights;
        for (let m=0; m < weights.length; m++){
            let nValue = weights[m].val;
            targetModel.model.weights[m].val.assign(nValue);
        }
    });
}


/**
 * Usefull method to copy a model
 * @param target Actor|Critic
 * @param perturbedActor Actor|Critic
 * @param config (Object)
 * @return Copy of the model
 */
function targetUpdate(target, original, config){
    return tf.tidy(() => {
        const originalW = original.model.weights;
        const targetW = target.model.weights;
    
        const one = tf.scalar(1);
        const tau = tf.scalar(config.tau);
    
        for (let m=0; m < originalW.length; m++){
            let nValue = tau.mul(originalW[m].val).add(targetW[m].val.mul(one.sub(tau)));
            target.model.weights[m].val.assign(nValue);
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


        this.firstLayerBatchNorm = null;    
        this.secondLayerBatchNorm = null;

        this.relu1 = tf.layers.activation({activation: 'relu'});
        //this.relu2 = tf.layers.activation({activation: 'relu'});

        // First layer with BatchNormalization
        this.firstLayer = tf.layers.dense({
            units: 64,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        if (this.layerNorm){
            // WARNING: BatchNormalization instead of layerNormalization
            this.firstLayerBatchNorm = tf.layers.batchNormalization({
                scale: true,
                center: true
            });
        }
        
        /*
        // Second layer with BatchNormalization
        this.secondLayer = tf.layers.dense({
            units: 64,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        if (this.layerNorm){
            // WARNING: BatchNormalization instead of layerNormalization
            this.secondLayerBatchNorm = tf.layers.batchNormalization({
                scale: true,
                center: true
            });
        }*/

        // Ouput layer
        this.outputLayer = tf.layers.dense({
            units: this.nbActions,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'tanh',
            useBias: true,
            biasInitializer: "zeros"
        });

        this.predict = () => {
            return tf.tidy(() => {
                let l1 = this.firstLayer.apply(obs);
                if (this.firstLayerBatchNorm){
                    l1 = this.firstLayerBatchNorm.apply(l1);
                }
                l1 = this.relu1.apply(l1);
                /*
                let l2 = this.secondLayer.apply(l1);
                if (this.secondLayerBatchNorm){
                    l2 = this.secondLayerBatchNorm.apply(l2);
                }
                l2 = this.relu2.apply(l2);
                */
                
                return this.outputLayer.apply(l1);
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

        this.firstLayerBatchNorm = null;    
        this.secondLayerBatchNorm = null;

        this.relu1 = tf.layers.activation({activation: 'relu'});
        this.relu2 = tf.layers.activation({activation: 'relu'});
        this.concat = tf.layers.concatenate();

        // First layer with BatchNormalization
        this.firstLayer = tf.layers.dense({
            units: 64,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        if (this.layerNorm){
            // WARNING: BatchNormalization instead of layerNormalization
            this.firstLayerBatchNorm = tf.layers.batchNormalization({
                scale: true,
                center: true
            });
        }

        // Second layer with BatchNormalization
        this.secondLayer = tf.layers.dense({
            //inputShape: [this.config.batchSize, 64 + this.nbActions], // Previous layer + action
            units: 64,
            kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
            activation: 'linear', // relu is add later
            useBias: true,
            biasInitializer: "zeros"
        });
        if (this.layerNorm){
            // WARNING: BatchNormalization instead of layerNormalization
            this.secondLayerBatchNorm = tf.layers.batchNormalization({
                scale: true,
                center: true
            });
        }

        // Ouput layer
        this.outputLayer = tf.layers.dense({
            units: 1,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'linear',
            useBias: true,
            biasInitializer: "zeros"
        });
        
        // Actor prediction
        this.predict = () => {
            return tf.tidy(() => {
                let l1 = this.firstLayer.apply(obs);
                l1 = this.concat.apply([l1, action]);
                if (this.firstLayerBatchNorm){
                    l1 = this.firstLayerBatchNorm.apply(l1);
                }
                l1 = this.relu1.apply(l1);

                let l2 = this.secondLayer.apply(l1);
                if (this.secondLayerBatchNorm){
                    l2 = this.secondLayerBatchNorm.apply(l2);
                }
                l2 = this.relu2.apply(l2);

                return this.outputLayer.apply(l2);
            });
        }
        const output = this.predict();
        this.model = tf.model({inputs: [obs, action], outputs: output});
    }
};
