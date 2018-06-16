import { LevelInfo } from "./level";
import { UIEvent, eventEditorLoadOptions } from "./ui_event";
import * as U from "./utils";
import { Editor } from "./editor";
import { ROADSIZE } from "./global";

export class MetaCarEditor {

    private level: Editor;
    private canvasId: string;
    private levelToLoad: string|Object;
    private event: UIEvent;
    private eventList: string[] = ["save"];
    private eventCallback: any[];

    /**
     * @canvasId: HTML canvas ID
     * @levelToLoad: URL of the level or directly the level's object.
     *  URL format: embedded://... or http(s)://...
    */
    constructor(canvasId: string, levelToLoad: string) {
        if (!canvasId || this.levelToLoad){
            console.error("You must specify the canvasId and the levelToLoad");
        }
        this.canvasId = canvasId;
        this.levelToLoad = levelToLoad;
    }

    public load(): Promise<void>{
        /*
            Load the environement
            @level (String) Name of the json level to load
            @agent (Agent class)
        */
        return new Promise((resolve) => {
            if (typeof this.levelToLoad == "string"){
                U.loadCustomURL(<string>this.levelToLoad, (content: LevelInfo) => {
                    this.level = new Editor(content, this.canvasId);
                    this.level.load(() => this.loop());
                    this.event = new UIEvent(this.level, this.canvasId);
                    this.event.createEditorElementsEvents();

                    this.eventCallback = [
                        (fc: any, options: eventEditorLoadOptions) => this.event.onSaveEditor(fc, options)
                    ];
                    resolve();
                });
            }
            else{
                this.level = new Editor(<LevelInfo>this.levelToLoad, this.canvasId);
                this.level.load(() => this.loop());
                this.event = new UIEvent(this.level, this.canvasId);
                this.event.createEditorElementsEvents();

                this.eventCallback = [
                    (fc: any, options: eventEditorLoadOptions) => this.event.onSaveEditor(fc, options)
                ];
                resolve();
            }
        });
    }

    /**
     * Usefull method to save/download a string as file.
     * @content The content of the file
     * @file_name The name of the file
     */
    public save(content: string, file_name: string): void{
        /*
            Save the agent
        */
        U.saveAs(content, file_name);
    }

    /**
     * This method is used to add button under the canvas. When a
     * click is detected on the window, the associated @fc is called.
     * Some events are recognized by the environement, others can be custom.
     * @eventName Name of the event to listen.
     * @fc Function to call each time this event is raised.
     * @options: eventEditorLoadOptions {download: true|false}. Use to download the file as a json for the "save" event.
     */
    addEvent(eventName: string, fc: any, options?: eventEditorLoadOptions):void {
        const index = this.eventList.indexOf(eventName);
        if (index == -1){
            this.event.onCustomEvent(eventName, fc);
            return;
        }
        this.eventCallback[index](fc, options);
    }

    private loop(): void{
        let mousePos = this.level.getMousePosition();
        let selectedItem = (<Editor>this.level).getSelectedItems();
        if (selectedItem && selectedItem.type == "asset"){
            selectedItem.x = mousePos.x;
            selectedItem.y = mousePos.y;
        }
        else if (selectedItem) {
            selectedItem.x = Math.floor(mousePos.x/ROADSIZE) * ROADSIZE;
            selectedItem.y = Math.floor(mousePos.y/ROADSIZE) * ROADSIZE;
        }
    }
}