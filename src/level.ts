/*
    This is the core of game, the class is used create all the differents
    services in the game (assets, map, agents...).
*/

import * as U from "./utils";
import {
    ROADSIZE, Loader, JSON_TEXTURES
} from "./global";
import {AssetManger, RoadSprite} from "./asset_manager";

import {Car, CarSprite, LidarChild, LidarInfoI} from "./car";
import {World} from "./world";
import { BasicMotionEngine, BasicMotionOptions } from "./basic_motion_engine";
import { ControlMotionEngine } from "./control_motion_engine";

export interface LevelInfo {
    map: (string|number)[][];
    agent: any;
    [index: string]: any;
}

export interface Roads {
    [key: string]: RoadSprite
}

export class Level extends World {

    public isCarsMoving: boolean = true;

    constructor(levelContent: LevelInfo, canvasId: string) {
        /*
            @levelContent: Content of the level
            @canvasID: HTML canvas id
        */
        super(levelContent, canvasId);
        this.map = this.info.map;
        this.am = new AssetManger(this);
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
     * Change the motion engine of the agent. BasicMotionEngine by default.
     * This method should be called before to called 'load'.
     * @motion The motion engine to used for the agent when the environement is loaded.
     * @options Options to change the behavior of the motion engine.
     */
    public setAgentMotion(motion: typeof BasicMotionEngine|typeof ControlMotionEngine, options: BasicMotionOptions){
        this.am.setAgentMotion(motion, options);
    }

    /**
     * 
     * options Options to change the lidar options of the agent.
     * Changing the lidar change the state representation of the car in the
     * environement.
     */
    public setAgentLidar(options: LidarInfoI){
        this.am.setAgentLidar(options);
    }

    protected _setup(info: LevelInfo){
        /*
            Setup all the element of the map
        */
        // Load the textures file
        let textures = Loader.resources[JSON_TEXTURES].textures;
        // Load all elements of the car
        this.am.createMap(this.map, info, textures);
        this.am.createCars(this.map, info, textures);
        if (info.agent)
            this.agent = this.am.createAgent(this.map, info, textures);
        // Set up the main loop
        this.app.ticker.add((delta: number) => this.loop(delta));
    }

    public reset(){
        /*
            Reset the game.
            For the moment, only the agent position is reset.
            TODO: Reset the positions of the others car too to avoid
            useless collisions.
        */
        this.agent.reset();
    }

    setReward(agent_col: any, on_road: any, action: any){
        /*
            TODO: Let's the reward define in the agent class
        */
        let reward = -0.1;
        if (action == 0 || this.agent.core.v == 1)
            reward += 0.5;
        if (agent_col.length > 0){
            console.log("collision!");
            reward = -10;
        }
        else if (!on_road){
            console.log("out");
            reward = -10;
        }
        return reward;
    }

    step(delta: number, action:number|number[]=null){
        /*
            Process one step into the environement
            @delta (Float) time since the last update
            @action: (Integer) The action to take (can be null if no action)
        */
        // Go through all cars to move each one
        for (var c = 0; c < this.cars.length; c++) {
            if (this.cars[c].lidar && !this.cars[c].core.agent) // If this car can move
                this.cars[c].step(delta);
        }   
        // Move the agent
        if (this.agent){
            let {agentCollisions, onRoad} = this.agent.step(delta, action);
            // Get the reward
            let reward = this.setReward(agentCollisions, onRoad, action);
            return reward;
        }
        return 0;
    }

    stopRender(){
        /**
         * Stop to render the canvas
        */
       this.app.ticker.stop();
    }
}
