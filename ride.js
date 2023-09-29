const auth = require("./auth.js")
let ride = {}
let idleticks = {}
let speeds = {}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
function distance(lat1, lon1, lat2, lon2) {
    // Using the haversine formula
    // https://en.wikipedia.org/wiki/Haversine_formula
    // Assuming the radius of the earth is 6371 km
    let R = 6371e3; // meters
    let phi1 = toRadians(lat1);
    let phi2 = toRadians(lat2);
    let deltaPhi = toRadians(lat2 - lat1);
    let deltaLambda = toRadians(lon2 - lon1);

    let a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = R * c;
    return d;
}


ride.startRide = (req, res) => {
    let token = auth.token.get(req);
    if (!token) return;
    if (!auth.token.validate(token)) return;

}

ride.updateLoc = (req, res) => {
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;
    let { neww, old } = req.query;
    let { newlat, newlong } = neww.split("_");
    let { oldlat, oldlong } = old.split("_");
    speed = distance(newlat, newlong, oldlat, oldlong) * 3.6 / 5
    if (speed < 5)
        if (idleticks[username]) { idleticks[username]++ }
        else if (idleticks[username] <= 360) { idleticks[username] = 1 }
        else { res.send("STOP") }
    else
        if (idleticks[username])
            idleticks[username] = 0;
    if (!speeds[username]) speeds[username] = [speed]
    else speeds[username].push(speed);
    res.send("updated")
}

ride.stopRide = (req, res) => {
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;
    let sum = 0;
    for (let i = 0; i < speeds[username].length; i++) {
        sum += speeds[username][i];
    }
    let averagespeed = sum / speeds[username].length;
    let rides = JSON.parse(fs.readFileSync(__dirname + "/db/rides.json"))
    if (!rides[username]) rides[username] = [];
    let distancee = sum * 5 / 3.6
    let pointsgained = 1 / averagespeed * distancee
    rides[username].append({ "averageSpeed": averagespeed, "distance": distancee, "points": pointsgained })
    fs.writeFileSync(__dirname + "/db/rides.json", JSON.stringify(rides))
    let db = JSON.parse(fs.readFileSync(__dirname + "/db/users.json"))
    db[username].data.points+=pointsgained
    fs.writeFileSync(__dirname + "/db/users.json", JSON.stringify(db))
}

module.exports = ride