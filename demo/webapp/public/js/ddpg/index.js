let levelUrl = metacar.level.level2;

var env = new metacar.env("canvas", levelUrl);

env.setAgentMotion(metacar.motion.ControlMotion, {});
env.setAgentLidar({pts: 5, width: 3, height: 7, pos: -0.5})

// js/DDPG/ddpg.js
var agent = new DDPGAgent(env, {
    stateSize: 26,
    resetEpisode: true,
    saveDuringTraining: true,
    saveInterval: 10
});

initMetricsContainer("statContainer", ["Reward", "ActorLoss", "CriticLoss", "EpisodeDuration", "NoiseDistance"]);

let it = 0;
env.loop(() => {
    let state = env.getState();
    displayState("realtime_viewer", state.lidar, 200, 200);
    let reward = env.getLastReward();
    const qValue = agent.getQvalue(state.linear, [state.a, state.steering]);
    if (it % 10 == 0)
        displayScores("realtime_viewer", [qValue, state.a, state.steering], reward, ["Q(a, s)", "Acceleration", "Steering Angle"]);
    it += 1;
});

env.load().then(() => {

    env.addEvent("train [Background]", () => {
        let train = confirm("The training process takes some time and might slow this tab. Do you want to continue? \n You can also load a pre-trained model.");        
        if (train){
            env.render(false);
            agent.train(false);
        }
    });

    env.addEvent("Train [Show the training]", () => {
        env.steping(false);
        agent.train(true);
    });

    env.addEvent("shuffle", () => {
        env.shuffle({cars: false});
    })
    
    env.addEvent("play", () => {
        agent.play();
    });

    env.addEvent("stop", () => {
        agent.stop();
    });

    env.addEvent("reset_env"); 

    env.addEvent("save", () => {
        agent.save("model-ddpg-road");
    });

    env.addEvent("load", () => {
        agent.restore("ddpg-road", "model-ddpg-road")
    });
});

