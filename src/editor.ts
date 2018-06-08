import { LevelInfo, Roads } from "./level";
import { AssetManger, RoadSprite } from "./asset_manager";
import { Car} from "./car";
import {Loader, Sprite, JSON_TEXTURES, ROADSIZE, MAP, LEVEL_FOLDER} from "./global";
import * as U from "./utils";

/*
    @Level class
    This is the core of game, the class is used create all the differents
    services in the game (assets, map, agents...).
*/

export class Editor {

    public app: PIXI.Application = null; // The pixi app.
    // Informations on the level
    private levelName: string;
    private info: LevelInfo = null;
    private envs: any[] = [] // Used to list all elements the car can crash with
    public am: AssetManger;
    public map: (string|number)[][] = null; // Use the roads positions of the level
    public agent: any = null; // (@Car class) for the agent
    // Object to store all the roads assets
    // Each road is accesible as follow this.roads[[my, mx]]
    // with my and mx the (x, y) position relative to the map (not pixel).
    private cars: Car[] = []; // Array used to store all the cars assets
    private loop: any = null; // Loop method called for each render
    // Current selector items by the editor
    public selectedItems: any = null;
    private canvasId: string; // Id of the target canvas
    private roads: Roads = {};
    
    constructor(levelName: string, canvasId: string) {
        /*
            @levelName (String) Name of the level to load (.json)
        */
        this.levelName = levelName;
        this.canvasId = canvasId;
        this.am = new AssetManger(this);
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
        if (item.map_id == MAP.CAR){
            item.road.cars.splice(item.road.cars.indexOf(item.car_id), 1);
        }
        if (item.agent)
            this.agent = undefined;
        this.app.stage.removeChild(item);
        item.isremove = true;
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
            }, textures);
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

    load(loop: any){
        /*
            Load the map from the file given in the constructor of the class
            @loop (Method) This method will be call for each render
        */
        this.loop = loop;
        return new Promise((resolve, reject) => {
            // Load the level
            U.loadJSON(LEVEL_FOLDER + this.levelName, (response: any) => {
                // Parse JSON string into object
                this.info = JSON.parse(response);
                this.createLevel(this.info).then(() => resolve());
            });
        });
    }

    createLevel(info: LevelInfo){
        /*
            Create the level
            @info (Object) Level's json.
        */
        this.map = info.map; // Store the map to let it accessible faster later on.
        //Create the Pixi Application
        this.app = new PIXI.Application({
            width: this.map[0].length * ROADSIZE,
            height: this.map.length * ROADSIZE,
            backgroundColor: 0x80bf3e
          }
        );
        // Append the app to the body
        document.getElementById(this.canvasId).appendChild(this.app.view);

        return new Promise((resolve, reject) => {
            Loader.add(["textures/textures.json", "textures/textures.png"]).load(() => {
                    this.setup(info); // Set up the level (Add assets)
                    resolve();
            });
        });
    }

    setup(info: any){
        /*
            Setup all the element of the map
            @info (Object) Level's json.
        */
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

    resize(width: number, height: number){
        /*
            Resize the map
        */
        this.app.renderer.resize(width * ROADSIZE, height * ROADSIZE);
    }

    addChild(child: any){
        /**
         * Add child to the app
         */
        this.app.stage.addChild(child);
    }

    addCar(car: Car){
        /**
         * Add car to the level
        */
       this.cars.push(car);
       this.app.stage.addChild(car.core);
       this.envs.push(car.core);
    }

    getMap(): (string|number)[][] {
        return this.map;
    }

    getEnvs(): any[] {
        /**
         * Return the list of envs
         * /
        */
       return this.envs;
    }

    addRoad(road: RoadSprite){
        /*
            Add road using the mx and my positions
        */
       this.roads[[road.my.toString(), road.mx.toString()].toString()] = road;
       this.envs.push(road);
       this.app.stage.addChild(road);
    }

    findCarById(id: number){
        /*
            Find car by @id
        */
        return this.cars.find((e: any) => {return e.car_id == id});
    }

    getRoad(my: number, mx: number){
        return this.roads[[my.toString(), mx.toString()].toString()];
    }

    getRoads(){
        return this.roads;
    }
}

/*
function createEditor(id: string){

    // Get the DOM element to change the width/height of the map
    const height_input = document.getElementById("height_input");
    const width_input = document.getElementById("width_input");
    var width = parseInt((<HTMLInputElement>width_input).value);
    var height = parseInt((<HTMLInputElement>height_input).value);

    // Create the editor class
    let file = window.location.hash || "template.json";
    file = file.slice(1, file.length)
    console.log(file);
    var editor = new Editor(file, "string");

    // For the first init retrieve the widht and height of the map
    var fist_init = false;
    function init(){
        width = editor.map[0].length;
        height = editor.map.length;
        (<HTMLInputElement>width_input).value = width.toString();
        (<HTMLInputElement>height_input).value = height.toString();
    }

    function load(){
        if (!fist_init){
            fist_init = true;
            init();
        }
        let mouse_position = editor.app.renderer.plugins.interaction.mouse.global;
        if (editor.selectedItems && editor.selectedItems.type == "asset"){
            editor.selectedItems.x = mouse_position.x;
            editor.selectedItems.y = mouse_position.y;
        }
        else if (editor.selectedItems) {
            editor.selectedItems.x = Math.floor(mouse_position.x/ROADSIZE) * ROADSIZE;
            editor.selectedItems.y = Math.floor(mouse_position.y/ROADSIZE) * ROADSIZE;
        }
    }

    // Game loop
    editor.load((delta: any) => {
        load();
    });

    var classname = document.getElementsByClassName("img_item");
    for (var i = 0; i < classname.length; i++) {
        classname[i].addEventListener('click', function(this: any){
            editor.selectedItem({image : this.getAttribute('data-img'), type: this.getAttribute('data-type'), data: this.getAttribute("data-data")});
        }, false);
    }

    width_input.onchange = () => {
        width = parseInt((<HTMLInputElement>width_input).value);
        editor.resize(width, height);
    }

    height_input.onchange = () => {
        height = parseInt((<HTMLInputElement>height_input).value);
        editor.resize(width, height);
    }

    document.getElementById("saveMap").onclick = () => {
        editor.am.exportMap(width, height, file);
    };

    document.getElementById("canvas").addEventListener("click", () => {
        if (editor.selectedItems){
            editor.setCurrentItem();
        }
    });

    document.getElementById("loadMap").addEventListener("click", () => {
        window.location.href = "/editor.html#"+prompt("What is the name of the level ? (The file should be located in your level folder)");
        location.reload();
    });

    document.getElementById("canvas").addEventListener('contextmenu', event => event.preventDefault());
}*/