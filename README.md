# Documentation

### Table of contents:
1. [Getting Started](#getting-started)
2. [Your first environement](#first-env)
3. [Interact with the environement](#interact-env)
4. [Other events](#other-interact-env)
5. [Custom your environement](#configure-env)
5. [Create your own level](#create-level)

<a id='getting-started'></a>
Getting started
------------

### Installing Metacar 

You can used Metacar with a direct link in your HTML file or installing it from NPM. However, metacar is based on [Pixi.js](www.pixijs.com): 4.7.1, then you need to include pixi.js as a global dependencies in your HTML.

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

#### Script Tag and npm

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

Even if you can [create your own level](#create-level), Metacar comes up with a set of predefined level accessible under [metacar.level](#). Once your level is selected, you can use it to create a first environement. <br>

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
(NOTE: metacar.env can be instanciate with an object or a string for the level parameters: [doc API](#link))

<b>Wonderful! You just create your first metacar environement. </b> You can take sometime to play around with the key arrow to move the car. The current collision system support the detection of the following events:

* Collisions with other vehicles
* Detection of the vehicles, ground and road with the lidar
* Detection of the car going out track

If you want to add new features to the detection system you can considere [contributing to the project](#link) :)

<a id='interact-env'></a>
Interact with the environement
------------

### Action space

By default the environement comes with a simple motion engine ([How to change the motion engine ?](#link))  who let you control the car with the arrow. Then, the actions are either UP, LEFT, RIGHT, DOWN, WAIT. Once the environement is loaded you can take a look at the action space.

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

Let's suppose your agent is already trained to move forward whatever happens (Fortunately we are in a simulation). Then you want might want to test it in real time to see the result.

The quickest way to do so is to simply ask the environement to call a given function at each lopp run.

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

You should see a <b>play</b> button on the screen. On click, the car will move forward and the reward should be positive as long as the car is on track, then negative when the car quit the road.<br>

To stop calling your fonction you cann add a stop button on the screen.

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

During the training, the environement is not render on the screen anymore. Once you're training is finish you have to notify the environement by calling env.render(true) to render the environement again. <br>

The state of the environement is the the value of each lidar point. Of course, because the car still want to go forward it doesn't care about the value of the state :) <br>

Here is an example of basic training function. 

```
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

<a id='other-interact-env'></a>
Other events
------------

#### event1
Description

#### event2
Description

#### Custom event
Custom event description

<a id='configure-env'></a>
Custom your environement
------------

<a id='create-level'></a>
Custom your environement
------------


<a id='link'></a>
Link
------------


