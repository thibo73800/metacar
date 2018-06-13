import { LevelInfo, Roads } from "./level";
import { AssetManger, RoadSprite } from "./asset_manager";
import { Car } from "./car";
import { ROADSIZE, Loader } from "./global";

export class World {

    public agent: Car = null; // (@Car class) for the agent

    // Informations on the level
    protected levelName: string;
    protected app: PIXI.Application = null; // The pixi app.
    protected am: AssetManger;  // The AssetManger is used to set most of the elements on the map
    protected map: (string|number)[][] = null; // Use the roads positions of the level
    protected info: LevelInfo = null;  // Information of the loaded level
    protected envs: any[] = [] // Used to list all elements the car can crash with
    // Object to store all the roads assets
    // Each road is accesible as follow this.roads[[my, mx]]
    // with my and mx the (x, y) position relative to the map (not pixel).
    protected roads: Roads = {};
    protected loop: any; // Loop method called for each render
    protected canvasId: string; // Id of the target canvas
    protected cars: Car[] = [];

    constructor(levelContent: LevelInfo, canvasId: string) {
        /*
            @levelName (String) Name of the level to load (.json)
        */
       this.info = levelContent;
       this.canvasId = canvasId;
    }

    public load(loop: any){
        /*
            Load the map from the file given in the constructor of the class
            @loop (Method) This method will be call for each render
        */
        this.loop = loop;
        return new Promise((resolve, reject) => {
            this.createLevel(this.info).then(() => resolve());
        });
    }

    public createLevel(info: LevelInfo){
        /*
            Create the level
            @info Information about the level
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
            Loader.add(["public/textures/textures.json", "public/textures/textures.png"]).load(() => {
                    this._setup(info); // Set up the level (Add assets)
                    resolve();
            });
        });
    }

    protected _setup(info: LevelInfo){
        console.warn("This method should be implemented.");
    }

    public getRoads(): Roads {
        return this.roads;
    }

    public findCarById(id: number): Car{
        /*
            Find car by @id
        */
        return this.cars.find((e: any) => {return e.car_id == id});
    }

    public getRoad(my: number, mx: number): RoadSprite {
        return this.roads[[my.toString(), mx.toString()].toString()];
    }

    public addRoad(road: RoadSprite){
        /*
            Add road using the mx and my positions
        */
       this.roads[[road.my.toString(), road.mx.toString()].toString()] = road;
       this.envs.push(road);
       this.app.stage.addChild(road);
    }

    public addCar(car: Car){
        /**
         * Add car to the level
        */
       this.cars.push(car);
       this.app.stage.addChild(car.core);
       this.envs.push(car.core);
    }

    public getEnvs(): any[] {
        /**
         * Return the list of envs
         * /
        */
       return this.envs;
    }

    public getMap(): (string|number)[][] {
        return this.map;
    }

    public addChild(child: any){
        /**
         * Add child to the app
         */
        this.app.stage.addChild(child);
    }

    render(val: boolean){
        if (val){
            this.app.ticker.start();
        }
        else{
            this.app.ticker.stop();
        }
    }

    public reset(){
    }

}