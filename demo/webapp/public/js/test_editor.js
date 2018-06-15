// Retrieve the object from storage
var levelObject = localStorage.getItem('mylevel.json');
if (levelObject){
    levelObject = JSON.parse(levelObject);
    var env = new metacar.env("env", levelObject);
    env.setAgentMotion(metacar.motion.BasicMotion, {rotationStep: 0.1});
    env.setAgentLidar({pos: 1});
    env.load();
}