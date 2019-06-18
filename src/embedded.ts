import {fullCity} from "./embedded/level/full_city";
import {level1} from "./embedded/level/level_1";
import {level0} from "./embedded/level/level_0";
import {level2} from "./embedded/level/level_2";
import {level3} from "./embedded/level/level_3";

/**
 * Object used to enumerate each
 * level embedded into the library.
 * 
 * @fullCity: A level to show the current capabilities of the environment.
 * @level0: A simple level with no other cars and a simple control (top, down, left, right)
 * @level1: A level with one agent, two cars, and simple control (top, down, left, right).
 * @level2: Level with no other cars. The control is handle by two continous values (throttle and steering angle)
 * 
*/
export interface embeddedUrlI {
    fullCity: string;
    level1: string;
    level2: string;
    level3: string;
    level0: string;
};

export const embeddedUrl: embeddedUrlI = {
    fullCity: "embedded://level/fullCity",
    level1: "embedded://level/level1",
    level2: "embedded://level/level2",
    level3: "embedded://level/level3",
    level0: "embedded://level/level0",
}

export const embeddedContent: any = {
    level: {
        fullCity: fullCity,
        level1: level1,
        level0: level0,
        level2: level2,
        level3: level3
    }
}