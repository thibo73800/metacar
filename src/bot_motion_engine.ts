import { MotionEngine } from "./motion_engine";
import {Level} from "./level";

import {
    MAP, ROADSIZE
} from "./global";

export class BotMotionEngine extends MotionEngine {
    /*
        Motion Engine for the bot cars (not for the agent)
        This motion Engin let the cars move by themself.
        The roation of the cars is either left, right or forward.
    */

    private mapSizeY: number;
    private mapSizeX: number;
    private rotationStep: number;
    private map: (string|number)[][];
    private rotationToNextCase: any;

    constructor(level: Level) {
        super(level);

        this.map = this. level.getMap();

        this.mapSizeY = this.map.length;
        this.mapSizeX = this.map[0].length;
        this.rotationStep = 0.5;

        this.rotationToNextCase = {};
        this.rotationToNextCase[0] = {"mx": 1, "my": 0};
        this.rotationToNextCase[0.5] = {"mx": 0, "my": 1};
        this.rotationToNextCase[1.0] = {"mx": -1, "my": 0};
        this.rotationToNextCase[1.5] = {"mx": 0, "my": -1};
        this.rotationToNextCase[-0.5] = {"mx": 0, "my": -1};
        this.rotationToNextCase[-1.0] = {"mx": -1, "my": 0};
        this.rotationToNextCase[-1.5] = {"mx": 0, "my": 1};
        // this.rotationToNextCase[null] = {"mx": 0, "my": 0};
    }

    setUp(car: any, lidar: any){
        /*
            Setup the motion engine
            @car: (Vehicle Object)
            @lidar: (Lidar Object)
        */
        this.car = car;
        this.lidar = lidar;
        // Init the lidar state
        this.state = [];
        for (let y = 0; y < lidar.pts; y++) {
            let line = [];
            for (let x = 0; x < lidar.pts; x++) {
                line.push(MAP.DEFAULT);
            }
            this.state.push(line);
        }
        // Setup up velocity to 0
        this.car.v = 0;
        // Set up the lidar state by detecting interactions
        this.detectInteractions();
    }

    turnLeft(){
        /*
            Turn left
        */
        this.car.rotation -= this.rotationStep*Math.PI;
        this.lidar.rotation = this.car.rotation;
    }

    turnRight(){
        /*
            Turn right
        */
        this.car.rotation += this.rotationStep*Math.PI;
        this.lidar.rotation = this.car.rotation;
    }

    moveUp(){
        this.car.v = 1;
    }

    moveDown(){
        /*
            Move forward
        */
        this.car.v = -1;
    }

    isRoad(nx: number, ny: number){
        /*
            Method used to check is there a road is present at this potion
            on the map
        */
        if (ny < 0 || ny >= this.mapSizeY || nx < 0 || nx >= this.mapSizeX || this.level.map[ny][nx] == 0){
            return false;
        }
        return true;
    }

