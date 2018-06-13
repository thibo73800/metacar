/*
    Main class of the project
*/

import {Level, LevelInfo} from "./level";
import {actionSpaceDescription} from "./motion_engine";
import {UIEvent} from "./ui_event";
import * as U from "./utils";

export interface eventLoadOptions {
    local: boolean;
}

export class MetaCar {

    private agent: any;
    private level: Level;
    private canvasId: string;
    private levelUrl: string;
    private eventList: string[] = ["train", "play", "stop", "reset_env", "reset_agent", "load"]
    private eventCallback: any[];
    private event: UIEvent;

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
        this.canvasId = canvasId;
        this.levelUrl = levelUrl;
    }

    private _setEvents(){
        // SetEvents callback
        this.event = new UIEvent(this.level, this.canvasId);
        this.eventCallback = [
            (fc: any) => this.event.onTrain(fc),
            (fc: any) => this.event.onPlay(fc),
            (fc:any) => this.event.onStop(fc),
            (fc: any) => this.event.onResetEnv(fc),
            (fc: any) => this.event.onResetAgent(fc),
            (fc: any, opt: eventLoadOptions) => this.event.onLoad(fc, opt)
        ];
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
                this._setEvents();
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
            this.level.render();
            this.agent.stop();
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
    
    /**
     * This method is used to add button under the canvas. When a
     * click is detected on the window, the associated @fc is called.
     * Some events are recognized by the environement, others can be custom.
     * @eventName Name of the event to listen.
     * @fc Function to call each time this event is raised.
     */
    addEvent(eventName: string, fc: any, options?: eventLoadOptions):void {
        const index = this.eventList.indexOf(eventName);
        if (index == -1){
            this.event.onCustomEvent(eventName, fc);
            return;
        }
        const event =  this.eventList[index];
        if (event != "load"){
            this.eventCallback[index](fc);
        }
        else{
            this.eventCallback[index](fc, options);
        }
    }

    render(val: boolean){
        /*
            Choose whether to render the environement.
        */
       this.level.render(val);
    }

    save(content: any, file_name: string){
        /*
            Save the agent
        */
        U.saveAs(content, file_name);
    }

    /**
     * Get the action space of the environement
     */
    actionSpace(): actionSpaceDescription{
        return this.level.agent.motion.actionSpace();
    }

    /**
     * Return the current state of the environement.
     * The size of the state depends of the size of the Lidar.
    */
    getState(): number[][]{
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
        if (this.event.isPlaying()){
            this.event.playCallback();
        }
        else {
            this.level.step(delta);
        }
    }

}
