
class QTableAgent {
    /*
        Monte Carlo Agent
    */

    constructor(env, pts) {
        this.stateList = [];
        this.pts = pts;
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

    stringStateToState(state){
        state = state.split(",");
        var nState = [];
        var lineCt = 0;
        var line = [];
        for (let l = 0; l < state.length; l++){
            line.push(parseInt(state[l]));
            if ((l+1) % this.pts == 0){
                nState.push(line);
                line = [];
            }
        }
        return nState;
    }

    restore(content){
        this.Q = {};
        this.stateList = [];
        content = JSON.parse(content);
        for (const key in content){
            var nStateToPush = this.stringStateToState(key);
            var st = key.toString();
            if (nStateToPush.length == this.pts)
                this.stateList.push(nStateToPush);
            this.Q[st] = [];
            for (var i = 0; i < content[st].length; i++) {
                if (content[st][i] != null){
                    this.Q[st].push(content[st][i]);
                }
                else{
                    this.Q[st].push(-Infinity);
                }
            }
        }
        console.log(this.Q);
        console.log(this.stateList);
        console.log("Q table loaded");
    }

    play(){
        // Get the current state
        let state = this.env.getState();
        state = state.toString();
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
            this.stateList.push(st);
            this.Q[st] = Array.apply(null, Array(action_space.range.length)).map(Number.prototype.valueOf, 0);
        }
    }

    getStateValues(state){
        state = state.toString();
        this.createStateIfNotExist(state);
        return this.Q[state];
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
                act = this.pickAction(st, eps);
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
    }
}
