const express = require('express');
const auth = require("./auth.js");
const fillinfo = require("./infoadder.js");
const fs = require('fs');

const app = express();

app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())

//send index.html for root
app.get('/', (req, res) => {
  let static = fs.readFileSync(__dirname + `/html/index.html`, { encoding: "utf-8" })
  res.send(static.replace("</body", `<script>if (document.cookie) {
    let username = atob(document.cookie.split("=")[1].split(".")[0])
    let loginbutton = document.getElementById("user")
    loginbutton.href = "/authenticated"
    loginbutton.innerHTML = username+" 😶"
    }</script>
    </body>`));
});

//Login and register
auth.managepost(app)

//Send the location back to map
//TODO:Make GPS Navigation
app.get('/pos/:lat/:lng', (req, res) => {
  const { lat, lng } = req.params;
  res.redirect(`/map?lat=${lat}&lng=${lng}`);
})


//Load all pages and exception for login features
let needLogin = [""]
app.get('/:page', (req, res) => {
  let SessionInfo = auth.connected(req, res)

  if (!fs.existsSync(__dirname + `/html/${req.params.page}.html`)) res.status(404).send("<h1>404</h1> Not found");

  //Adding trailing data for easy username and profile
  let static = fs.readFileSync(__dirname + `/html/${req.params.page}.html`, { encoding: "utf-8" })

  //If not logged in then send default.
  if (!SessionInfo) { res.send(static); return; }

  let userData = auth.getUserData(SessionInfo.username)
  res.send(fillinfo(static, userData));

})

//sending resources
app.get('/:type/:file', (req, res) => {
  if (req.params.type == "images") {
    res.sendFile(__dirname + `/images/${req.params.file}`);
    return;
  }
  if (req.params.type == "stylesheet") {
    res.sendFile(__dirname + `/stylesheet/${req.params.file}`);
    return;
  }
  if (req.params.type == "javascript") {
    res.sendFile(__dirname + `/javascript/${req.params.file}`);
    return;
  }
  res.status(404).send("<h1>404</h1> Not found")
});


// Start the server on port 3000
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});