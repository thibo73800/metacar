// Get the url of the desired level
let levelUrl = metacar.level.fullCity;
// Create the environment (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);
env.load();