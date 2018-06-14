// Get the url of the desired level
let levelUrl = metacar.level.fullCity;
// Create the editor (canvasID, levelUrl)
var editor = new metacar.editor("editor", levelUrl);

editor.load().then(() => {
    editor.addEvent("save", (content) => {
        console.log(content);
        // Put the object into storage
        localStorage.setItem('mylevel.json', JSON.stringify(content));

    }, {download: false, name: "mylevel.json"});
});