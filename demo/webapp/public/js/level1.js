// Get the url of the desired level
let levelUrl = metacar.level.level1;
// Create the environement (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);

// Create the Policy agent
var agent = new PolicyAgent(env);

env.loop(() => {
    let state = env.getState();
    displayState("realtime_viewer", state, 200, 200);
    let scores = agent.getStateValues(state);
    let reward = env.getLastReward();
    displayScores("realtime_viewer", scores, reward, ["Top", "Left", "Right"]);
});

env.load().then(() => {
    // The level is loaded. Add listernes
    env.addEvent("train", () => agent.train());
    env.addEvent("play", () => agent.play());
    env.addEvent("stop", () => agent.stop());
    env.addEvent("reset_env", () => {
        console.log("On reset env!");
    });
    env.addEvent("save", () => agent.save());
    env.addEvent("load", () => agent.restore());
});
