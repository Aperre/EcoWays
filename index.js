const express = require('express');
const auth = require("./auth.js");
const ride = require("./ride.js")

const app = express();
exports.app = app;

app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())

//Login and register
auth.managepost(app)

//Send the location back to map
//TODO:Make GPS Navigation
app.get('/pos', ride.updateLoc)

// Start the server on port 8080
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});