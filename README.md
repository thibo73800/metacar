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
* Detection of the road, ground and road with the lidar
* Detection of the car going out track

If you want to see add  features to the detection system you can considere [contributing to the project](#link) :)


<a id='interact-env'></a>
Interact with the environement
------------

#### Create your first event
#### Train your agent

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


