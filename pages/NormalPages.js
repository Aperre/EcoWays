const auth = require("../auth.js");
const fillinfo = require("../infoadder.js");
const fs = require('fs');
const { app } = require('../index.js');
//Making it compatible with windows then splitting it
let dir = __dirname.split("\\").join("/").split("/")
dir.pop()
__dirname = dir.join("/")

console.log(__dirname)
app.get('/:page', (req, res) => {
  let SessionInfo = auth.connected(req, res);

  if (!fs.existsSync(__dirname + `/html/${req.params.page}.html`)) res.status(404).send("<h1>404</h1> Not found");

  //Adding trailing data for easy username and profile
  let static = fs.readFileSync(__dirname + `/html/${req.params.page}.html`, { encoding: "utf-8" });

  //If not logged in then send default.
  if (!SessionInfo) { res.send(static); return; }

  let userData = auth.getUserData(SessionInfo.username);
  res.send(fillinfo(static, userData));

});
