/**
 * Event class
*/

import {Level} from "./level";
import {eventLoadOptions} from "./metacar";
import * as U from "./utils";
import { Editor } from "./editor";
import {ASSETS, IMAGE_FOLDER} from "./global";

export interface eventEditorLoadOptions {
    download: boolean;
    name: string;
}

export class UIEvent {

    private playing: boolean;
    private canvasId: string;
    private buttonsContainer: HTMLDivElement;
    private level: Level|Editor;
    private editorWidth: number;
    private editorHeight: number;

    public playCallback: any;

    constructor(level: Level|Editor, canvasId: string){
        this.level = level;
        this.canvasId = canvasId;
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

    public getEditorSize(): {width: number, height: number} {
        return {width: this.editorWidth, height: this.editorHeight};
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
 
    public onCustomEvent(name: string, fc: any){
        // Create the button
        const button = this._createButton(this.buttonsContainer, name);
        button.addEventListener("click", () => {
            if (fc) fc();
        });
    }

    public onSaveEditor(fc: any, options: eventEditorLoadOptions): void{
        const button = this._createButton(this.buttonsContainer, "save");
        button.addEventListener("click", () => {
            let size = this.getEditorSize();        
            let content = (<Editor>this.level).exportMap(size.width, size.height, options.name, options.download);
            if (fc) fc(content);
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

    private _createRangeBar(name: string): HTMLInputElement{
        // [Input] Range bar
        var inputProgress = document.createElement('input'); // create new textarea
        inputProgress.type = "range";
        inputProgress.min = "5";
        inputProgress.max = "15";
        inputProgress.value = "5";
        inputProgress.classList.add("metacar_"+name+"_input");
        inputProgress.id = "metacar_"+ this.canvasId + "_"+name+"_input";
        return inputProgress;
    }

    private _createSpan(name: string, text: string): HTMLSpanElement {
        // Span
        var span = document.createElement('span'); // create new textarea
        span.classList.add("metacar_"+name+"_span");
        span.id = "metacar_"+ this.canvasId + "_"+name+"_span";
        span.innerHTML = text;
        return span;
    }

    private _createImage(name: string, src: string): HTMLImageElement{
        // Span
        var img = document.createElement('img'); // create new textarea
        img.classList.add("metacar_img");
        img.id = "metacar_"+ this.canvasId + "_"+name+"_img";
        img.src = src;
        return img;
    }

    private _listenRangeChanges(widthInput: HTMLInputElement, heightInput: HTMLInputElement){
        widthInput.onchange = () => {
            let width = parseInt((widthInput).value);
            let height = parseInt((heightInput).value);
            this.level.resize(width, height);
            this.editorWidth = width;
            this.editorHeight = height;
        }
    
        heightInput.onchange = () => {
            let width = parseInt((widthInput).value);
            let height = parseInt((heightInput).value);
            this.level.resize(width, height);
            this.editorWidth = width;
            this.editorHeight = height;
        }
    }

    private _listenCanvasEditor(){

        document.getElementById(this.canvasId).addEventListener('contextmenu', event => event.preventDefault());

        document.getElementById(this.canvasId).addEventListener("click", () => {
            let selectedItem = (<Editor>this.level).getSelectedItems();
            if (selectedItem){
                (<Editor>this.level).setCurrentItem();
            }
        });
    }

    private _listenEditorImgs(){
        var classname = document.getElementsByClassName("metacar_img");
        let that = this;
        for (var i = 0; i < classname.length; i++) {
            classname[i].addEventListener('click', function(this: HTMLImageElement){
                (<Editor>that.level).selectedItem({
                        image : this.getAttribute('data-img'),
                        type: this.getAttribute('data-type'),
                        data: this.getAttribute("data-data")});
            }, false);
        }
    }

    public createEditorElementsEvents(){
        const widthText = this._createSpan("width", "Width");
        const widthProgress = this._createRangeBar("width");
        const heightText = this._createSpan("height", "Height");
        const heightProgress = this._createRangeBar("height");
        this.buttonsContainer.appendChild(widthText);
        this.buttonsContainer.appendChild(widthProgress);
        this.buttonsContainer.appendChild(heightText);
        this.buttonsContainer.appendChild(heightProgress);
        
        this._listenRangeChanges(widthProgress, heightProgress);
        this._listenCanvasEditor();

        let map = this.level.getMap();
        let width = map[0].length;
        let height = map.length;
        widthProgress.value = width.toString();
        heightProgress.value = height.toString();

        this.editorWidth = width;
        this.editorHeight = height;

        // Add the two cars images
        let agentImg = this._createImage("car_agent", IMAGE_FOLDER + "car_agent.png");
        agentImg.dataset.type = "agent";
        agentImg.dataset.img = "car_agent.png";
        this.buttonsContainer.appendChild(agentImg);
        let carImg = this._createImage("car_agent", IMAGE_FOLDER + "car.png");
        carImg.dataset.type = "car";
        carImg.dataset.img = "car.png";
        this.buttonsContainer.appendChild(carImg);

        // Add roads images
        const roads = ASSETS["ROADS"];
        for (let arrow in roads ){
            let nImg = this._createImage(roads[arrow].image.replace(".png", ""),  IMAGE_FOLDER + roads[arrow].image);
            nImg.dataset.type = "road";
            nImg.dataset.img = roads[arrow].image;
            nImg.dataset.data = arrow;
            this.buttonsContainer.appendChild(nImg);
        }

        for (let key in ASSETS){
            if (key != "ROADS"){
               // <img data-type="asset" data-img="bench.png" data-data="bench" class="img_item" src="images/bench.png">
               let nImg = this._createImage(key, IMAGE_FOLDER + ASSETS[key].image);
               nImg.dataset.img = ASSETS[key].image;
               nImg.dataset.data = key;
               nImg.dataset.type = "asset";
               this.buttonsContainer.appendChild(nImg);
            }
        }

        this._listenEditorImgs();
    }

}