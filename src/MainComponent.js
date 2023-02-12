import React, { useState, useEffect } from 'react';
import { WorkerHandlerData } from './WorkerHandlerData';
import './MainComponent.css';
import TimetableModal from './modal/TimetableModal';
import TubeWorker from './workers/TubeWorker';
import WorkerBuilder from './workers/WorkerBuilder';

const LOCAL_STORAGE_LINE_TUBE_STATIONS_KEY = 'londonTubeApp.stations'

export default function TubeLines() {
    const [showModal, setShowModal] = useState(false);
    const [childWindows, setChildWindows] = useState([]);
    const renderBackdrop = (props) => <div className="backdrop" {...props} />;
    var handleClose = () => setShowModal(false);
    var handleSuccess = () => {
        console.log("success");
    };

    const [platformTimetable, setPlatformTimetable] = useState([])
    const [stationsByLine, setStationsByLine] = useState(() => {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_LINE_TUBE_STATIONS_KEY)) || [];
    });

    const [currentLine, setCurrentLine] = useState(null)
    const [currentStations, setCurrentStations] = useState([])
    const [selectedStation, setSelectedStation] = useState(null)
    const [currentPlatforms, setCurrentPlatforms] = useState([])
    const [showBottomButtons, setBottomButtons] = useState(false)
    const [currentPlatform, setCurrentPlatform] = useState(null)
    const [mostRecentFetchFromAPI, setMostRecentFetchFromAPI] = useState(null)


    useEffect(() => {
        const storedStationsByLineMap = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LINE_TUBE_STATIONS_KEY));
        if (storedStationsByLineMap) setStationsByLine(storedStationsByLineMap)
    }, [])

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_LINE_TUBE_STATIONS_KEY, JSON.stringify(stationsByLine))
    }, [stationsByLine])

    useEffect(() => {
        const onMessage = (evt) => {
            if (evt.origin === "http://localhost:3001") {
                startWorker(evt.source, evt.data);
            }
        }
        window.addEventListener("message", onMessage, true);
        return () => {
            window.removeEventListener("message", onMessage, true)
        }
    }, [])

    var childWindowUrl = "http://localhost:3001/";
    var windowTopCoord = 0;

    function updateLocalStorage(lineArrivalsMappedByStation, line) {
        if (stationsByLine !== undefined && stationsByLine.length !== 0) {
            let foundedLine = stationsByLine.find(entry => entry.lineId === line)
            if (foundedLine !== undefined && foundedLine !== null) return
        }
        var stationsList = []
        setCurrentLine(line)
        setStationsByLine(prevList => {
            stationsList = Array.from(lineArrivalsMappedByStation.keys());
            var stationsWithPlatformList = []

            stationsList.forEach(stationName => {
                var stationPlatformsMap = new Map()

                lineArrivalsMappedByStation.get(stationName).forEach(stationTime => {
                    if (stationPlatformsMap.has(stationTime.platformName)) {
                        stationPlatformsMap.set(stationTime.platformName, [...stationPlatformsMap.get(stationTime.platformName), stationTime]);
                    } else {
                        stationPlatformsMap.set(stationTime.platformName, [stationTime]);
                    }
                })
                stationsWithPlatformList.push({ "stationName": stationName, "platforms": Array.from(stationPlatformsMap.keys()) })
            })

            setCurrentStations(stationsList)
            return [...prevList, { "lineId": line, "stations": stationsWithPlatformList }]
        })
    }

    function clearStates() {
        setCurrentStations([])
        setSelectedStation(null)
        setCurrentPlatforms([])
        setCurrentPlatform(null)
        setBottomButtons(false)
    }
    function getArrivals(e) {
        let line = e.target.value;
        if (line === currentLine) return
        var loadFromServer = true;
        var foundedLine = null;
        clearStates()
        if (stationsByLine !== undefined && stationsByLine.length !== 0) {
            foundedLine = stationsByLine.find(entry => entry.lineId === line)
            if (foundedLine !== undefined && foundedLine !== null) loadFromServer = false
        }
        if (!loadFromServer) {
            setCurrentLine(line)
            var simpleStationList = []
            foundedLine.stations.forEach(s => {
                simpleStationList.push(s.stationName)
            })
            setCurrentStations(simpleStationList)
        } else {
            //start worker to fetch fresh data from api 
            startWorkerToUpdateMainPage(line, null)
        }
    }

    function getStationPlatforms(e) {
        var selectedStation = e.target.value;
        console.log(selectedStation)
        if (selectedStation === "-1") return

        setSelectedStation(selectedStation)
        let searchObject = stationsByLine.find(entry => entry.lineId === currentLine)
        let platformsList = searchObject.stations.find(entry => entry.stationName === selectedStation)
        setCurrentPlatforms(platformsList.platforms)

    }
    function openTimetableModal() {
        setShowModal(true);
    }

    function doAfterPlatformSelection(e) {
        var selectedPlatform = e.target.value;
        console.log(selectedPlatform)
        if (selectedPlatform === "-1") return
        setCurrentPlatform(selectedPlatform)
        var updateFromServer = true
        if (mostRecentFetchFromAPI !== null) {
            var arrivalsOnSpecificPlatform = new Map()
            var searchResult = mostRecentFetchFromAPI.get(selectedStation)
            if (searchResult !== undefined && searchResult !== null) {
                mostRecentFetchFromAPI.get(selectedStation).forEach(stationTime => {
                    if (arrivalsOnSpecificPlatform.has(stationTime.platformName)) {
                        arrivalsOnSpecificPlatform.set(stationTime.platformName, [...arrivalsOnSpecificPlatform.get(stationTime.platformName), stationTime]);
                    } else {
                        arrivalsOnSpecificPlatform.set(stationTime.platformName, [stationTime]);
                    }
                })
                searchResult = arrivalsOnSpecificPlatform.get(selectedPlatform)
                if (searchResult !== null && searchResult !== undefined) {
                    setPlatformTimetable(searchResult)
                    setBottomButtons(true)
                    updateFromServer = false
                }
            }

        }
        //only updates if current line data doesn't match 
        if (updateFromServer) {
            startWorkerToUpdateMainPage(null, selectedPlatform)
        }
    }

    function newWindow() {
        var topEdge = window.screenY;
        var rhsEdge = window.screenX + window.outerWidth;

        var win = window.open(childWindowUrl, "", "width=300" +
            ", height=600" +
            ", top=" + (topEdge + windowTopCoord + 2) +
            ", left=" + (rhsEdge + 2));

        windowTopCoord += 250;
        setChildWindows(prevWindows => {
            return [...prevWindows, win]
        })
    }
    function updateLastWindow() {
        if (childWindows.length !== 0) {
            childWindows[childWindows.length - 1].postMessage(platformTimetable, "*");
        }
    }
    function startWorker(source, data) {
        let workerHandlerData = new WorkerHandlerData(true, data.lineId, data.stationName, data.platformName)
        var tubeWorker = new WorkerBuilder(TubeWorker)
        tubeWorker.addEventListener("message", (event) => onMessageFromWorker(event, workerHandlerData, source), true);
        tubeWorker.addEventListener("error", onErrorFromWorker, true);
        if (data.stationName != null && data.platformName != null) {
            tubeWorker.postMessage(data)
        }
    }
    function startWorkerToUpdateMainPage(line, platform) {
        let workerHandlerData = (platform !== null) ? new WorkerHandlerData(false, currentLine, selectedStation, platform)
            : new WorkerHandlerData(false, line, null, null);
        var tubeWorker = new WorkerBuilder(TubeWorker)
        tubeWorker.addEventListener("message", (event) => onMessageFromSpecialWorker(event, workerHandlerData), true);
        tubeWorker.addEventListener("error", onErrorFromWorker, true);
        tubeWorker.postMessage({ "lineId": (platform !== null) ? currentLine : line })
    }
    function onMessageFromWorker(e, workerHandlerData, source) {
        var workerResponseStationMap = e.data
        var arrivalsOnSpecificPlatform = new Map()
        e.srcElement.terminate()

        workerResponseStationMap.get(workerHandlerData.stationName).forEach(stationTime => {
            if (arrivalsOnSpecificPlatform.has(stationTime.platformName)) {
                arrivalsOnSpecificPlatform.set(stationTime.platformName, [...arrivalsOnSpecificPlatform.get(stationTime.platformName), stationTime]);
            } else {
                arrivalsOnSpecificPlatform.set(stationTime.platformName, [stationTime]);
            }
        })
        source.postMessage(arrivalsOnSpecificPlatform.get(workerHandlerData.platformName), "*")
    }

    function onMessageFromSpecialWorker(e, workerHandlerData) {
        var workerResponseMappedByStation = e.data
        var arrivalsOnSpecificPlatform = new Map()
        e.srcElement.terminate()

        setMostRecentFetchFromAPI(workerResponseMappedByStation)

        if (workerHandlerData.stationName !== null) {
            workerResponseMappedByStation.get(workerHandlerData.stationName).forEach(stationTime => {
                if (arrivalsOnSpecificPlatform.has(stationTime.platformName)) {
                    arrivalsOnSpecificPlatform.set(stationTime.platformName, [...arrivalsOnSpecificPlatform.get(stationTime.platformName), stationTime]);
                } else {
                    arrivalsOnSpecificPlatform.set(stationTime.platformName, [stationTime]);
                }
            })

            setPlatformTimetable(arrivalsOnSpecificPlatform.get(workerHandlerData.platformName))
            setBottomButtons(true)
        } else {
            updateLocalStorage(workerResponseMappedByStation, workerHandlerData.lineId)
        }

    }

    function onErrorFromWorker(e) {
        alert("Error from web worker :(")
    }

    function broadcast() {
        for (var i = 0; i < childWindows.length; i++) {
            childWindows[i].postMessage(platformTimetable, "*");
        }
    }


    return (
        <div className="container" role={"main"}>
            <h1 id='header'>London Undergroung Scheduled Arrivals</h1>
            <h2>Select a Tube Line</h2>
            <div className="buttonsContainer">
                <button className="darkBlueBtn" value={"piccadilly"} onClick={getArrivals}>Piccadilly</button>
                <button className="redBtn" value={"central"} onClick={getArrivals}>Central</button>
                <button className="greyBtn" value={"jubilee"} onClick={getArrivals}>Jubilee</button>
                <button className="blueBtn" value={"victoria"} onClick={getArrivals}>Victoria</button>
                <button className="purpleBtn" value={"elizabeth"} onClick={getArrivals}>Elizabeth</button>
                <button className="blackBtn" value={"northern"} onClick={getArrivals}>Northern</button>
                <button className="greenBtn" value={"district"} onClick={getArrivals}>District</button>
                <button className="yellowBtn" value={"circle"} onClick={getArrivals}>Circle</button>
            </div>
            <div id='stations-select-container' className='stations-select-container'>
                <label for="stations-select" className='stations-select-label' visibility={(currentStations.length !== 0).toString()}>Select a  <span className='bold'>{currentLine} line</span> station:</label>
                <select id='stations-select' className='stations-select' visibility={(currentStations.length !== 0).toString()} onChange={getStationPlatforms}>
                    <option value={-1}>Select a station</option>
                    {currentStations.map((station) => {
                        return (<option key={station} value={station}>{station}</option>)
                    })}
                </select>
            </div>
            <div id='platforms-select-container' className='platforms-select-container'>
                <label for="platforms-select" className='platforms-select-label' visibility={(currentPlatforms.length !== 0).toString()}>Select a <span className='bold'>{selectedStation}</span> platform:</label>
                <select id="platforms-select" className='platforms-select' visibility={(currentPlatforms.length !== 0).toString()} onChange={doAfterPlatformSelection} >
                    <option value={-1}>Select a platform</option>
                    {currentPlatforms.map((platform) => {
                        return (<option key={platform} value={platform}>{platform}</option>)
                    })}
                </select>
            </div>
            <div className='bottomButtonsContainer'>
                <button aria-haspopup='dialog' className='showTimetableBtn' onClick={openTimetableModal} visibility={showBottomButtons.toString()}>Show Arrivals</button>
                <button aria-label="opens a new browser window if you're not in full screen otherwise a new tab on current window" className='showTimetableBtn' onClick={newWindow} visibility={showBottomButtons.toString()}>New timetable window</button>
                <button className='showTimetableBtn' onClick={updateLastWindow} visibility={showBottomButtons.toString()}>Update last opened window</button>
                <button className='showTimetableBtn' onClick={broadcast} visibility={showBottomButtons.toString()}>Broadcast to opened windows</button>
            </div>
            <TimetableModal showModal={showModal} handleClose={handleClose} handleSuccess={handleSuccess} renderBackdrop={renderBackdrop} platformArrivals={platformTimetable} />
        </div>
    )
}


