let levelUrl = metacar.level.level2;

var env = new metacar.env("canvas", levelUrl);

env.setAgentMotion(metacar.motion.ControlMotion, {});

env.loop(() => {
    let state = env.getState();
    displayState("realtime_viewer", state, 200, 200);
    let reward = env.getLastReward();
    displayScores("realtime_viewer", [], reward, []);
});

env.load();