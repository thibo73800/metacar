
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