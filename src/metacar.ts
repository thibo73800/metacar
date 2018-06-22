/*
    Main class of the project
*/

import {Level, LevelInfo} from "./level";
import {actionSpaceDescription} from "./motion_engine";
import {UIEvent} from "./ui_event";
import * as U from "./utils";
import { BasicMotionEngine, BasicMotionOptions } from "./basic_motion_engine";
import { ControlMotionEngine } from "./control_motion_engine";
import { LidarInfoI, State } from "./car";

/**
 * @local Chooce whether to load a file from the computer.
 * A popup is open if True.
 */
export interface eventLoadOptions {
    local: boolean;
}

export class MetaCar {

    private level: Level;
    private canvasId: string;
    private levelToLoad: string|Object;
    private eventList: string[] = ["train", "play", "stop", "reset_env", "load"]
    private eventCallback: any[];
    private event: UIEvent;
    private agentMotionEngine: typeof BasicMotionEngine|typeof ControlMotionEngine = BasicMotionEngine;
    private agentMotionOptions: BasicMotionOptions = {}
    private agentLidarInfo: LidarInfoI;
    private isCarsMoving: boolean = true;
    private loopCallback: any = undefined;

    /**
     * Class used to create a new environement.
     * @canvasId: HTML canvas ID
     * @levelToLoad: URL of the level or directly the level's object.
     *  URL format: embedded://... or http(s)://...
    */
    constructor(canvasId: string, levelToLoad: string|Object) {
        if (!canvasId || !levelToLoad){
            console.error("You must specify the canvasId and the levelToLoad");
        }
        this.canvasId = canvasId;
        this.levelToLoad = levelToLoad;
    }
    
    /**
     * Set a custom reward function
     * The @fc will be called with three parameters and should return one number.
     *  *agentCollisions: A list with all current collisions
     *  *onRoad: Is the car on the road
     *  *action: The last action took by the car
     * @fc The reward function to call
     */
    public setRewardFunction(fc: any): void {
        this.level.setRewardFunction(fc);
    }

    /**
     * Choose whether other cars move or stay fixed.
     * This method should be called before to called 'load'.
     * @moving True or False
     */
    public carsMoving(moving: boolean){
        this.isCarsMoving = moving;
    }

    /**
     * Return the last reward given by the environement
     */
    public getLastReward(): number{
        return this.level.getLastReward();
    }

    /**
     * options Options to change the lidar options of the agent.
     * This method should be called before to called 'load'.
     * Changing the lidar change the state representation of the car in the
     * environement.
     */
    public setAgentLidar(options: LidarInfoI){
        this.agentLidarInfo = options;
    }

    /**
     * Change the motion engine of the agent. BasicMotionEngine by default.
     * This method should be called before to called 'load'.
     * @motion The motion engine to used for the agent when the environement is loaded.
     * @options Options to change the behavior of the motion engine.
     */
    public setAgentMotion(motion: typeof BasicMotionEngine|typeof ControlMotionEngine, options: BasicMotionOptions){
        this.agentMotionEngine = motion;
        this.agentMotionOptions = options;
    }

    /**
     * This method is used to add a button under the canvas. When a
     * click is detected on the window, the associated @fc is called.
     * Some events are recognized by the environement, others can be custom.
     * The following are recognized:
     * - train: The render is stopped before to called @fc. You must called render(true) once your training is done.
     * - play: Your function (@fc) will be called at each frame update.
     * - stop: The last function passed to the play event will not be called anymore. Then @fc is called.
     * - reset_env: Reset the environement. Then, @fc is called.
     * - load: Load: @fc is called. You can set @options to {local:true} to load the content of a file from your computer.
     * If @options is set, a content variable will be passed to the @fc function (the content of the selected file).
     * @eventName Name of the event to listen.
     * @fc Function to call each time this event is raised.
     */
    public addEvent(eventName: string, fc: any, options?: eventLoadOptions):void {
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

    /**
     * Choose whether to render the environement.
     * @val: True or False.
     */
    public render(val: boolean){
       this.level.render(val);
    }

    /**
     * Choose wheter the environment should step automaticly
     * @param val True or False 
     */
    public steping(val: boolean){
        this.level.setSteping(val);
    }

    /**
     * Usefull method to save/download a string as file.
     * @content The content of the file
     * @file_name The name of the file
     */
    public save(content: string, file_name: string){
        /*
            Save the agent
        */
        U.saveAs(content, file_name);
    }

    /**
     * Get the action space of the environement
     * @return The Description of the action space.
     */
    public actionSpace(): actionSpaceDescription{
        return this.level.agent.motion.actionSpace();
    }

    /**
     * Return the current state of the environement.
     * The size of the state depends of the size of the Lidar.
     * @return The state as a 2D Array or 1D Array (linear:true)
    */
    public getState(): State{
        return this.level.agent.getState();
    }

    /** 
        Step into the environement
        @action Action to process to step 
        @return Reward value
    */
    public step(action: number|number[]): number{
        return this.level.step(1, action, false);
    }

    /**
     * Reset the environement
     */
    public reset(): void{
        /*
            Reset the agent position
        */
        this.level.reset();
    }

    /**
     * Set the agent on a new random road on the map.
     */
    randomRoadPosition(): void{
        /*
            This position
        */
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

    /**
     * Using thid method you can call your own method
     * at each loop update.
     * @fc method to call at each loop update
     */
    public loop(fc: any){
        this.loopCallback = fc;
    }

    /**
     * @delta Time since the last update
     */
    private _loop(delta: number): void{
        if (this.event.isPlaying()){
            this.event.playCallback();
        }
        else {
            this.level.step(delta);
        }
        if (this.loopCallback){
            this.loopCallback();
        }
    }

    /**
     * Create the UIEvent instance and set the events 
     * callbacks relative to the UI.
     */
    private _setEvents(): void{
        // SetEvents callback
        this.event = new UIEvent(this.level, this.canvasId);
        this.eventCallback = [
            (fc: any) => this.event.onTrain(fc),
            (fc: any) => this.event.onPlay(fc),
            (fc:any) => this.event.onStop(fc),
            (fc: any) => this.event.onResetEnv(fc),
            (fc: any, opt: eventLoadOptions) => this.event.onLoad(fc, opt)
        ];
    }

    /*
        Load the environement with the parameters passed in the constructor.
    */
   public load(): Promise<void>{

    return new Promise((resolve) => {
        if (typeof this.levelToLoad == "string"){
            U.loadCustomURL(<string>this.levelToLoad, (content: LevelInfo) => {
                this.level = new Level(content, this.canvasId);
                this.level.setAgentMotion(this.agentMotionEngine, this.agentMotionOptions);
                this.level.setAgentLidar(this.agentLidarInfo);
                this.level.carsMoving(this.isCarsMoving);
                this._setEvents();
                this.level.load((delta: number) => this._loop(delta)).then(() => {
                    resolve();
                });
            });
        }
        else{
            this.level = new Level(<LevelInfo>this.levelToLoad, this.canvasId);    
            this.level.setAgentMotion(this.agentMotionEngine, this.agentMotionOptions);
            this.level.setAgentLidar(this.agentLidarInfo);
            this.level.carsMoving(this.isCarsMoving);
            this._setEvents();
            this.level.load((delta: number) => this._loop(delta)).then(() => {
                resolve();
            });
        }
    });
}

}
