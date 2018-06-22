let levelUrl = metacar.level.level2;

var env = new metacar.env("canvas", levelUrl);

env.setAgentMotion(metacar.motion.ControlMotion, {});


// js/DDPG/ddpg.js
var agent = new DDPGAgent(env);

initMetricsContainer("statContainer", ["Reward", "ActorLoss", "CriticLoss", "EpisodeDuration", "Distance"]);

env.loop(() => {
    let state = env.getState();
    displayState("realtime_viewer", state.lidar, 200, 200);
    let reward = env.getLastReward();
    const qValue = agent.getQvalue(state.linear, [state.a, state.steering]);
    displayScores("realtime_viewer", [qValue], reward, ["Q(a, s)"]);
});

env.load().then(() => {
    // Train agent
    env.addEvent("train", () => {
        agent.train(false);
    });

    env.addEvent("play", () => {
        agent.play();
    });

    env.addEvent("TrainRealTime", () => {
        env.steping(false);
        agent.train(true);
    });

    env.addEvent("stop", () => {
        agent.stop();
    });

    env.addEvent("reset_env"); 
});
