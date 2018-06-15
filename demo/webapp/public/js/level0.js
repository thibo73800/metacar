// Get the url of the desired level
let levelUrl = metacar.level.level0;
// Create the environement (canvasID, levelUrl)
var env = new metacar.env("canvas", levelUrl);

console.log(env);

env.setAgentMotion(metacar.motion.BasicMotion, {rotationStep: 0.1});
env.setAgentLidar({pts: 2, width: 1, height: 1, pos: 1});
env.carsMoving(false);

// Create the Policy agent
var agent = new QTableAgent(env, 2);

env.loop(() => {
    let state = env.getState();
    displayState("realtime_viewer", state, 200, 200);
    let scores = agent.getStateValues(state);
    let reward = env.getLastReward();
    //displayScores("realtime_viewer", scores, reward, ["Top", "Left", "Right"]);
})

env.load().then(() => {
    // The level is loaded. Add listernes
    env.addEvent("train", () => agent.train());
    env.addEvent("play", () => agent.play());
    env.addEvent("stop");
    env.addEvent("reset_env", () => {
        console.log("On reset env!");
    });
    env.addEvent("save", () => agent.save());
    env.addEvent("load", (content) => {
        agent.restore(content);
        displayQTable("q_table", agent.stateList, agent, ["Top", "Left", "Right"]);
    } , {local: true});
    env.addEvent("custom", () => {
    });
});
