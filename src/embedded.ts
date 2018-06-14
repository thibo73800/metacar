import {fullCity} from "./embedded/level/full_city";
import {level1} from "./embedded/level/level_1";
import {level0} from "./embedded/level/level_0";

/**
 * Object used to enumerate each
 * level embedded into the library.
 * 
 * @fullCity: A level to show the current capabilities of the environement.
 * @level1: A level with one agent, two cars, and simple control (top, down, left, right).
 * 
*/
export interface embeddedUrlI {
    fullCity: string;
    level1: string;
    level0: string;
};

export const embeddedUrl: embeddedUrlI = {
    fullCity: "embedded://level/fullCity",
    level1: "embedded://level/level1",
    level0: "embedded://level/level0"
}

export const embeddedContent: any = {
    level: {
        fullCity: fullCity,
        level1: level1,
        level0: level0
    }
}