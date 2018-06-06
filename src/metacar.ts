/*
    Main class of the project
*/

import {Level} from "./level";

export class MetaCar {

    private isPlaying: boolean;
    private agent: any;
    private level: Level;

    constructor() {
    }

    load(level: string, agent: any){
        /*
            Load the environement
            @level (String) Name of the json level to load
            @agent (Agent class)
        */
        this.isPlaying = false;
        this.agent = agent;
        this.level = new Level(level);
        this.level.load((delta: number) => this.loop(delta));

        document.getElementById("train").addEventListener("click", () => {
            this.level.app.ticker.stop(); // .add(delta => this.loop(delta));
            this.agent.train(this);
        });
        document.getElementById("stop").addEventListener("click", () => {
            this.isPlaying = false;
            this.agent.stop();
            this.level.render();
        });
        document.getElementById("reset").addEventListener("click", () => {
            this.level.reset();
        });
        document.getElementById("play").addEventListener("click", () => {
            this.isPlaying = true
        });
        document.getElementById("saveAgent").addEventListener("click", () => {
            this.agent.save(this);
        });
        document.getElementById("dumpFile").addEventListener("change", (e) => {
            //readDump(e, (content) => this.agent.restore(this, content));
        });
    }

    render(){
        /*
            Render the environement
            again
        */
        this.level.render();
    }

    save(content: any, file_name: string){
        /*
            Save the agent
        */
        saveAs(content, file_name);
    }

    actionSpace(){
        /*
            Get the possible action to do in the environement
            Ex: [0, 1, 2]
        */
        return this.level.agent.motion.actionSpace();
    }

    getState(){
        /*
            Get the state of this environement
        */
        return this.level.agent.getState();
    }

    step(action: number){
        /*
            Step into the environement
            @action (Integer)
        */
        return this.level.step(1, action);
    }

    reset(){
        /*
            Reset the agent position
        */
        this.level.reset();
    }

    randomRoadPosition(){
        /*
            This position
        */
        this.level.agent.last_position = [];
        let keys = Object.keys(this.level.roads);
        keys.sort(function() {return Math.random()-0.5;});
        for (let k in keys){
            let road = this.level.roads[keys[k]];
            if (road.cars.length == 0){
                road.setCarPosition(this.level.agent.core);
                break;
            }
        }
    }

    loop(delta: number){
        if (this.isPlaying){
            this.agent.play(this);
        }
        else {
            this.level.step(delta);
        }
        document.getElementById("rewardDisplay").innerHTML = this.level.last_reward;
    }

}
