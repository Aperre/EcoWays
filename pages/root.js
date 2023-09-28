const fs = require('fs');
const { app } = require('../index.js');
//Making it compatible with windows then splitting it
let dir = __dirname.split("\\").join("/").split("/")
dir.pop()
__dirname = dir.join("/")


//send index.html for root
app.get('/', (req, res) => {
console.log(__dirname + `/html/index.html`)
  let static = fs.readFileSync(__dirname + `/html/index.html`, { encoding: "utf-8" });
  res.send(static.replace("</body>", `<script>if (document.cookie) {
    let username = atob(document.cookie.split("=")[1].split(".")[0])
    let loginbutton = document.getElementById("user")
    loginbutton.href = "/authenticated"
    loginbutton.innerHTML = username+" 😶"
    }</script>
    </body>`));
});
