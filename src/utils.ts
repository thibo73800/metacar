import {embeddedContent} from "./embedded";

/*
    File with some usefull methods
*/
export function loadJSON(url: string, callback: any) {
    /*
        Utils method to load a json on the server
        @url: Url to the json file to load
        @callback: Method to call when the json file is loaded
    */
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
         if (xobj.readyState == 4 && xobj.status == 200) {
           // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
           callback(xobj.responseText);
         }
    };
    xobj.send(null);
}

export function loadEmbeddedURL(url: string, callback: any):void {
    let split = url.split("//");
    split = split[1].split("/");
    callback(embeddedContent[split[0]][split[1]]);
}

export function loadLocalStorageURL(url: string, callback: any):void{
}

export function loadCustomURL(url: string, callback: any):void {
    /**
     * @url: CustomURL to load
         *  localstorage://level-name
         *  http(s)://
         *  embedded:://
       @callback function onece the content is loaded
    */
   const customCall: any = {
        "embedded:": loadEmbeddedURL,
        "http://": loadJSON,
        "https://": loadJSON,
        "localstorage://": loadLocalStorageURL
   }
   const split = url.split("//");
   customCall[split[0]](url, callback);
}

export function mod(n: number, m:number) {
  return ((n % m) + m) % m;
}

export function argMax(array: number[]) {
    /*
        Return the argmax of an array.
    */
    if (array.every((v) => v == -Infinity)){
        return Math.floor(Math.random()*array.length);
    }
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

export function mean(array: number[]){
    /**
     * Return the mean of the array
    */
    if (array.length == 0)
        return null;
    var sum = array.reduce(function(a, b) { return a + b; });
    var avg = sum / array.length;
    return avg;
}

export function saveAs(content: string, name: string) {
    var a = document.createElement("a");
    //a.style = "display: none";
    document.body.appendChild(a);

    var blob = new Blob([content], { type: 'application/octet-binary' }),
        tmpURL = window.URL.createObjectURL(blob);

    a.href = tmpURL;
    a.download = name;
    a.click();

    window.URL.revokeObjectURL(tmpURL);
    a.href = "";
}

/*
function readBuffer(buffer) {
    var reader = new BinaryReader(buffer)

    console.log(reader);

    var validation = reader.getUint8()

    if (validation !== BinaryWriter.validationByte) {
        throw "validation byte doesn't match."
    }

    var tocLength = reader.getUint32();
    var tocString = reader.getString(tocLength);
    var toc = JSON.parse(tocString);
    var contents = [];

    for (var i = 0; i < toc.length; i++) {
        switch (toc[i].t) {
            case 's': contents.push(reader.getString(toc[i].l)); break
            case 't': contents.push(new (typeof window !== 'undefined' ? window : global)[toc[i].i](reader.getBuffer(toc[i].l))); break
            case 'b': contents.push(reader.getBuffer(toc[i].l)); break
        }

        if (toc[i]['o'] === 1) {
            contents[i] = JSON.parse(contents[i]);
        }
    }

    return contents
}
*/

export function readDump(dump: any, callback: any) {
    var input = dump.target;
    var file = input.files[0];
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (evt:any) => {
        callback(evt.target.result);
    }
}


export function shuffleArray(array: number[]) {
    /**
     * Shuffle an @array of numbers
    */
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/*
function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
}
*/

export interface KeyBoard{
    [key: string]: any;
}

export function keyboard(keyCode: any ) {
    let key: KeyBoard = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    
    key.downHandler = (event: any) => {
      if (event.keyCode === key.code) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
      }
      event.preventDefault();
    };
  
    key.upHandler = (event: any) => {
      if (event.keyCode === key.code) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
      }
      event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
      "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
      "keyup", key.upHandler.bind(key), false
    );
    return key;
}