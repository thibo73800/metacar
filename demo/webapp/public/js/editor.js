
// Get the url of the desired level
let levelToLoad = metacar.level.level0;

// If a level is avaiable in the storage, load this level instead.
var levelObject = localStorage.getItem('mylevel.json');
if (levelObject){
    levelToLoad = JSON.parse(levelObject);
}

// Create the editor (canvasID, levelUrl)
var editor = new metacar.editor("editor", levelToLoad);
editor.load().then(() => {
    editor.addEvent("save", (content) => {
        // Put the object into storage
        localStorage.setItem('mylevel.json', JSON.stringify(content));
        window.open("/test_editor.html");

    }, {download: true, name: "level.json"});
});