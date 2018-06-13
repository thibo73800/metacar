/**
 * Event class
*/

import {Level} from "./level";
import {eventLoadOptions} from "./metacar";
import * as U from "./utils";

export class UIEvent {

    private playing: boolean;
    private canvasId: string;
    private buttonsContainer: HTMLDivElement;
    private level: Level;

    public playCallback: any;

    constructor(level: Level, canvasId: string){
        this.level = level;
        this.canvasId = this.canvasId;
        // Insert the event div
        var canvas = document.getElementById(canvasId);
        var buttons = document.createElement('div'); // create new textarea
        buttons.classList.add("metacar_buttons_container");
        buttons.id = "metacar_"+ canvasId + "_buttons_container";
        canvas.parentNode.insertBefore(buttons, canvas.nextSibling);
        this.buttonsContainer = buttons;
    }

    public isPlaying(): boolean{
        return this.playing;
    }

    private _createButton(parent: HTMLDivElement, name: string): HTMLButtonElement{
        var button = document.createElement('button'); // create new textarea
        button.classList.add("metacar_button_train");
        button.id = "metacar_"+ this.canvasId + "_button_" + name;
        // Uppercase first letter and replace _
        name = name.replace(/_/g , " ");
        button.innerHTML = name.charAt(0).toUpperCase() + name.slice(1);;
        parent.appendChild(button);
        return button
    }

    public onTrain(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "train");
        // Listen the event
        button.addEventListener("click", () => {
            this.level.render(false);
            if (fc) fc();
        });
    }

    public onPlay(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "play");
        // Listen the event
        button.addEventListener("click", () => {
            if (fc) {
                this.playing = true;
                this.playCallback = fc;
            }
        });
    }

    public onStop(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "stop");
        // Listen the event
        button.addEventListener("click", () => {
            this.playing = false;
            this.playCallback = undefined;
            if (fc) fc();
        });
    }

    public onResetEnv(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "reset_env");
        button.addEventListener("click", () => {
            this.level.reset();
            if (fc) fc();
        });
    }

    public onResetAgent(fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, "reset_agent");
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }
 
    public onCustomEvent(name: string, fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, name);
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    public onLoad(fc: any, options:eventLoadOptions = Object()){
        options.local = options.local || false;
        // Create the button
        const button = this._createButton(this.buttonsContainer, "load_trained_agent");
        // Create the fake input input file
        var input_file = document.createElement('input'); // create new textarea
        input_file.type = "file";
        input_file.accept = "*/*";
        input_file.style.display = "none";
        input_file.classList.add("metacar_button_input_file");
        input_file.id = "metacar_"+ this.canvasId + "_button_input_file";
        this.buttonsContainer.appendChild(input_file);

        input_file.addEventListener("change", (dump) => {
            U.readDump(dump, (content: any) => {
                if (fc) fc(content);
            });
        });

        button.addEventListener("click", () => {            
            if (options.local) {
                input_file.click();
            }
            else{
                if (fc) fc();
            }
        });
    }
}