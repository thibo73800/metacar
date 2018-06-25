/*
    Car class
    Class used to create a new car on the map
    This class create the agent and the associated sensor (lidar)
*/

import {Level} from "./level";
import {Editor} from "./editor";

import {
    CAR_IMG, Sprite, MAP, ROADSIZE, Container, Graphics
} from "./global";
import { RoadSprite } from "./asset_manager";
import { runInThisContext } from "vm";

var Global_carId = 0;

export interface LidarContainerI extends PIXI.Container{
    lidarPts?: LidarChild[];
    collisionPts?: LidarChild[];
    pts?: number;
}

export interface LidarInfoI {
    pts?: number;
    width?: number;
    height?: number;
    pos?: number;
}

export interface CarOptions {
    image?: string;
    lidar?: boolean;
    lidarInfo?: LidarInfoI;
    motionEngine?: any;
}

export interface CarInfo{
    readonly mx: number;
    readonly my: number;
    readonly line: number;
}

export interface CarSprite extends PIXI.Sprite {
    road?: RoadSprite;
    carId?: number;
    obstacle?: boolean;
    mapId?: number;
    lidar?: any;
    rotationStep?: any;
    mx?: number;
    my?: number;
    checkAndsetNewRoad?: any;
    line?: number;
    haveTurned?: boolean;
    optionalTurn?: boolean;
    agent?: boolean;
    v?: number;
    a?: number;
    yaw_rate?: number;
    last_a?: number;
    last_yaw_rate?: number;
}

export interface LidarChild extends PIXI.Graphics {
    // Is a lidar point
    pt?: boolean;
}

export interface State {
    lidar?: number[][];
    linear?: number[];
    v?: number;
    a?: number;
    steering?: number;
}

export class Car {

    public level: Level|Editor;
    public core: CarSprite;
    public lidar: LidarContainerI;
    public motion: any;

    private info: CarInfo;
    public turnedRandom: any;

    constructor(level: Level|Editor, info: CarInfo, textures: any, options:CarOptions={}) {
        /*
            @level (Level class)
            @info: (CarInfo) Info from the json file about the car
            @textures: (Pixi: loader.resources) Used ot load the agent texture
            @options
                image (String) Default CAR_IMG.DEFAULT
                lidar (False) Default: false
                lidar_info: (Object) Object with the informations about the lidar
                motionEngine (Class) Motion engine to use for this car
        */
        this.level = level;
        options.image = options.image || CAR_IMG.DEFAULT;
        options.lidar = options.lidar || false;
        options.lidarInfo = options.lidarInfo || {pts: 5, width: 4, height: 5, pos: 0};
        // Create the sprite of the car
        this.core = new Sprite(textures[options.image]);
        this.info = info; // Store the original information about the car
        // Change the scale and the anchor of the sprite
        this.core.scale.x = 0.8;
        this.core.scale.y = 0.8;
        this.core.anchor.x = 0.5;
        this.core.anchor.y = 0.5;
        this.core.road = undefined;
        // Id of this car
        this.core.carId = Global_carId;
        Global_carId += 1;

        // THis car is not an agent by default
        this.core.agent = false;
        // A car is an obstacle
        this.core.obstacle = true;
        // Set the map id
        this.core.mapId = MAP.CAR;

        // Create the lidar of the car if required
        if (options.lidar){
            this.createLidar(options.lidarInfo);
            this.core.lidar = this.lidar;
        }

        // Setup the motionEngine of the car if needded
        // TODO: Remove useless setUp
        if (options.motionEngine){
            this.motion = options.motionEngine;
            this.motion.setUp(this.core, this.lidar);
            this.core.rotationStep = 0.5;
        }
        else {
            this.core.rotationStep = 0.5;
        }

        // Set the position of the car
        this.core.mx = this.info.mx;
        this.core.my = this.info.my;
        this.core.x = (this.info.mx) * ROADSIZE;
        this.core.y = (this.info.my) * ROADSIZE;

        // Usefull method to set the new road position of the car
        // and keep the list of cars on each road up to date
        this.core.checkAndsetNewRoad = (road: RoadSprite) => this.checkAndsetNewRoad(road);

        // If the car is on a road, we set the position of the car on
        // the road properly
        let road = this.level.getRoad(this.core.my, this.core.mx);
        this.core.line = 0; // By defaut
        if (road){ // If the car is on a road
            road.setCarPosition(this.core, this.info.line);
        }
    }

    checkAndsetNewRoad(n_road?: RoadSprite){
        /*
            Check if the car is on a new road
            If the car is on a new road, we keep the list up to date.
            @n_road (Road object) The new road
        */
        let current_road = this.core.road;
        if (!n_road){ // If the road is not define
            n_road = this.level.getRoad(this.core.my, this.core.mx);;
        }
        if (n_road != current_road){
            if (current_road){ // The car is not on this road anymore
                current_road.cars.splice(current_road.cars.indexOf(this.core.carId), 1);
            }
            // Add the car to the road list
            this.core.road = n_road;
            // TOdo: CHECK something is strange here
            this.core.haveTurned = false;
            this.core.optionalTurn = false;
            this.turnedRandom = undefined;
            if (n_road)
                n_road.cars.push(this.core.carId);
        }
    }

