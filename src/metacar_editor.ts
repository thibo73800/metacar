import { Level, LevelInfo } from "./level";
import { UIEvent, eventEditorLoadOptions } from "./ui_event";
import * as U from "./utils";
import { Editor } from "./editor";
import { ROADSIZE } from "./global";
import { eventLoadOptions } from "./metacar";

export class MetaCarEditor {

    private agent: any;
    private level: Editor;
    private canvasId: string;
    private levelUrl: string;
    private event: UIEvent;
    private eventList: string[] = ["save"]
    private eventCallback: any[];

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

    public load(level: string, agent: any): Promise<void>{
        /*
            Load the environement
            @level (String) Name of the json level to load
            @agent (Agent class)
        */
        return new Promise((resolve, reject) => {
            U.loadCustomURL(this.levelUrl, (content: LevelInfo) => {
                this.level = new Editor(content, this.canvasId);
                this.level.load((delta: number) => this.loop(delta));
                this.event = new UIEvent(this.level, this.canvasId);
                this.event.createEditorElementsEvents();

                this.eventCallback = [
                    (fc: any, options: eventEditorLoadOptions) => this.event.onSaveEditor(fc, options)
                ];

                resolve();
            });
        });
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
        const event =  this.eventList[index];
        this.eventCallback[index](fc, options);
    }

    private loop(delta: number): void{
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