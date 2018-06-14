
class PolicyAgent {
    /*
        Policy Agent
    */

    constructor(env) {
        // Number of timestep for one episode
        this.lidarPts = 5;
        this.ttLidarPts = 5*5;
        this.actionsNb = 3;

        this.env = env

        // Build the policy model and the value model
        this.buildValueFc();
        this.buildPolicy();
    }

    buildValueFc(){
        /*
            Build the Value function
            @weights (Object) Weights for the layer
        */
        const LEARNING_RATE = 0.05;
        const value_optimizer = tf.train.adam(LEARNING_RATE);
        /*
            -----------------------
            ** -- Value Model -- **
            -----------------------
        */
        this.valueModel = tf.sequential();
        // First Hidden Layer
        this.valueF1 = tf.layers.dense({
            inputShape: this.ttLidarPts,
            units: 9,
            kernelInitializer: 'randomNormal',
            activation: 'tanh'
        });
        this.valueModel.add(this.valueF1);
        // Output of the value function
        this.valueF2 = tf.layers.dense({
            units: 1,
            kernelInitializer: "randomNormal",
            activation: 'linear',
            inputShape: 9,
        });
        this.valueModel.add(this.valueF2);
        // Compile the value model
        this.valueModel.compile({
          optimizer: value_optimizer,
          loss: 'meanSquaredError',
          metrics: [],
        });
    }

    buildPolicy(){
        /*
            Build the policy network
            @weights (Object) Weights for the layer
        */
        const LEARNING_RATE = 0.05;
        this.policy_optimizer = tf.train.adam(LEARNING_RATE);
        /*
            -----------------------
            ** -- Policy Model -- **
            -----------------------
        */
        this.policyInput = tf.input({shape: [this.ttLidarPts]});
        // First layer
        this.policyF1 = tf.layers.dense({
            inputShape: this.ttLidarPts,
            units: 9,
            kernelInitializer: 'randomNormal',
            activation: 'tanh'
        });
        // Second layer
        this.policyF2 = tf.layers.dense({
            units: this.actionsNb,
            kernelInitializer: 'randomNormal',
            activation: 'softmax',
            inputShape: 9,
        });
        // Return the softmax of the policy
        this.policyPredict = (state) => {
            return tf.tidy(() => {
                return this.policyF2.apply(this.policyF1.apply(state));
            });
        }
        // Loss function -log(p)*advantages
        this.policy_loss = (softmaxs, actions, advantages) => {
            return tf.tidy(() => {
                const one_hot = tf.oneHot(actions, this.actionsNb);
                const log_term = tf.log(tf.sum(tf.mul(softmaxs, one_hot.asType("float32")), 1));
                const loss = tf.mul(tf.scalar(-1), tf.sum(tf.mul(advantages, log_term)) );
                return loss;
            });
        }
        // Usefull method to get the entropy of the softmax
        this.policy_entropy = (softmaxs) => {
            return tf.tidy(() => {
                return tf.mul(tf.scalar(-1), tf.sum(tf.mul(tf.log(softmaxs), softmaxs)));
            });
        }
        const output = this.policyF2.apply(this.policyF1.apply(this.policyInput))
        this.policyModel = tf.model({inputs: this.policyInput, outputs: output});
    }

    trainValueFc(inputs, targets, mini_batch_size){
        /*
            Train the value model
            @inputs (tf.tensor)
            @targets (tf.tensor)
            @mini_batch_size (Integer) Size of each mini batch
        */
        return this.valueModel.fit(
              inputs, targets, {
              batchSize: mini_batch_size,
              epochs: 1
        });
    }

    trainPolicy(states, actions, advantages, batch_size, mini_batch_size){
        /*
            Train the policy model
            @states Tensor2D
            @actions Tensor2D
            @advantages Tensor2D
            @batch_size (Integer) Size of the batch size
            @mini_batch_size (Integer) Size of each mini batch size
         */
        const size = states.shape[0];

        for (var b = 0; b < batch_size; b+=mini_batch_size) {
        
            let to = (b + mini_batch_size < size) ?  mini_batch_size  : (size - b);

            const tf_states = states.slice(b, to);
            const tf_actions = actions.slice(b, to);
            const tf_advantages = advantages.slice(b, to);

            this.policy_optimizer.minimize(() => {
                let softmaxs = this.policyPredict(tf_states);
                let loss = this.policy_loss(softmaxs, tf_actions, tf_advantages);
                return loss;
            });

            tf_states.dispose();
            tf_actions.dispose();
            tf_advantages.dispose();
        }
    }

