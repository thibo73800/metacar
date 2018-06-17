# Metacar: A reinforcement learning environment for self-driving cars in the browser.

[<img style="display: block; width: 100%; margin: auto;"</> src="https://github.com/thibo73800/metacar/blob/master/img/header_github.png" />](https://www.metacar-project.com)

<b>Metacar</b> is a 2D reinforcement learning environment for autonomous vehicles running in the browser. The project aims to let reinforcement learning be more accessible to everyone through solving fun problems. Metacar comes with a set of a predefined level, some harder to address than others. More levels and possibilities of scenario will be added soon (pedestrian, bikes...). Furthermore, the library let you create your own levels and personalize the environment to create your desired scenario.

If you want to be part of the project, whether to implement features in the environment or demonstrate algorithm, feel free to join
the [slack channel](https://join.slack.com/t/metacar/shared_invite/enQtMzgyODI4NDMzMDc0LTY1MjIwNzk1MTAzOTBiZjJlOGUwM2YyYjA3MzBmNjQyNjUyMDZkOGNkYmU0MmUyYzUzNGRhNGJhZDE1M2EzNzM) ask questions and talk about all your fantastic ideas! 

To start developing with metacar check out the Documentation and the [API Reference](http://metacar-project.com/docs/modules/_index_.html)

You can also take a look at the [online demo](https://www.metacar-project.com).

# Documentation

### Table of contents:
1. [Getting Started](#getting-started)
2. [Your first environement](#first-env)
3. [Interact with the environement](#interact-env)
4. [Custom the environement](#configure-env)
5. [Edit your own level](#create-level)

<a id='getting-started'></a>
Getting started
------------

### Installing Metacar 

You can use Metacar with a direct link in your HTML file or install it from NPM. However, metacar is based on [Pixi.js](www.pixijs.com): 4.7.1, then you need to include pixi.js as a global dependency in your HTML.

<a id='script-tag'></a>
#### Script Tag

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Metacar: Documentation</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.7.1/pixi.min.js"></script>
</head>
<body>
    <script src="https://cdn.jsdelivr.net/npm/metacar@0.0.1/dist/metacar.min.js"></script>
</body>
</html>
```

#### Script Tag and NPM

```shell
npm i metacar
```

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Metacar: Documentation</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.7.1/pixi.min.js"></script>
</head>
<body>
    <script src="yourscript.js"></script>
</body>
</html>
```
```javascript
import Metacar from "metacar";
```

------------

<a id='first-env'></a>
Your first environement
------------

Even if you can [create your own level](#create-level), Metacar comes up with a set of predefined level accessible under [metacar.level](#). Once your level is selected, you can use it to create a first environment. <br>

```javascript
// Select a level
const level = metacar.level.level1;
// Create the environement
const env = new metacar.env("env", level);
// Load it
env.load();
```

You also have to create the container in your HTML file.
```html
<div id="env"></div>
```
(NOTE: metacar.env can be instantiated with an object or a string for the level parameters: [doc API](http://metacar-project.com/docs/classes/_metacar_.metacar.html#constructor))

<b>Wonderful! You just created your first metacar environment. </b> You can take some time to play around with the arrow keys to move the car. The current collision system supports the detection of the following events:

* Collisions with other vehicles.
* Detection of the vehicles, ground, and road with the lidar.
* Detection of the car going out track.

If you want to add new features to the detection system, you can consider [contributing to the project](https://github.com/thibo73800/metacar/blob/master/CONTRIBUTE.md) :)

<a id='interact-env'></a>
Interact with the environment
------------

### Action space

By default, the environment comes with a simple motion engine ([How to change the motion engine ?](#change-motion))  who let you control the car with the arrow. Then, the actions are either UP, LEFT, RIGHT, DOWN, WAIT. Once the environment is loaded, you can take a look at the action space.

```javascript
env.load(() => {
    console.log(env.actionSpace());
});
```

```
{
    type: "Discrete", // The number is discrete
    size: 1, // Only one number is expected
    range: [0, 1, 2, 3, 4] // The action can be either 0, 1, 2, 3 or 4
}
```

### Play & Stop

Let's suppose your agent is already trained to move forward whatever happens (Fortunately we are in a simulation). Then you might want to test it in real time to see the result.

The quickest way to do so is to just ask the environment to call a given function at each loop turn.

```javascript
env.load().then(() => {

    env.addEvent("play", () => {
        // Move forward
        const reward = env.step(0);
        // Log the reward
        console.log(reward);
    });
    
});
```

You should see a <b>play</b> button on the screen. On click, the car will move forward, and the reward should be positive as long as the car is on track, then negative when the car quit the road.<br>

To stop calling your function, you can add a stop button on the screen.

```javascript
env.load().then(() => {

    env.addEvent("play", () => {
        // Move forward
        const reward = env.step(0);
        // Log the reward
        console.log(reward);
    });

    env.addEvent("stop", () => {
        console.log("The stop button have been pressed.");
    });

});
```

### Train your agent

During the training, the environment is not rendering on the screen anymore. Once you're training is finish you have to notify the environment by calling env.render(true) to render the environment again. <br>

The state of the environment is the value of each lidar point. 

Here is an example of simple training loop. 

```javascript
env.load().then(() => {

    env.addEvent("train", () => {
        for (let s=0; s < 100; s++){
            // Get the current state of the lidar
            const state = env.getState();
            // Move forward
            const reward = env.step(0);
        }
        // Log the reward
        env.render(true);
    });

});
```

### Reset env

To reset the environment, you can either called

```javascript
    env.reset();
```

Or add a button to do it from the web page.

```javascript
env.load().then(() => {

    env.addEvent("custom", () => {
        env.reset();
    });
    
});
```

<a id='configure-env'></a>
Custom the environement
------------

<a id='change-motion'></a>
### Change the motion engine

There are two motion engine avaiable: BasicMotion and ControlMotion. 

#### BasicMotion

This is the default motion engine. Movement of the car are either up, down, left, right or wait. The car turn from a given angle for the left and right action.

You can change the parameters of the motion engine using the setMotion method.

```javascript
env.setAgentMotion(metacar.motion.BasicMotion, {rotationStep: 0.25});
// Load the environment after having changed the properties.
env.load();
```

#### ControlMotion

The motion control is based on two continuous value for the throttle and steering angle of the car. Then the action is an array of two floating value. (see [actionSpace](http://metacar-project.com/docs/classes/_metacar_.metacar.html#actionspace))

```javascript
env.setAgentMotion(metacar.motion.ControlMotion);
// Load the environment after having changed the properties.
env.load();
```

<b>!WARNING:</b> The method present in this section must be called <b>BEFORE</b> loading the environment. 

### Change the lidar propeties

There are four properties you can change. The number of points (pts) per line, the width and height of the area cover by the lidar and the position (pos) which respect to the car.

```javascript
env.setAgentLidar({pts: 3, width: 1.5, height: 1.5, pos: 1});
// Load the environment after having changed the properties.
env.load();
```

### Stop the others vehicles

You can choose to move or stop the other vehicles with env.carsMoving()

```javascript
env.carsMoving(false);
// Load the environement after changing the propeties.
env.load();
```

<a id='other-methods'></a>
Other methods
------------

### Load a file from your computer

This features can be useful to load the content of one file from your computer (the result of a trained model for 
instance).

```javascript
env.load().then(() => {

    env.load("load", (content) => {
        // Here the content of the loaded file.
        console.log(content);
    },{local: true});

});
```

### Save a file on your computer

As well, you might want to save the result of a trained model on your computer.

```javascript
env.save("content of my model", "model.metacar")
```

### Add a custom event

env.addEvent() comes with a set of predefined event ("train", "play", "stop", "reset_env", "load") but you can also create custom event with an associated button on the page. Bellow, an example of custom event saving a file onClick.

```javascript
env.load().then(() => {

    env.load("My custom event", () => {
        env.save("content of my model", "model.metacar");
    });

});
```

<a id='create-level'></a>
Edit a new level
------------

Only three lines are required to create the editor:

```
const level = metacar.level.level1;
var editor = new metacar.editor("editor", levelToLoad);
editor.load();
```
### Save the level

```
editor.load().then(() => {

    editor.addEvent("save", (content) => {
       // Save the content into the localstorage here or just
       // retrieve the downloaded json.
    }, {download: true, name: "mylevel.json"});

});
```



