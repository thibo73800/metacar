import { MotionEngine, actionSpaceDescription } from "./motion_engine";
import {Level} from "./level";

import {
    MAP, ROADSIZE
} from "./global";

import * as U from "./utils";

export class ControlMotionEngine extends MotionEngine {

    private actions: (string|number)[];
    private maxSpeed: number = 2.0;

    constructor(level: Level) {
        /*
            @level (Level class)
            @options (Object) Option to build the motion engine
                @rotation_step: Between 0 and 2. (rotation_step*Pi)
                @actions: List of possible actions (Left, Right, Up, Down, Wait)
        */
        super(level);

        this.level = level;
        this.actions = ["SteeringAngle", "Throttle"]
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
        // Set up keyboard interaction
        this.setUpKeyboard();
        // Setup up velocity to 0
        this.car.v = 0;
        this.car.a = 0; // Acceleration
        this.car.yaw_rate = 0;

        this.detectInteractions();
    }

    setUpKeyboard(){
        /*
            Setup possible keyboard interactions
        */
        let left = U.keyboard(37);
        let up  = U.keyboard(38);
        let right = U.keyboard(39);
        let down = U.keyboard(40);

        left.press = () => {
            this.turn(-0.7);
        };
        left.release = () => {
            this.turn(0);
        };

        right.press = () => {
            this.turn(0.7);
        };
        right.release = () => {
            this.turn(0);
        };

        // Move forward
        up.press = () => { this.move(1); };
        up.release = () => {
            this.car.a = 0;
        };

        // Move backward
        down.press = () => { this.move(-1);};
        down.release = () => {
            this.car.a = 0;
        };
    }

    turn(value: number){
        /*
            Turn
            @value: yaw_rate value Between -1 and 1
        */
        this.car.yaw_rate = value;
    }

    move(throttle: number){
        /*
            Move forward
            @throttle throttle value Between -1 and 1
        */
        this.car.a = throttle;
    }

    actionStep(delta: number, actions: number[]){
        /*
            Step into the environment with one action
            @delta (Float) time since the last update
            @action: (Array of Float) The throttle and the steering angle
        */
        this.car.a = Math.min(Math.max(actions[0], -1), 1);
        this.car.yaw_rate = Math.min(Math.max(actions[1], -1), 1);
        let {agentCollisions, onRoad} = this.step(delta);
        this.car.a = 0;
        this.car.yaw_rate = 0;
        return {agentCollisions, onRoad};
    }

    /**
     * Return a description of the action space.
     */
    public actionSpace(): actionSpaceDescription {
        return {
            type: "Continous",
            size: 2,
            range: [[0., 1.], [-1., 1.]]
        }
    }

    step(delta: number){
        /*
            Step into the environment
            @delta (Float) time since the last update
        */
       this.car.last_a = this.car.a;
       this.car.last_yaw_rate = this.car.yaw_rate;

        // The car lose speed over time
        if (this.car.v > 0 && this.car.a == 0)
            this.car.v = Math.max(0, this.car.v - 0.01);
        else if (this.car.v < 0 && this.car.a == 0)
            this.car.v = Math.min(0, this.car.v + 0.01);

        if (this.car.a > 0 && this.car.v >= 0)
            this.car.v = Math.min(this.maxSpeed, this.car.v + this.car.a*0.005);
        else if (this.car.a > 0 && this.car.v < 0){
            this.car.v = Math.min(this.maxSpeed, this.car.v + this.car.a*0.03);
        }
        if (this.car.a < 0 && this.car.v <= 0)
            this.car.v = Math.max(-this.maxSpeed, this.car.v + this.car.a*0.005);
        else if (this.car.a < 0 && this.car.v > 0){
            this.car.v = Math.max(-this.maxSpeed, this.car.v + this.car.a*0.03);
        }
        if (this.car.yaw_rate == 0){
            this.car.x += this.car.v * Math.cos(this.car.rotation)*delta;
            this.car.y += this.car.v * Math.sin(this.car.rotation)*delta;
        }
        else{
            // Rewrite the yaw rate
            let yr = this.car.yaw_rate*0.01*(this.car.v+0.001)*Math.PI;

            this.car.x += (this.car.v/yr)*(Math.sin(this.car.rotation+(yr*delta)) - Math.sin(this.car.rotation));
            this.car.y += (this.car.v/yr)*(Math.cos(this.car.rotation) - Math.cos(this.car.rotation+(yr*delta)));

            this.car.rotation += yr*delta;
        }
        // Update the x and x position according to the map
        this.car.mx = Math.floor(this.car.x / ROADSIZE);
        this.car.my = Math.floor(this.car.y / ROADSIZE);

        // Set the new road of the car (if changed)
        this.car.checkAndsetNewRoad();

        // Be sure to keep the lidar position at the same position than the car
        this.lidar.x = this.car.x;
        this.lidar.y = this.car.y;
        this.lidar.rotation = this.car.rotation;

        // Detection the new collision with the environment
        let {agentCollisions, onRoad} = this.detectInteractions(true, true);

        if (agentCollisions.length > 0){ // Stop the vehicle if a collision is detected
            this.car.v = 0;
            this.car.vy = 0;
        }
        return {agentCollisions, onRoad};
    }
}