    autoRotation(){
        /*
            Auto roation of the bot car
        */
        let right_dist = ROADSIZE + (ROADSIZE/3);
        let left_dist = ROADSIZE - (ROADSIZE/3.5);
        let same_dist = ROADSIZE;
        // If a next road is already define, we just check if this is the
        // good moment to turn
        if (this.car.next_road){
            let y_dist = Math.abs(((this.car.next_road.outroad.y + ROADSIZE/2) - this.car.y) * this.car.next_road.outroad_np.my);
            let x_dist = Math.abs(((this.car.next_road.outroad.x + ROADSIZE/2) - this.car.x) * this.car.next_road.outroad_np.mx);

            if (this.car.next_road.rotation_type == 0){ // Turn right
                if (y_dist < right_dist && x_dist < right_dist){
                    this.car.have_turned = true;
                    this.car.rotation = this.car.rotation += Math.PI/2;
                    this.car.rotation = this.car.rotation % (2*Math.PI);
                    this.car.next_road = undefined;
                    return;
                }
            }

            if (this.car.next_road.rotation_type == 1){ // Turn left
                if (y_dist < left_dist && x_dist < left_dist){
                    this.car.have_turned = true;
                    this.car.rotation = this.car.rotation -= Math.PI/2;
                    this.car.rotation = this.car.rotation % (2*Math.PI);
                    this.car.next_road = undefined;
                    return;
                }
            }

            if (this.car.next_road.rotation_type == 2){ // Rotation
                if (y_dist < same_dist && x_dist < same_dist){
                    this.car.have_turned = true;
                    this.car.rotation = this.car.rotation -= Math.PI;
                    this.car.rotation = this.car.rotation % (2*Math.PI);

                    if (y_dist != 0 && this.car.x < this.car.next_road.outroad.x + ROADSIZE/2){
                        this.car.x = this.car.next_road.outroad.x + ROADSIZE/2 + ROADSIZE/4;
                        this.car.y = this.car.next_road.outroad.y;
                    }
                    else if (y_dist != 0 && this.car.x > this.car.next_road.outroad.x + ROADSIZE/2){
                        this.car.x = this.car.next_road.outroad.x + ROADSIZE - ROADSIZE/2 - ROADSIZE/4;
                        this.car.y = this.car.next_road.outroad.y;
                    }
                    else if (x_dist != 0 && this.car.y < this.car.next_road.outroad.y + ROADSIZE/2){
                        this.car.y = this.car.next_road.outroad.y + ROADSIZE/2 + ROADSIZE/4;
                        this.car.x = this.car.next_road.outroad.x;
                    }
                    else if (x_dist != 0 && this.car.y > this.car.next_road.outroad.y + ROADSIZE/2){
                        this.car.y = this.car.next_road.outroad.y + ROADSIZE - ROADSIZE/2 - ROADSIZE/4;
                        this.car.x = this.car.next_road.outroad.x;
                    }

                    this.car.next_road = undefined;
                    return;
                }
            }

        }
        else{
            let key = this.car.rotation / Math.PI;
            let key_r = ((this.car.rotation / Math.PI) + 0.5) % 2;
            let key_l = ((this.car.rotation / Math.PI) - 0.5) % 2;

            let is_next_pos = this.rotationToNextCase[key];
            let is_next_pos_r = this.rotationToNextCase[key_r];
            let is_next_pos_l = this.rotationToNextCase[key_l];

            let turn = false;
            let nx = this.car.mx + is_next_pos.mx;
            let ny = this.car.my + is_next_pos.my;
            if (!this.isRoad(nx, ny)){
                turn = true;
            }
            else if (!this.car.have_turned && !this.car.turn_random){
                this.car.turn_random = Math.random();
            }
            else if(!this.car.have_turned && this.car.turn_random < 0.33 && this.isRoad(this.car.mx + is_next_pos_r.mx, this.car.my + is_next_pos_r.my)){
                turn = true;
            }
            else if(!this.car.have_turned && this.car.turn_random > 0.66 && this.isRoad(this.car.mx + is_next_pos_l.mx, this.car.my + is_next_pos_l.my)){
                turn = true;
            }
            if (turn){
                let possibles_rotations = [(key+0.5) % 2., (key-0.5) % 2., null];
                for (let p = 0; p < possibles_rotations.length; p++){
                    let next_pos = this.rotationToNextCase[possibles_rotations[p]];
                    let px = this.car.mx + next_pos.mx;
                    let py = this.car.my + next_pos.my;
                    if (this.isRoad(px, py)){
                        this.car.next_road = {
                            "outroad": {y : ny*ROADSIZE, x: nx*ROADSIZE},
                            "outroad_np": is_next_pos,
                            "rotation_type": p,
                        };
                        return;
                    }
                }
            }
        }
    }

    step(delta: number){
        /*
            Step into the environement
            @delta (Float) time since the last update
        */
        // Possible collision detected
        if (this.state.toString().indexOf(","+MAP.CAR.toString()) != -1){
            this.car.v = 0;
        }
        else{ // No collision, move forward
            this.car.v = 0.8;
            this.autoRotation();
        }

        // Update the x and y position according to the velocity
        this.car.x += this.car.v * Math.cos(this.car.rotation)*delta;
        this.car.y += this.car.v * Math.sin(this.car.rotation)*delta;
        // Update the x and x position according to the map
        this.car.mx = Math.floor(this.car.x / ROADSIZE);
        this.car.my = Math.floor(this.car.y / ROADSIZE);

        // Set the new road of the car (if changed)
        this.car.checkAndsetNewRoad();

        // Be sure to keep the lidar position at the same position than the car
        this.lidar.x = this.car.x;
        this.lidar.y = this.car.y;
        this.lidar.rotation = this.car.rotation;

        // Detection the new collision with the environement
        let {agent_col, on_road} = this.detectInteractions();

        if (agent_col.length > 0){
            this.car.v = 0;
        }
        return {agent_col, on_road};
    }
}