    setDefaultTrainingValues(){
        this.gamma = 0.95;
        // Maximum number of step per episode
        this.nb_step = 800;
        this.mini_batch_size = 200;
        this.episodeNb = 100;
    }

    save(env){
        /*
            Save the network
        */
       this.valueModel.save('downloads://value-model-policy-agent');
       this.policyModel.save('downloads://policy-model-policy-agent');
    }

    async restore(){
        /*
            Restore the weights of the network
        */
       this.valueModel = await tf.loadModel('http://localhost:3000/public/models/policy/value-model-policy-agent.json');
       this.policyModel = await tf.loadModel("http://localhost:3000/public/models/policy/policy-model-policy-agent.json");
    }

    play(){
        tf.tidy(() => {
            // Get the current state
            const st = tf.tensor2d(this.env.getState(), [this.lidarPts, this.lidarPts]).reshape([1, this.ttLidarPts]);
            // Predict the policy
            const softmax = this.policyModel.predict(st);
            softmax.print();
            // Get the action
            const argmax = softmax.argMax(1);
            const a = argmax.buffer().values[0];

            argmax.dispose();
            st.dispose();
            softmax.dispose();

            this.env.step(a);
        });
    }

    stop(){
        /*
            We stop the training process (if a training is running)
        */
        this.episodeNb = 0;
    }

    train(env, it=0){
        if (it == 0)
            this.setDefaultTrainingValues();
        if (it >= this.episodeNb){
            this.env.render(true); // Render the canvas again
            return;
        }
        console.log("Training it=", it, "/", this.episodeNb);

        (async () => {
            // Get the current state
            let reward = 0;
            const rewards = [];
            const states = [];
            const stateValues = [];
            const actions = [];

            console.log("---");
            console.time("Exploring");
            for (var step = 0; step < this.nb_step; step++) {
                // Get the current state
                const array_st = this.env.getState(true);
                // Convert the state into a tensor
                //const st = tf.tensor(array_st, [this.lidarPts, this.lidarPts]).reshape([1, this.ttLidarPts]);
                const st = tf.tensor2d([array_st]);
                // Predict the policy
                const softmax = this.policyModel.predict(st);
                // Predict the value
                const value = this.valueModel.predict(st);
                // Get the action. Pseudo Random choice. We prefer action with
                // Higher probability
                const action = randomChoice(softmax.buffer().values);
                // Create the next batch
                rewards.push(reward);
                states.push(array_st);
                stateValues.push(value);
                actions.push(action);
                // Stop the episode if the car go out of the road or crash an
                // other car
                if (reward == -10){
                    softmax.dispose();
                    st.dispose();
                    break;
                }
                softmax.dispose();
                st.dispose();
                // Step in the environement with this action
                reward = this.env.step(action);
            }
            // Size of the next batches && minibatches
            const batch_size = rewards.length;
            const mini_batch_size = Math.min(this.mini_batch_size, batch_size);

            console.log("Episode duration:", step);
            console.log("Mean rewards:", mean(rewards));
            console.timeEnd("Exploring");

            let advantages = [];
            let returns = [];
            let G = 0.0;
            // Compute the total reward for each state
            for (let t = batch_size - 1; t >= 0; t--){
                G = rewards[t] + (this.gamma*G);
                returns.push(G);
                // Predict the value function for this state
                const V = stateValues[t];
                // Advantage
                advantages.push(G - V.buffer().values[0]);
                V.dispose();
            }
            returns = returns.reverse();
            advantages = advantages.reverse();

            // Train the value model
            const tf_batch_states = tf.tensor2d(states);
            const tf_value_target = tf.tensor1d(returns);
            const tf_actions = tf.tensor1d(actions, "int32");
            const tf_advantages = tf.tensor1d(advantages);
            await this.trainValueFc(tf_batch_states, tf_value_target, mini_batch_size);
            // Train the policy model
            this.trainPolicy(tf_batch_states, tf_actions, tf_advantages, batch_size, mini_batch_size);

            tf_batch_states.dispose();
            tf_value_target.dispose();
            tf_actions.dispose();
            tf_advantages.dispose();

            // Set the agent on a new free road
            this.env.randomRoadPosition();
            //env.reset();
            // Go to the next episode
            this.train(this.env, it+1);
        })();
    }
}