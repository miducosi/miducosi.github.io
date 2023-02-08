export class StationTime {
    constructor(obj) {
        this.currentLocation = obj.currentLocation;
        this.destinationName = obj.destinationName;
        this.direction = obj.direction;
        this.expectedArrival = obj.expectedArrival;
        this.lineId = obj.lineId;
        this.lineName = obj.lineName;
        this.platformName = obj.platformName;
        this.stationName = obj.stationName;
        this.timeToLive = obj.timeToLive;
        this.timeToStation = obj.timeToStation;
    }
}
