/*
    Motion engine
    Parent of all motion engines classes
*/

import {Level} from "./level";

import {
    MAP
} from "./global";
import { Editor } from "./editor";

export interface MotionOption{
    readonly rotationStep?: number;
    readonly actions: string[];
}

/**
 * Structure used to describe the action space.
 * @type: Discrete or continous values
 * @size: Number of expected values.
 * @range: Range of each values
*/
export interface actionSpaceDescription {
    type: "Discrete"|"Continous"
    size: number,
    range: number[]
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

    protected detectInteractions(){
        /*
            Detect the interaction with the environement
            - Car collisions
            - Lidar collisions
            - Road position (Is the vehicle on the road)
        */
        let envs = this.level.getEnvs();

        let agent_col = [];
        let lidar_collisions = [];
        let on_road = false;

        for (let i = 0; i < envs.length; i++) {
            if (envs[i] != this.car && envs[i].obstacle && this.boxesIntersect(envs[i], this.car)){
                agent_col.push(envs[i]);
            }
            else if (envs[i].mapId == MAP.ROAD && this.boxesIntersect(envs[i], this.car)){
                on_road = true;
            }
            if (this.boxesIntersect(envs[i], this.lidar)){
                lidar_collisions.push(envs[i]);
            }
        }

        this.setState(lidar_collisions);
        return {agent_col, on_road};
    }

    protected setState(lidar_collisions: any){
        /*
            Set up the current state of the agent
            @lidar_collisions List with all possible lidar collisions
        */
        let pt_id = 0;

        for (var i = 0; i < this.lidar.children.length; i++) {
            this.lidar.children[i].alpha = 0.1;
            if (this.lidar.children[i].pt){ // If this is a lidar point

                let pt_y = Math.floor(pt_id/this.lidar.pts);
                let pt_x = Math.floor(pt_id%this.lidar.pts);
                this.state[pt_y][pt_x] = MAP.DEFAULT;

                for (var a = 0; a < lidar_collisions.length; a++) {
                    if (lidar_collisions[a] != this.car){
                        let touch = this.boxesIntersect(lidar_collisions[a], this.lidar.children[i]);
                        if (touch && lidar_collisions[a].obstacle){
                            // If this is an obstacle
                            this.lidar.children[i].alpha = 1.;
                        }
                        if (touch && (lidar_collisions[a].mapId > this.state[pt_y][pt_x] || (lidar_collisions[a].mapId == MAP.ROAD && this.state[pt_y][pt_x]==MAP.DEFAULT))){
                            // Add this interaction to the state
                            // If this interaction is more important than the one befor
                            // we kept the more important one
                            this.state[pt_y][pt_x] = lidar_collisions[a].mapId;
                        }
                    }
                }
                pt_id += 1;
            }
        }
    }
};
