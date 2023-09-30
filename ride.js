const auth = require("./auth.js")
const fs = require("fs")
let ride = {}
let idleTicks = {}
let speeds = {}
const ecoDriving = require("./ecodriving.js")

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
function calcDistance(lat1, lon1, lat2, lon2) {
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

ride.updateLoc = (req, res) => {

    //Verify user
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;

    //Retrieving the location
    let loc;
    let { newL, old } = req.query;
    loc = newL.split("_");
    let newLocation = { "lat": parseFloat(loc[0]), "long": parseFloat(loc[1]) }
    loc = old.split("_")
    let oldLocation = { "lat": parseFloat(loc[0]), "long": parseFloat(loc[1]) }

    //Check if idle
    speed = calcDistance(newLocation["lat"], newLocation["long"], oldLocation["lat"], oldLocation["long"]) * 3.6 / 5
    if (speed < 5) {
        if (!idleTicks[username]) idleTicks[username] = 0
        idleTicks[username]++
        if (idleTicks[username] >= 100) { res.send("STOP"); return; }
    } else
        if (idleTicks[username])
            idleTicks[username] = 0;

    //Save speed of ride
    if (!speeds[username]) speeds[username] = [speed]
    else speeds[username].push(speed);
    res.send("updated")
}

ride.stopRide = (req, res) => {

    // Verify user
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;
    // Getting average speed
    let sum = 0;
    for (let i = 0; i < speeds[username].length; i++) {
        sum += speeds[username][i];
    }
    let averageSpeed = sum / speeds[username].length;
    // Saving the data + giving points
    let rides = JSON.parse(fs.readFileSync(__dirname + "/db/rides.json"))
    if (!rides[username]) rides[username] = [];
    let distance = (sum * 5 / 3.6) /1000
    let userData = auth.getUserData(username)
    let [pointsGained, estimatedFuelUsed, emissions, ecoScore] = ecoDriving(
        userData.data.car_model,
        speeds[username],
        distance
    )
    rides[username].push({"ecoScore":ecoScore,"pointsGained":pointsGained,"averageSpeed":averageSpeed,"carbonEmissions":emissions,"totalDistance":distance,"fuelUsed":estimatedFuelUsed})
    fs.writeFileSync(__dirname + "/db/rides.json", JSON.stringify(rides))
    let db = JSON.parse(fs.readFileSync(__dirname + "/db/users.json"))
    db[username].data.points += pointsGained
    fs.writeFileSync(__dirname + "/db/users.json", JSON.stringify(db))
    res.send("saved");
}

module.exports = ride