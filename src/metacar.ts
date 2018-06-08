/*
    Main class of the project
*/

import {Level, LevelInfo} from "./level";
import * as U from "./utils";

export class MetaCar {

    private isPlaying: boolean;
    private agent: any;
    private level: Level;
    private canvasId: string;
    private levelUrl: string;

    constructor(canvasId: string, levelUrl: string) {
        /**
         * @canvasId: HTML canvas ID to used
         * @level: URL or Local storage URL.
         *  localstorage://level-name
         *  embedded://
         *  http(s)://
        */
        if (!canvasId || this.levelUrl){
            console.error("You must specify the canvasId and the levelUrl");
        }
        this.isPlaying = false;
        this.canvasId = canvasId;
        this.levelUrl = levelUrl;
    }

    load(level: string, agent: any): Promise<void>{
        /*
            Load the environement
            @level (String) Name of the json level to load
            @agent (Agent class)
        */

        return new Promise((resolve, reject) => {
            U.loadCustomURL(this.levelUrl, (content: LevelInfo) => {
                this.level = new Level(content, this.canvasId);
                this.level.load((delta: number) => this.loop(delta));
                resolve();
            });
        });

        /*
        
        this.agent = agent;
        this.level = new Level(level, "canvas");
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
        */
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
        U.saveAs(content, file_name);
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
        let roads = this.level.getRoads();
        let keys = Object.keys(roads);
        keys.sort(function() {return Math.random()-0.5;});
        for (let k in keys){
            let road = roads[keys[k]];
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
    }

}
