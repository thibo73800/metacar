
class QTableAgent {
    /*
        Monte Carlo Agent
    */

    constructor(env) {
        this.env = env;
        this.Q = {};
        this.m = 0;
    }

    save(){
        let save_content = JSON.stringify(this.Q);
        console.log(save_content);
        this.env.save(save_content, "mc_agent.json");
        console.log("Q table saved");
    }

    restore(content){
        this.Q = {};
        content = JSON.parse(content);
        for (const key in content){
            this.Q[key] = [];
            for (var i = 0; i < content[key].length; i++) {
                if (content[key][i] != null){
                    this.Q[key].push(content[key][i]);
                }
                else{
                    this.Q[key].push(-Infinity);
                }
            }
        }
        console.log("Q table loaded");
    }

    play(){
        // Get the current state
        let state = this.env.getState().toString();
        // In this state in not in the Q(s, a) function
        if (!(state in this.Q)){
            let action_space = this.env.actionSpace();
            action_space.range = [0, 1, 2]; // Simplification of the numbers of actions
            this.Q[state] = Array.apply(null, Array(action_space.range.length)).map(Number.prototype.valueOf, 0.0);
        }
        // Select the max action a in Q
        let action = argMax(this.Q[state]);

        // Take this action and get the associated reward
        let reward = this.env.step(action);
    }

    createStateIfNotExist(st){
        if (!(st in this.Q)){
            let action_space = this.env.actionSpace();
            action_space.range = [0, 1, 3];
            this.Q[st] = Array.apply(null, Array(action_space.range.length)).map(Number.prototype.valueOf, 0);
        }
    }

    pickAction(st, eps){
        this.createStateIfNotExist(st);
        let act;
        if (Math.random() < eps){ // Pick a random action
            act = Math.floor(Math.random()*this.Q[st].length);
        }
        else{
            act = argMax(this.Q[st]);
        }
        return act;
    }

    train(){
        let episode = 10000;
        let eps = 1.0;
        let eps_decrease = 0.99;

        let mean_reward = [];
        for (let ep = 0; ep < episode; ep++) {
            if (ep % 50 == 0){
                eps = Math.max(0.1, eps*eps_decrease);
                console.log("episode=", ep, "eps=", eps, "mean_reward", mean(mean_reward));
            }
            mean_reward = [];
            let st = this.env.getState().toString();
            let act;
            let gamma = 0.99;
            let st2;
            let act2;
            for (var t = 0; t < 800; t++) {
                act = this.pickAction(this.env, st, eps);
                let reward = this.env.step(act);
                mean_reward.push(reward);
                st2 = this.env.getState().toString();
                // Pick greedy action (eps = 0)
                act2 = this.pickAction(st2, 0.);
                this.createStateIfNotExist(st2);
                this.createStateIfNotExist(st);
                this.Q[st][act] = this.Q[st][act] + 0.05*(reward + (gamma*this.Q[st2][act2]) - this.Q[st][act]);
                st = st2;
            }
            this.env.randomRoadPosition();
        }
        this.env.render(true);
        console.log(this.Q);
    }
}
