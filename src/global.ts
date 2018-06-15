/*
    Global variables
*/

import * as PIXI from 'pixi.js'

// PIXI Aliases
export const Application   = PIXI.Application;
export const Loader        = PIXI.loader;
export const Resources     = PIXI.loader.resources;
export const Sprite        = PIXI.Sprite;
export const Graphics      = PIXI.Graphics;
export const Container     = PIXI.Container;

// Main server
export const URL = window.location.href.indexOf("localhost") == -1 ? "https://metacar-project.com/" : "http://localhost:3000/";

// Textures files
export const JSON_TEXTURES = URL + "public/textures/textures.json";
// Textures files
export const JSON_IMAGE = URL + "public/textures/textures.png";

export const IMAGE_FOLDER = URL + "public/images/"

// Width and height of each road asset
export const ROADSIZE = 60;

export interface CARIMGI{
    DEFAULT: string;
    AGENT: string;
}

export const CAR_IMG: CARIMGI = {
    DEFAULT: "car.png", // Name of the image to represent a simple car
    AGENT: "car_agent.png" // Name of the image to represent an agent
}

export const MAP = {
    ROAD: -1,
    DEFAULT: 0,
    CAR: 1,
    AGENT: 1,
};

/*
* Asset configurations
*/
export const ASSETS: any = {
    ROADS: {
        "↕": {
            "image": "road_u.png",
            "orientation": 1.5
        },
        "↔": {
            "image": "road_r.png",
            "orientation": 0.
        },
        "↱": {
            "image": "road_rotate_ld.png",
            "orientation": 1.25
        },
        "↰": {
            "image": "road_rotate_ul.png",
            "orientation": 0.75
        },
        "↲": {
            "image": "road_rotate_rl.png",
            "orientation": 0.25
        },
        "↳": {
            "image": "road_rotate_dl.png",
            "orientation": 1.75
        },
        "↟": {
            "image": "road_up.png",
            "orientation": 1.5
        },
        "↠": {
            "image": "road_rp.png",
            "orientation": 0.
        },
        "↤": {
            "image": "road_r2.png",
            "orientation": 0.
        },
        "↦": {
            "image": "road_l2.png",
            "orientation": 1.
        },
        "↥": {
            "image": "road_d2.png",
            "orientation": 0.5
        },
        "↧": {
            "image": "road_u2.png",
            "orientation": 1.5
        },
    },
    "house":{
        "image": "house.png"
    },
    "house2":{
        "image": "house2.png"
    },
    "house3":{
        "image": "house3.png"
    },
    "bench":{
        "image": "bench.png"
    },
    "tree":{
        "image": "tree.png"
    }
}