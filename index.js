const express = require('express');
const auth = require("./auth.js");
const ride = require("./ride.js");
const { readdirSync } = require('fs');

const app = express();
exports.app = app;

app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())

//Login and register
auth.managePost(app)

//Send the location back to map
//TODO:Make GPS Navigation
app.get('/pos', ride.updateLoc)

//Sends the stop data
app.get('/stopRide', ride.stopRide)

//Manages the report's page
app.get('/reports', ride.showRides)

//Manages the infoof page
app.get('/infoof', ride.infoOf)

//Run all js code in ./pages
let codeDir = readdirSync(__dirname + "/pages/")
for (let i = 0; i < codeDir.length; i++) {
  require("./pages/" + codeDir[i])
}

// Start the server on port 8080
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});