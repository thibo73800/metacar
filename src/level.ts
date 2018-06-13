/*
    This is the core of game, the class is used create all the differents
    services in the game (assets, map, agents...).
*/

import * as U from "./utils";
import {
    LEVEL_FOLDER, ROADSIZE, Loader, JSON_TEXTURES
} from "./global";
import {AssetManger, RoadSprite} from "./asset_manager";

import {Car, CarSprite} from "./car";

export interface LevelInfo {
    map: (string|number)[][];
    agent: any;
    [index: string]: any;
}

export interface Roads {
    [key: string]: RoadSprite
}

export class Level {

    public app: any = null; // The pixi app.
    private info: LevelInfo = null;  // Information of the loaded level
    private envs: any[] = [] // Used to list all elements the car can crash with
    private map: (string|number)[][] = null; // Use the roads positions of the level
    public agent: any = null; // (@Car class) for the agent
    // Object to store all the roads assets
    // Each road is accesible as follow this.roads[[my, mx]]
    // with my and mx the (x, y) position relative to the map (not pixel).
    private roads: Roads = {};
    private cars: Car[] = []; // Array used to store all the cars assets
    private loop: any; // Loop method called for each render
    private am: AssetManger;  // The AssetManger is used to set most of the elements on the map
    private canvasId: string; // Id of the target canvas

    constructor(levelContent: LevelInfo, canvasId: string) {
        /*
            @levelContent: Content of the level
            @canvasID: HTML canvas id
        */
        this.info = levelContent;
        this.map = this.info.map;
        this.canvasId = canvasId;
        this.am = new AssetManger(this);
    }

    load(loop: any){
        /*
            Load the map from the file given in the constructor of the class
            @loop (Method) This method will be call for each render
        */
        this.loop = loop;
        return new Promise((resolve, reject) => {
            this.createLevel(this.info).then(() => resolve());
        });
    }

    render(val: boolean){
        if (val){
            this.app.ticker.start();
        }
        else{
            this.app.ticker.stop();
        }
    }

    createLevel(info: LevelInfo){
        /*
            Create the level
            @info Information about the level
        */
        //Create the Pixi Application
        this.app = new PIXI.Application({
            width: this.map[0].length * ROADSIZE,
            height: this.map.length * ROADSIZE,
            backgroundColor: 0x80bf3e
          }
        );
        // Append the app to the body
        document.getElementById(this.canvasId).appendChild(this.app.view);

        return new Promise((resolve, reject) => {
            Loader.add(["public/textures/textures.json", "public/textures/textures.png"]).load(() => {
                    this.setup(info); // Set up the level (Add assets)
                    resolve();
            });
        });
    }

    setup(info: LevelInfo){
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

    reset(){
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
            reward = -10;
        }
        else if (!on_road){
            reward = -10;
        }
        return reward;
    }

    step(delta: number, action:number=null){
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
            let {agent_col, on_road} = this.agent.step(delta, action);
            // Get the reward
            let reward = this.setReward(agent_col, on_road, action);
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

    addChild(child: any){
        /**
         * Add child to the app
         */
        this.app.stage.addChild(child);
    }

    addRoad(road: RoadSprite){
        /*
            Add road using the mx and my positions
        */
       this.roads[[road.my.toString(), road.mx.toString()].toString()] = road;
       this.envs.push(road);
       this.app.stage.addChild(road);
    }

    addCar(car: Car){
        /**
         * Add car to the level
        */
       this.cars.push(car);
       this.app.stage.addChild(car.core);
       this.envs.push(car.core);
    }

    getRoad(my: number, mx: number){
        return this.roads[[my.toString(), mx.toString()].toString()];
    }

    getRoads(){
        return this.roads;
    }

    findCarById(id: number){
        /*
            Find car by @id
        */
        return this.cars.find((e: any) => {return e.car_id == id});
    }

    getEnvs(): any[] {
        /**
         * Return the list of envs
         * /
        */
       return this.envs;
    }

    getMap(): (string|number)[][] {
        return this.map;
    }
}