    reset(){
        /*
            Method used to restore the position of the car
            to the original position (as set into the json file)
        */
        this.core.mx = this.info.mx;
        this.core.my = this.info.my;
        let road = this.level.getRoad(this.core.my, this.core.mx);
        if (road){ // If the car is on a road
            road.setCarPosition(this.core, this.info.line, true);
        }
    }

    getState(): State {
        /*
            Get the current state of the car
            The state is the current value of each point
            of the lidar.
        */
        let nState: State = {};

        let linear: number[] = [];
        this.motion.state.map((row: number[]) => { linear = linear.concat(row);});
        linear.push(this.core.v);

        nState.linear = linear;
        nState.lidar =  this.motion.state.map(function(arr: any) { return arr.slice(); });

        nState.v = this.core.v;
        nState.a = this.core.last_a;
        nState.steering = this.core.last_yaw_rate;

        return nState;
    }

    step(delta: number, action:number|number[]=null){
        /*
            Take one step into the environement
            @delta (Float) time since the last update
            @action: (Integer) The action to take (can be null if no action)
        */
        if (action == null){
            var {agentCollisions, onRoad} = this.motion.step(delta);
        }
        else{
            var {agentCollisions, onRoad} = this.motion.actionStep(delta, action);
        }
        return {agentCollisions, onRoad};
    }

    createLidar(lidarOptions: LidarInfoI){
        /*
            Create the lidar sensor of the car
            @lidarOptions (Object) option to create the lidar
                @pts (Integer) Number of point required
                @width: Width of the lidar (in proportion to the car)
                @height: Height of the lidar (in proportion to the car)
        */
       lidarOptions.pts = lidarOptions.pts || 5;
       lidarOptions.width = lidarOptions.width || 4;
       lidarOptions.height = lidarOptions.height || 5;
       lidarOptions.pos = lidarOptions.pos || 0;

        this.lidar = new Container();
        this.lidar.lidarPts = [];
        this.lidar.collisionPts = [];
        // Area of the lidar
        let area: LidarChild = new Graphics();
        area.pt = false;
        area.alpha = 0.3;
        area.beginFill(0x515151);
        area.drawRect(0, 0, this.core.width*lidarOptions.width, this.core.height*lidarOptions.height);
        area.endFill();

        // Front collision point
        let front:LidarChild = new Graphics();
        front.pt = false;
        front.alpha = 0;
        front.beginFill(0x510000);
        front.drawRect(this.core.width-5, area.height/2, 3, 3);
        front.endFill();
        // Back collision point
        let back:LidarChild = new Graphics();
        back.pt = false;
        back.alpha = 0;
        back.beginFill(0x510000);
        back.drawRect(-1, area.height/2-2, 3, 3);
        back.endFill();
        // Left collision point
        let left:LidarChild = new Graphics();
        left.pt = false;
        left.alpha = 0;
        left.beginFill(0x510000);
        left.drawRect(this.core.width/2, area.height/2-this.core.height/2+5, 3, 3);
        left.endFill();
        // Right collision point
        let right:LidarChild = new Graphics();
        right.pt = false;
        right.alpha = 0;
        right.beginFill(0x510000);
        right.drawRect(this.core.width/2, area.height/2+this.core.height/2-8, 3, 3);
        right.endFill();

        back.x -= (lidarOptions.pos*this.core.width);
        front.x -= (lidarOptions.pos*this.core.width);
        right.x -= (lidarOptions.pos*this.core.width);
        left.x -= (lidarOptions.pos*this.core.width);

        // Create all the points of the lidar
        let x_step = area.width/lidarOptions.pts;
        let y_step = area.height/lidarOptions.pts;
        for (let xs = lidarOptions.pts - 1; xs >= 0; xs--) {
            for (let ys = 0; ys < lidarOptions.pts; ys++) {

                let x = (x_step/4) + xs * x_step;
                let y = (y_step/4) + ys * y_step;
                let pt: LidarChild = new Graphics();
                pt.pt = true;
                pt.beginFill(0xffffff);
                pt.drawRect(x, y, 5, 5);
                pt.endFill();
                this.lidar.addChild(pt);
                this.lidar.lidarPts.push(pt);
            }
        }

        this.lidar.pts = lidarOptions.pts;
        this.lidar.addChild(area);
        this.lidar.addChild(front);
        this.lidar.addChild(back);
        this.lidar.addChild(left);
        this.lidar.addChild(right);
        this.lidar.collisionPts.push(front);
        this.lidar.collisionPts.push(back);
        this.lidar.collisionPts.push(left);
        this.lidar.collisionPts.push(right);

        this.lidar.x = this.core.x;
        this.lidar.y = this.core.y;

        this.lidar.pivot.y = this.lidar.height/2;
        this.lidar.pivot.x = this.core.width/2 - (lidarOptions.pos*this.core.width);

        this.lidar.rotation = this.core.rotation;
    }
}
