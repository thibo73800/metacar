import { LevelInfo, Roads } from "./level";
import { AssetManger, RoadSprite } from "./asset_manager";
import { Car} from "./car";
import {Loader, Sprite, JSON_TEXTURES, ROADSIZE, MAP} from "./global";
import * as U from "./utils";
import {UIEvent} from "./ui_event";
import { World } from "./world";

/*
    @Level class
    This is the core of game, the class is used create all the differents
    services in the game (assets, map, agents...).
*/

export class Editor extends World {

    // Current selector items by the editor
    private selectedItems: any = null;
    private event: UIEvent;
    
    constructor(levelContent: LevelInfo, canvasId: string) {
        /*
            @levelName (String) Name of the level to load (.json)
        */
        super(levelContent, canvasId);
        this.am = new AssetManger(this);
    }

    private _setEvents(): void{

    }

    protected _setup(info: LevelInfo){
        /*
            Setup all the element of the map
            @info (Object) Level's json.
        */
        this._setEvents();
        // Load the textures file
        let textures = Loader.resources[JSON_TEXTURES].textures;
        // Load all elements of the car
        this.am.createMap(this.map, info, textures, false);
        this.am.createCars(this.map, info, textures);
        if (info.agent)
            this.agent = this.am.createAgent(this.map, info, textures);

        var that = this;
        for (var i = 0; i < this.envs.length; i++) {
            this.envs[i].interactive = true;
            this.envs[i].on("rightclick", function(this: any) {that.removeItem(this)});
        }
        for (var i = 0; i < this.am.assets.length; i++) {
            this.am.assets[i].interactive = true;
            this.am.assets[i].on("rightclick", function(this: any) {that.removeItem(this)});
        }

        // Set up the main loop
        this.app.ticker.add(delta => this.loop(delta));
    }

    public resize(width: number, height: number){
        /*
            Resize the map
        */
        this.app.renderer.resize(width * ROADSIZE, height * ROADSIZE);
    }

    getSelectedItems(){
        return this.selectedItems;
    }

    selectedItem(item: any){
        /*
            Method to select an items.
            Once an item is selected, the item stick to the current
            mouse position
            @items (Object)
                @img (String)
                @type (String)
        */
        if(this.selectedItems){
            this.app.stage.removeChild(this.selectedItems);
        }
        let textures = Loader.resources[JSON_TEXTURES].textures;
        this.selectedItems = new Sprite(textures[item.image]);
        this.selectedItems.type = item.type;
        this.selectedItems.image = item.image;
        this.selectedItems.data = item.data;
        // The road is not an obstacle
        this.selectedItems.x = 0;
        this.selectedItems.y = 0;
        this.app.stage.addChild(this.selectedItems);
    }

    removeItem(item: any){
        if (item.lidar){
            this.app.stage.removeChild(item.lidar);
        }
        if (item.mapId == MAP.CAR){
            item.road.cars.splice(item.road.cars.indexOf(item.car_id), 1);
        }
        if (item.agent)
            this.agent = undefined;
        this.app.stage.removeChild(item);
        item.isremove = true;
        console.log(item.isremove, item.agent, this.agent);
    }

    exportMap(width: number, height: number, file_name: string, download: boolean): any{
        return this.am.exportMap(width, height, file_name, download);
    }

    setCurrentItem(){
        this.am.addAsset(this.selectedItems);
        let textures = Loader.resources[JSON_TEXTURES].textures;
        var that = this;
        if (this.selectedItems.type == "road"){
            this.am.createRoad({
                    mx: Math.floor(this.selectedItems.x / ROADSIZE),
                    my: Math.floor(this.selectedItems.y / ROADSIZE),
                    type: this.selectedItems.data
            }, textures, this.selectedItems.data);
            this.envs[this.envs.length - 1].interactive = true;
            this.envs[this.envs.length - 1].on("rightclick", function(this: any) {that.removeItem(this)});
        }
        else if (this.selectedItems.type == "car"){
            this.am.createCars(this.map, {cars:[{
                "mx": Math.floor(this.selectedItems.x / ROADSIZE),
                "my": Math.floor(this.selectedItems.y / ROADSIZE),
                "rotation": 0,
                "line": 0,
            }]}, textures);
            this.envs[this.envs.length - 1].interactive = true;
            this.envs[this.envs.length - 1].on("rightclick", function(this: any) {that.removeItem(this)});
        }
        else if (this.selectedItems.type == "agent" && this.agent == undefined){
            this.agent = this.am.createAgent(this.map, {agent:{
                "mx": Math.floor(this.selectedItems.x / ROADSIZE),
                "my": Math.floor(this.selectedItems.y / ROADSIZE),
                "rotation": 0,
                "line": 0,
                "motion": {
                    "type": "BasicMotionEngine",
                    "options":{
                        "rotation_step": 0.5,
                        "actions": ["UP", "LEFT", "RIGHT", "DOWN", "WAIT"]
                    }
                }
            }}, textures);
            this.envs[this.envs.length - 1].interactive = true;
            this.envs[this.envs.length - 1].on("rightclick", function(this: any) {that.removeItem(this)});
        }
        else if (this.selectedItems.type == "asset"){
            this.am.createAsset(this.selectedItems.image, {x: this.selectedItems.x, y: this.selectedItems.y} ,textures, this.selectedItems.data);
            this.am.assets[this.am.assets.length - 1].interactive = true;
            this.am.assets[this.am.assets.length - 1].on("rightclick", function(this: any) {that.removeItem(this)});
        }
        this.app.stage.removeChild(this.selectedItems);
        this.selectedItems = null;
    }
}

/*
function createEditor(id: string){


    document.getElementById("saveMap").onclick = () => {
        editor.am.exportMap(width, height, file);
    };
}*/