/*
    Main class of the project
*/

import {Level, LevelInfo} from "./level";
import * as U from "./utils";

export interface eventLoadOptions {
    computer: boolean;
}

export class MetaCar {

    private isPlaying: boolean;
    private agent: any;
    private level: Level;
    private canvasId: string;
    private levelUrl: string;
    private eventList: string[] = ["train", "play", "stop", "reset_env", "reset_agent", "save", "load"]
    private eventCallback: any[];
    private buttonsContainer: HTMLDivElement;

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
        this.eventCallback = [
            (fc: any) => this.onTrain(fc),
            (fc: any) => this.onPlay(fc),
            (fc:any) => this.onStop(fc),
            (fc: any) => this.onResetEnv(fc),
            (fc: any) => this.onResetAgent(fc),
            (fc: any) => this.onSave(fc),
            (fc: any, opt: eventLoadOptions) => this.onLoad(fc, opt)
        ];

        // Insert the event div
        var canvas = document.getElementById(canvasId);
        var buttons = document.createElement('div'); // create new textarea
        buttons.classList.add("metacar_buttons_container");
        buttons.id = "metacar_"+ canvasId + "_buttons_container";
        canvas.parentNode.insertBefore(buttons, canvas.nextSibling);
        this.buttonsContainer = buttons;
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

    private _createButton(parent: HTMLDivElement, name: string): HTMLButtonElement{
        var button = document.createElement('button'); // create new textarea
        button.classList.add("metacar_button_train");
        button.id = "metacar_"+ this.canvasId + "_button_" + name;
        // Uppercase first letter and replace _
        name = name.replace(/_/g , " ");
        button.innerHTML = name.charAt(0).toUpperCase() + name.slice(1);;
        parent.appendChild(button);
        return button
    }

    onTrain(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "train");
        // Listen the event
        button.addEventListener("click", () => {
            this.render(false);
            if (fc) fc();
        });
    }

    onPlay(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "play");
        // Listen the event
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    onStop(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "stop");
        // Listen the event
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    onResetEnv(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "reset_env");
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    onResetAgent(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "reset_agent");
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }
   
    onSave(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "save");
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    onLoad(fc: any, options: eventLoadOptions){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "load_trained_agent");
        // Create the fake input input file
        var input_file = document.createElement('input'); // create new textarea
        input_file.type = "file";
        input_file.accept = "*/*";
        input_file.style.display = "none";
        input_file.classList.add("metacar_button_input_file");
        input_file.id = "metacar_"+ this.canvasId + "_button_input_file";
        this.buttonsContainer.appendChild(input_file);

        input_file.addEventListener("change", (dump) => {
            console.log("New file to handle");
            U.readDump(dump, (content: any) => {
                if (fc) fc(content);
            });
        });

        button.addEventListener("click", () => {            
            input_file.click();
        });
    }

    addEvent(eventName: string, fc: any, options?: eventLoadOptions):void {
        /**
         * eventName: Name of the event to listen
         * fc: Function to call each time this event is raise
         */
        const index = this.eventList.indexOf(eventName);
        if (index == -1){
            console.error("The environement does not support this event. Only the following are\
            avaible:" + this.eventList);
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
