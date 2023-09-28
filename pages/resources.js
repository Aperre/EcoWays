const { app } = require('../index.js');
//Making it compatible with windows then splitting it
let dir = __dirname.split("\\").join("/").split("/")
dir.pop()
__dirname = dir.join("/")

//Load all pages and exception for login features
let needLogin = [""]
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
  res.status(404).send("<h1>404</h1> Not found");
});
