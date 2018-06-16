
function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
}

function mean(array){
    if (array.length == 0)
        return null;
    var sum = array.reduce(function(a, b) { return a + b; });
    var avg = sum / array.length;
    return avg;
}

function argMax(array) {
    /*
        Return the argmax of an array.
        TODO: Should be replace soon by the usage of Tensorflow.js
    */
    if (array.every((v) => v == -Infinity)){
        return Math.floor(Math.random()*array.length);
    }
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

/*
    File with some usefull methods
*/
function loadJSON(url, callback) {
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
           console.log(xobj.responseText);
           callback(JSON.parse(xobj.responseText));
         }
    };
    xobj.send(null);
}