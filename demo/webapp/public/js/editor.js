// Get the url of the desired level
let levelUrl = metacar.level.fullCity;
// Create the editor (canvasID, levelUrl)
var env = new metacar.editor("canvas", levelUrl);

env.load().then(() => {
    console.log("Env is loaded");
});