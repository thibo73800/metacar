
class Actor{

    /**
     * @param stateSize(number)
     * @param nbActions (number)
     * @param layerNorm (boolean)
     * @param seed (number)
     */
    constructor(stateSize, nbActions, layerNorm, seed) {
        this.stateSize = stateSize;
        this.nbActions = nbActions;
        this.layerNorm = layerNorm;
        this.seed = seed;
    }

    /**
     * 
     * @param obs tf.input
     */
    buildModel(obs){
        this.firstLayerBatchNorm = null;    
        this.secondLayerBatchNorm = null;

        this.relu = tf.layers.thresholdedReLU();

        // First layer with BatchNormalization
        this.firstLayer = tf.layers.dense({
            inputShape: this.stateSize,
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
            inputShape: 64,
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
            inputShape: 64,
            units: this.nbActions,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'tanh',
            useBias: true,
            biasInitializer: "zeros"
        });
        
        // Actor prediction
        const predict = () => {
            return tf.tidy(() => {
                let l1 = this.firstLayer.apply(obs);
                if (this.firstLayerBatchNorm){
                    l1 = this.firstLayerBatchNorm.apply(l1);
                }
                //l1 = this.relu.apply(l1);
                let l2 = this.secondLayer.apply(l1);
                if (this.secondLayerBatchNorm){
                    l2 = this.secondLayerBatchNorm.apply(l2);
                }
                //l2 = this.relu.apply(l2);
                return this.outputLayer.apply(l2);
            });
        }
        const output = predict();
        this.model = tf.model({inputs: this.obs, outputs: output});
    }

};

class Critic {

    /**
     * @param stateSize(number)
     * @param nbActions (number)
     * @param layerNorm (boolean)
     * @param seed (number)
     */
    constructor(stateSize, nbActions, layerNorm, seed) {
        this.stateSize = stateSize;
        this.nbActions = nbActions;
        this.layerNorm = layerNorm;
    }

    /**
     * 
     * @param obs tf.input
     * @param action tf.input
     */
    buildModel(obs, action){
        this.firstLayerBatchNorm = null;    
        this.secondLayerBatchNorm = null;

        this.relu = tf.layers.thresholdedReLU();

        // First layer with BatchNormalization
        this.firstLayer = tf.layers.dense({
            inputShape: this.stateSize,
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
            inputShape: 64 + this.nbActions, // Previous layer + action
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
            inputShape: 64,
            units: 1,
            kernelInitializer: tf.initializers.randomUniform({
                minval: 0.003, maxval: 0.003, seed: this.seed}),
            activation: 'tanh',
            useBias: true,
            biasInitializer: "zeros"
        });
        
        // Actor prediction
        const predict = () => {
            return tf.tidy(() => {
                let l1 = this.firstLayer.apply(obs);
                l1 = l1.concat(action);
                if (this.firstLayerBatchNorm){
                    l1 = this.firstLayerBatchNorm.apply(l1);
                }
                //l1 = this.relu(l1);
                let l2 = this.secondLayer.apply(l1);
                if (this.secondLayerBatchNorm){
                    l2 = this.secondLayerBatchNorm.apply(l2);
                }
                //l2 = this.relu.apply(l2);
                return this.outputLayer.apply(l2);
            });
        }
        const output = predict();
        this.model = tf.model({inputs: this.obs, outputs: output});
    }

};
