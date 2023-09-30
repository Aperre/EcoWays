
const carTypes = { "Honda Civic": 0.06, "Toyota Corolla": 0.07 };

function calculateStandardDeviation(arr) {
    const mean = arr.reduce((sum, value) => sum + value, 0) / arr.length;
    const squaredDifferences = arr.map((value) => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / arr.length;
    return Math.sqrt(variance);
}

function calculateSpeedChanges(arr) {
    let speedChanges = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        if (Math.abs(arr[i] - arr[i + 1]) > 10) {
            speedChanges++;
        }
    }
    return speedChanges;
}

function calculateHighRpmTime(arr) {
    let highRpmTime = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 80) {
            highRpmTime++;
        }
    }
    return highRpmTime;
}

//This function helps determine how ecofriendly was the ride and determine how many points should the person be given
module.exports = function ecoDriving(carType, speedList, avgSpeed, distance) {

    const fuelEconomy = carTypes[carType];
    const time = speedList.length * 5;
    const fuelUsed = (avgSpeed * time) / fuelEconomy;
    const actualFuelConsumption = fuelUsed / distance;

    const ratedFuelEfficiency = carTypes[carType];
    const percentageDifference = ((actualFuelConsumption - ratedFuelEfficiency) / ratedFuelEfficiency) * 100;

    const stdSpeed = calculateStandardDeviation(speedList);
    const speedChanges = calculateSpeedChanges(speedList);
    const highRpmTime = calculateHighRpmTime(speedList);
    const percentageHighRpm = (highRpmTime / speedList.length) * 100;

    let score = 0;

    if (percentageDifference < 10) {
        score += 10;
    } else if (percentageDifference < 20) {
        score += 5;
    } else {
        score -= 5;
    }

    if (stdSpeed < 10) {
        score += 10;
    } else if (stdSpeed < 20) {
        score += 5;
    } else {
        score -= 5;
    }

    if (speedChanges < speedList.length / 10) {
        score += 10;
    } else if (speedChanges < speedList.length / 5) {
        score += 5;
    } else {
        score -= 5;
    }

    if (percentageHighRpm < 10) {
        score += 10;
    } else if (percentageHighRpm < 20) {
        score += 5;
    } else {
        score -= 5;
    }

    let points = 0;

    for (let i = 0; i < speedList.length; i++) {
        if (speedList[i] > 0) {
            points += (distance / speedList.length) * (score / 50);
        } else {
            points += 0;
        }
    }

    return [Math.floor(points), fuelUsed];
}