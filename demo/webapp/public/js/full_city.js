// Get the url of the desired level
let levelUrl = metacar.level.fullCity;
// Create the environement (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);
env.load().then(() => {
    // The level is loaded
    
});