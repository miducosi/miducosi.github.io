export default () => {
    class StationTime {
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
    /* eslint-disable-next-line no-restricted-globals */
    self.onmessage = (message) => {
        const req = new XMLHttpRequest();
        if (message.data.lineId !== null && message.data.lineId !== undefined) {
            let line = message.data.lineId
            req.open("GET", `https://api.tfl.gov.uk/Line/${line}/Arrivals`);
            req.responseType = 'json';
            req.onload = () => {
                if (req.readyState === req.DONE && req.status === 200) {
                    var stations = []
                    var stationsMap = new Map()
                    req.response.forEach(element => {
                        stations.push(new StationTime(element));
                        let lastAdded = stations[stations.length - 1];
                        if (stationsMap.has(lastAdded.stationName)) {
                            stationsMap.set(lastAdded.stationName, [...stationsMap.get(lastAdded.stationName), lastAdded]);
                        } else {
                            stationsMap.set(lastAdded.stationName, [lastAdded]);
                        }
                    });
                    console.log(stationsMap)
                    postMessage(stationsMap);
                    //console.log(stations);
                    //console.log(stationsMap);

                } else if (req.readyState === req.DONE && req.status !== 200) {
                    postMessage("error");
                }
            }
            req.send();
        } else {
            postMessage("error");
        }

    }
}



/*function messageHandler(e) {
    const req = new XMLHttpRequest();
    if (e.data.lineId !== null && e.data.lineId !== undefined) {
        let line = e.data.lineId
        req.open("GET", `https://api.tfl.gov.uk/Line/${line}/Arrivals`);
        req.responseType = 'json';
        req.onload = () => {
            if (req.readyState === req.DONE && req.status === 200) {
                console.log(req.response);
                var stations = []
                var stationsMap = new Map()
                req.response.forEach(element => {
                    stations.push(new StationTime(element));
                    let lastAdded = stations[stations.length - 1];
                    if (stationsMap.has(lastAdded.stationName)) {
                        stationsMap.set(lastAdded.stationName, [...stationsMap.get(lastAdded.stationName), lastAdded]);
                    } else {
                        stationsMap.set(lastAdded.stationName, [lastAdded]);
                    }
                });
                postMessage(stationsMap);
                //console.log(stations);
                //console.log(stationsMap);

            } else if (req.readyState === req.DONE && req.status !== 200) {
                postMessage("error");
            }
        }
        req.send();
    } else {
        postMessage("error");
    }
}

addEventListener("message", messageHandler, true);*/