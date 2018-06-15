/**
 * Display a list of state with the associated score
 */
function displayQTable(id, states, agent, labels){
    var scores = [];

    var container = document.getElementById(id);
    container.innerHTML = "";

    for (let s=0; s < states.length; s++){
        scores.push(agent.Q[states[s].toString()]);
        let nContainer = document.getElementById(id + "_" + s);
        if (!nContainer){
            nContainer = document.createElement("div");
            nContainer.id = id + "_" + s;
            container.appendChild(nContainer);
        }
    }

    for (let s=0; s < states.length; s++){
        let _id = id + "_" + s;
        displayState(_id, states[s], 100, 100);
        displayScores(_id, scores[s], undefined, ["Top", "Left", "Right"]);
    }

}

/**
 * @id: div container to use
 * @score
 */
function displayScores(id, score, reward, labels){
    var container = document.getElementById(id);
    container.style.position = "relative";

    var textContainer = document.getElementById(id + "_text");
    if (!textContainer){
        textContainer = document.createElement("div");
        textContainer.style.position = "absolute";
        textContainer.style.top = "0px";
        textContainer.id = id + "_text"
        textContainer.style.right = "0px";
        container.appendChild(textContainer);
    }

    console.log(score);
    var text = "";
    for (let c = 0; c < score.length; c++){
        text += labels[c] + ": <b>" + Number((parseFloat(score[c])).toFixed(2)) + "</b><br>";
    }

    if (reward){
        if (reward < 0)
            text += "<br><p style='color: #ee4c32'>Reward: <b>" +Number((parseFloat(reward)).toFixed(2)) + "</b></p>"
        else
            text += "<br><p style='color: #80bf3e'>Reward: <b>" +Number((parseFloat(reward)).toFixed(2)) + "</b></p>"
    }

    textContainer.innerHTML = text;
    textContainer.style.right = - textContainer.offsetWidth-10 + "px";
    container.style.marginRight = textContainer.offsetWidth+30 + "px";
}


/**
 * @id: div container to use
 * @state of the map
 * @width and @height desired width and height
 */
function displayState(id, state, width, height){
    var xSize = width / state[0].length;
    var ySize = height / state.length;
    var exist = false;
    var container = document.getElementById(id);
    
    if (container.innerHTML.length != 0){
        exist = true;
    }

    container.style.display = "inline-block";
    container.style.width = width+"px";
    container.style.height = height+"px";
    container.style.background = "red";

    let yPos = 0;
    for (let y = 0; y < state.length; y++){
        let xPos = 0;
        for (let x = 0; x < state[0].length; x++){
            let nDiv;
            if (!exist){
                nDiv = document.createElement('div');
                nDiv.id = id + "_" + y + "_" + x;
                nDiv.style.display = "block";
                nDiv.style.width = xSize+"px";
                nDiv.style.height = ySize+"px";
                nDiv.style.float = "left";
                container.appendChild(nDiv);
            }
            else{
                nDiv = document.getElementById(id + "_" + y + "_" + x);
            }
            if (state[y][x] == -1){ // road
                nDiv.style.background = "#484848";
            }
            else if (state[y][x] == 0){ // Default
                nDiv.style.background = "#80bf3e";
            }
            else{
                nDiv.style.background = "#fdf9f5";
            }
            xPos += xSize;
        }
        yPos += ySize;
    }

}