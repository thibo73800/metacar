// Get the url of the desired level
let levelUrl = metacar.level.level0;
// Create the environement (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);

console.log(env);

env.setAgentMotion(metacar.motion.BasicMotion, {rotationStep: 0.1});
env.setAgentLidar({pts: 2, width: 1, height: 1, pos: 1});

// Create the Policy agent
var agent = new QTableAgent(env);

env.load().then(() => {
    // The level is loaded. Add listernes
    env.addEvent("train", () => agent.train());
    env.addEvent("play", () => agent.play());
    env.addEvent("stop");
    env.addEvent("reset_env", () => {
        console.log("On reset env!");
    });
    env.addEvent("save", () => agent.save());
    env.addEvent("load", (content) => agent.restore(content), {local: true});
});
