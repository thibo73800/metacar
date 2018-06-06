'use strict';

var fs = require('fs');
// [START app]
const express = require('express');
var path = require("path");


function fromDir(startPath,filter){

  //console.log('Starting from dir '+startPath+'/');

  if (!fs.existsSync(startPath)){
    console.log("no dir ",startPath);
    return [];
  }

  var files_list = [];
  var files=fs.readdirSync(startPath);
  for(var i=0;i<files.length;i++){
      var filename=path.join(startPath,files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()){
          fromDir(filename,filter); //recurse
      }
      else if (filename.indexOf(filter)>=0) {
          files_list.push(filename);
      };
  };
  return files_list;
}

const app = express();

app.use("/dist", express.static(path.join(__dirname, "dist/")));
app.use("/public",   express.static(path.join(__dirname, "webapp/public/")));


function get_path(file){
  return path.join(path.join(__dirname, "webapp/"), file);
}

app.get('/', (req, res) => {
  res.sendFile(get_path("index.html"));
});

const files = fromDir(path.join(__dirname, "webapp/"),'.html');
files.forEach(file => {
  let route = file.split("/");
  route = route[route.length - 1];

  console.log("Open route:", route, file);
  app.get('/'+route, (req, res) => {
    res.sendFile(file);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
