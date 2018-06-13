import { Level, LevelInfo } from "./level";
import { UIEvent } from "./ui_event";
import * as U from "./utils";
import { Editor } from "./editor";

export class MetaCarEditor {

    private agent: any;
    private level: Editor;
    private canvasId: string;
    private levelUrl: string;
    private event: UIEvent;

    constructor(canvasId: string, levelUrl: string) {
        /**
         * @canvasId: HTML canvas ID to used
         * @level: URL or Local storage URL.
         *  localstorage://level-name
         *  embedded://
         *  http(s)://
        */
        if (!canvasId || this.levelUrl){
            console.error("You must specify the canvasId and the levelUrl");
        }
        this.canvasId = canvasId;
        this.levelUrl = levelUrl;
    }

    private _setEvents(){
        this.event = new UIEvent(this.level, this.canvasId);
        this.event.createEditorEvents();
    }

    public load(level: string, agent: any): Promise<void>{
        /*
            Load the environement
            @level (String) Name of the json level to load
            @agent (Agent class)
        */
        return new Promise((resolve, reject) => {
            U.loadCustomURL(this.levelUrl, (content: LevelInfo) => {
                this.level = new Editor(content, this.canvasId);    
                this._setEvents();
                this.level.load((delta: number) => this.loop(delta));
                resolve();
            });
        });
    }

    private loop(delta: number): void{

    }
}