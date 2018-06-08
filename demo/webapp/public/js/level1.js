// Get the url of the desired level
let levelUrl = metacar.level.level1;
// Create the environement (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);
env.load().then(() => {
    // The level is loaded. Add listernes
    env.addEvent("train", () => {
        console.log("On train!");
    });
    env.addEvent("play", () => {
        console.log("On play!");
    });
    env.addEvent("stop", () => {
        console.log("On sotp!");
    });
    env.addEvent("reset_env", () => {
        console.log("On reset env!");
    });
    env.addEvent("reset_agent", () => {
        console.log("On reset agent");
    })
    env.addEvent("save", () => {
        console.log("On save");
    });
    env.addEvent("load", (content) => {
        console.log("content", content);
    });
});
