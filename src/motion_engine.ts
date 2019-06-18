/*
    Motion engine
    Parent of all motion engines classes
*/

import {Level} from "./level";

import {
    MAP
} from "./global";
import { Editor } from "./editor";
import { CarSprite } from "./car";

/**
 * Structure used to describe the action space.
 * @type: Discrete or continous values
 * @size: Number of expected values.
 * @range: Range of each values
*/
export interface actionSpaceDescription {
    type: "Discrete"|"Continous"
    size: number,
    range: number[]|number[][]
}

export class MotionEngine {

    protected level: Level|Editor;
    protected car: any;
    protected lidar: any;
    protected state: any;

    constructor(level: Level|Editor) {
        this.level = level;
    }

    protected boxesIntersect(a: any, b: any) {
        /*
            Chack if a the two elements intersect each others
            @a (Pixi sprite)
            @b (Pixi sprite)
        */
       var ab = a.getBounds();
       var bb = b.getBounds();
       return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
    }

    /**
     * Check if car1 intersect with an other @object
     * @car1 The first car
     * @object The object
     */
    protected carIntersect(car1: CarSprite, object: CarSprite){
        const nb = car1.lidar.collisionPts.length;
        for (let c=0; c < nb; c++){
            if (this.boxesIntersect(car1.lidar.collisionPts[c], object)){
                return true;
            }            
        }
        return false;
    }

    /**
     * Check how many colision detector of car1 are in @object
     * @car1 The first car
     * @object The object
     */
    protected carCaptorInObject(car1: CarSprite, object: CarSprite): number{
        const size = car1.lidar.collisionPts.length;
        let nb = 0;
        for (let c=0; c < size; c++){
            if (this.boxesIntersect(car1.lidar.collisionPts[c], object)){
                nb += 1;
            }
        }
        return nb;
    }


    protected detectInteractions(all:boolean = true, farDetection:boolean=false){
        /*
            If all is false then we assume the car is alwais on a road
            and never collision with other car (this behavior is used for bot cars only)
            Detect the interaction with the environment
            - Car collisions
            - Lidar collisions
            - Road position (Is the vehicle on the road)
        */
        let envs = this.level.getEnvs();

        let agentCollisions = [];
        let lidar_collisions = [];
        let onRoadCnt = 0;
        let onRoad = false;

        for (let i = 0; i < envs.length; i++) {
            if (envs[i] != this.car && ((Math.abs(envs[i].mx - this.car.mx) < 2 && Math.abs(envs[i].my - this.car.my) < 2) || farDetection)){
                if (all && envs[i].obstacle && this.carIntersect(this.car, envs[i])){
                    agentCollisions.push(envs[i]);
                }
                else if (all && envs[i].mapId == MAP.ROAD){
                    onRoadCnt += this.carCaptorInObject(this.car, envs[i]);
                }
                if (this.boxesIntersect(envs[i], this.lidar)){
                    lidar_collisions.push(envs[i]);
                }
            }
        }
        this.setState(lidar_collisions);
        if (onRoadCnt >= 4 || !all){
            onRoad = true;
        }
        return {agentCollisions, onRoad};
    }

    protected setState(lidar_collisions: any){
        /*
            Set up the current state of the agent
            @lidar_collisions List with all possible lidar collisions
        */
        let pt_id = 0;
        
        for (var i = 0; i < this.lidar.lidarPts.length; i++) {
            this.lidar.lidarPts[i].alpha = 0.3;
            
            let pt_y = Math.floor(pt_id/this.lidar.pts);
            let pt_x = Math.floor(pt_id%this.lidar.pts);
            this.state[pt_y][pt_x] = MAP.DEFAULT;

            for (var a = 0; a < lidar_collisions.length; a++) {
                if (lidar_collisions[a] != this.car){
                    let touch = this.boxesIntersect(lidar_collisions[a], this.lidar.lidarPts[i]);
                    if (touch && lidar_collisions[a].obstacle){
                        // If this is an obstacle
                        this.lidar.lidarPts[i].alpha = 1.;
                    }
                    if (touch && (lidar_collisions[a].mapId > this.state[pt_y][pt_x] || (lidar_collisions[a].mapId == MAP.ROAD && this.state[pt_y][pt_x]==MAP.DEFAULT))){
                        // Add this interaction to the state
                        // If this interaction is more important than the one before
                        // we kept the more important one
                        this.state[pt_y][pt_x] = lidar_collisions[a].mapId;
                    }
                }
            }
            pt_id += 1;
        }
    }
};
