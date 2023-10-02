const aiEfficiency = require("./ai.js");
const carTypes = { "Honda Civic": 0.06, "Toyota Corolla": 0.07 };

function calculateAverageSpeed(speedList) {
    const sumSpeed = speedList.reduce((sum, speed) => sum + speed, 0);
    return sumSpeed / speedList.length;
}

function calculateSpeedVariance(speedList) {
    const averageSpeed = calculateAverageSpeed(speedList);
    const squaredDifferences = speedList.map((speed) => Math.pow(speed - averageSpeed, 2));
    const variance = squaredDifferences.reduce((sum, squaredDiff) => sum + squaredDiff, 0) / speedList.length;
    return Math.sqrt(variance);
}

function calculateFuelUsed(carType, distance) {
    const fuelEconomy = carTypes[carType];
    return fuelEconomy * distance;
}

function calculateEcoScore(speedList) {
    const speedVariance = calculateSpeedVariance(speedList);
    let score = 0;
    if (speedVariance < 10) {
        score += 10;
    } else if (speedVariance < 20) {
        score += 5;
    } else {
        score -= 5;
    }
    return score;
}
// Returned: points, fuelUsed (L), CO2 released in kg
module.exports = function ecoDriving(carType, speedList, distance) {
    const ecoScore = calculateEcoScore(speedList) * aiEfficiency(carType, speedList, distance);
    const points = distance * ecoScore;
    const fuelUsed = calculateFuelUsed(carType, distance)
    return [Math.floor(points), fuelUsed, fuelUsed * 2.3, ecoScore];
};
