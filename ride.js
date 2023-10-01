const auth = require("./auth.js")
const fs = require("fs")
let ride = {}
let idleTicks = {}
let speeds = {}
const ecoDriving = require("./ecoDriving.js")
const infoAdder = require("./infoadder.js")
let reportsPage = fs.readFileSync(__dirname + "/html/reports.html", { encoding: "utf8" })
let infoOfPage = fs.readFileSync(__dirname + "/html/infoof.html", { encoding: "utf8" })

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function replaceBulkAll(str, arr) {
    for (let i = 0; i < arr.length; i++)
        str = str.replace(new RegExp(escapeRegExp(arr[i][0]), 'g'), arr[i][1]);
    return str;
}

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

//https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
function fromNow(date, nowDate = Date.now(), rft = new Intl.RelativeTimeFormat('en', { numeric: "auto" })) {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const YEAR = 365 * DAY;
    const MONTH = YEAR / 12;
    const intervals = [
        { ge: YEAR, divisor: YEAR, unit: 'year' },
        { ge: MONTH, divisor: MONTH, unit: 'month' },
        { ge: WEEK, divisor: WEEK, unit: 'week' },
        { ge: DAY, divisor: DAY, unit: 'day' },
        { ge: HOUR, divisor: HOUR, unit: 'hour' },
        { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
        { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
        { ge: 0, divisor: 1, text: 'just now' },
    ];
    const now = typeof nowDate === 'object' ? nowDate.getTime() : new Date(nowDate).getTime();
    const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
    const diffAbs = Math.abs(diff);
    for (const interval of intervals) {
        if (diffAbs >= interval.ge) {
            const x = Math.round(Math.abs(diff) / interval.divisor);
            const isFuture = diff < 0;
            return interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
        }
    }
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
    res.send(speed.toString())
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
    let distance = (sum * 5 / 3.6) / 1000
    let userData = auth.getUserData(username)
    let [pointsGained, estimatedFuelUsed, emissions, ecoScore] = ecoDriving(
        userData.data.car_model,
        speeds[username],
        distance
    )
    let rideData = {
        "ecoScore": ecoScore,
        "pointsGained": pointsGained,
        "averageSpeed": averageSpeed.toFixed(1),
        "carbonEmissions": emissions.toFixed(2),
        "totalDistance": distance.toFixed(3),
        "fuelUsed": estimatedFuelUsed.toFixed(1),
        "date": new Date()}
    rides[username].push(rideData)
    fs.writeFileSync(__dirname + "/db/rides.json", JSON.stringify(rides))
    let db = JSON.parse(fs.readFileSync(__dirname + "/db/users.json"))
    if (db[username].data.points <= pointsGained) { db[username].data.points = 0 }
    else db[username].data.points += pointsGained;
    fs.writeFileSync(__dirname + "/db/users.json", JSON.stringify(db))
    idleTicks[username] = 0;
    speeds[username] = []
    res.send(rideData);
    // Gets Date:
    
   
}

ride.showRides = (req, res) => {
    // Verify user
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;

    let rides = JSON.parse(fs.readFileSync(__dirname + "/db/rides.json"))
    if (!rides[username]) rides[username] = [];
    
    
    let ridesHTML = "";
    let userData = auth.getUserData(username);
    let CARMODEL = userData.data.car_model;

    for (let i = rides[username].length - 1; i >= 0; i--) {
        let POINTS = rides[username][i].pointsGained
        let driveDate = fromNow(new Date(rides[username][i].date))
        ridesHTML += `
        <a href="./infoof?id=${i}" class="box">
            <div class="info">
                <div class="textinfo">
                    <p></p>
                    <p>${CARMODEL}</p>
                    <p style="color:rgb(0, 210, 0)">Points: ${POINTS}</p>
                    <p>${driveDate}</p>
                </div>
                <img src="/images/${CARMODEL}.png">
            </div>
            <div class="status">
                <div class="statusinfo">
                    <p> 🔴Completed </p>
                </div>
            </div>
        </a>`
    }
    let page = replaceAll(infoAdder(reportsPage, userData), "${RIDES}", ridesHTML)
    res.send(page)
}

ride.infoOf = (req, res) => {
    // Verify user
    let token = auth.token.get(req);
    if (!token) return;
    let username = auth.token.validate(token)
    if (!username) return;
    let rides = JSON.parse(fs.readFileSync(__dirname + "/db/rides.json"))
    let { id } = req.query;
    //Verifying if the ride exists
    if (!id || !rides[username] || rides[username].length <= id) { res.send("Invalid Ride ID"); return }

    //Load page with ride data
    let userData = auth.getUserData(username)
    let rideData = rides[username][id]
    let page = infoAdder(infoOfPage, userData)
    page = replaceBulkAll(page, [
        ["${ecoScore}", rideData.ecoScore],
        ["${points}", rideData.pointsGained],
        ["${avgSpeed}", rideData.averageSpeed],
        ["${carbonEmission}", rideData.carbonEmissions],
        ["${distance}", rideData.totalDistance],
        ["${GasUsed}", rideData.fuelUsed]
    ])
    res.send(page)
}

module.exports = ride