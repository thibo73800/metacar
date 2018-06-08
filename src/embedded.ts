import {fullCity} from "./embedded/level/full_city";
import {level1} from "./embedded/level/level_1";

export const embeddedUrl: any = {
    fullCity: "embedded://level/fullCity",
    level1: "embedded://level/level1"
}

export const embeddedContent: any = {
    level: {
        fullCity: fullCity,
        level1: level1
    }
}