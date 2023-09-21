const fs = require("fs");
const bcrypt = require("bcryptjs");
let auth = {}

function tobase64(str) {
    return Buffer.from(str).toString("base64");
}

auth.token = {}

auth.token.create = (user)=>{
    let OAuth = JSON.parse(fs.readFileSync(__dirname + "/db/OAuth.json"))
    let key = `${tobase64(user)}.${tobase64(Math.floor(Math.random()*64000000).toString())}.${tobase64(Date.now().toString())}`
    OAuth[key]=user;
    fs.writeFileSync(__dirname + "/db/OAuth.json",JSON.stringify(OAuth))
    return key;
}

auth.token.get = (req)=>{
  if (!req.headers.cookie) return false;
  return decodeURIComponent(req.headers.cookie.split("=")[1])
}

auth.token.validate = (token)=>{
    let OAuth = JSON.parse(fs.readFileSync(__dirname + "/db/OAuth.json"))
    return OAuth[token];
}

auth.token.delete = (token)=>{
  let OAuth = JSON.parse(fs.readFileSync(__dirname + "/db/OAuth.json"))
  delete OAuth[token];
  fs.writeFileSync(__dirname + "/db/OAuth.json",JSON.stringify(OAuth))
}

auth.connected = (req, res) => {
  if (!req.headers.cookie) return false;
  let SessionToken = decodeURIComponent(req.headers.cookie.split("=")[1])
  if (!auth.token.validate(SessionToken)) {console.log("checking"); res.clearCookie('SessionToken'); return false};
  let SessionInfo = SessionToken.split(".")
  SessionInfo = {
    "username": Buffer.from(SessionInfo[0], "base64").toString("ascii"),
    "creationTime": parseInt(Buffer.from(SessionInfo[2], "base64").toString("ascii"))
  }
  if (Date.now() - SessionInfo["creationTime"] > 2600000000) {
    console.log("Too old")
    res.clearCookie('SessionToken'); auth.token.delete(SessionToken); 
    return false
  };
  return SessionInfo;
}

auth.getUserData = (user) => {
  let db = JSON.parse(fs.readFileSync(__dirname + "/db/users.json"))
  if(db[user]) return {"username":user,"phone":db[user]["phone"],"data":db[user]["data"]};
  return undefined;
}

auth.managepost = (app)=>app.use('/auth/:authtype',(req,res)=>{
    let db = JSON.parse(fs.readFileSync(__dirname + "/db/users.json"))
    function finduserinfo(value){
      if (db[value]) return true;
      return false;
    }
  
    if (req.params.authtype=="register"){
      let {username, phone, car_model, password} = req.body
      if (finduserinfo(username)) {res.redirect('/registration?error=Username%20Already%20Exists'); return;}
      let salt = bcrypt.genSaltSync()
      password = bcrypt.hashSync(password,salt)
      db[username]={"username":username,"password":password,"phone":phone,"data":{"car_model":car_model,"points":0}}
      fs.writeFileSync(__dirname + "/db/users.json",JSON.stringify(db))
      res.cookie("SessionToken",auth.token.create(username));
      res.redirect("/authenticated")
    } 
  
    else if (req.params.authtype=="login") {
      let {username, password} = req.body;
      if (!finduserinfo(username)) {res.redirect("/login?error=Incorrect%20Username%20Or%20Password"); return;} //return if its the wrong username 
      let salt = bcrypt.getSalt(db[username]["password"]);
      if (bcrypt.hashSync(password,salt)!=db[username]["password"]) {res.redirect("/login?error=Incorrect%20Username%20Or%20Password"); return;}; //return if its the wrong password
      res.cookie("SessionToken",auth.token.create(username));
      res.redirect("/authenticated")
    }
    
})

module.exports = auth