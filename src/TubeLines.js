import React, { useState } from 'react';
import { StationTime } from './StationTime';
import './TubeLines.css';
import TimetableModal from './modal/TimetableModal';

export default function TubeLines() {
    const [showModal, setShowModal] = useState(false);
    const renderBackdrop = (props) => <div className="backdrop" {...props} />;
    var handleClose = () => setShowModal(false);
    var handleSuccess = () => {
        console.log("success");
    };

    const [platformTimetable, setPlatformTimetable] = useState([])

    var stations = []
    var stationsMap = new Map()
    var stationPlatformsMap = new Map()
    var stationPlatformTimetableMap = []

    function getArrivals(e) {
        let line = e.target.value;
        const req = new XMLHttpRequest();
        req.open("GET", `https://api.tfl.gov.uk/Line/${line}/Arrivals`);
        req.responseType = 'json';
        req.onload = () => {
            if (req.readyState === req.DONE && req.status === 200) {
                console.log(req.response);
                stations = []
                stationsMap = new Map()
                req.response.forEach(element => {
                    stations.push(new StationTime(element));
                    let lastAdded = stations[stations.length - 1];
                    if (stationsMap.has(lastAdded.stationName)) {
                        stationsMap.set(lastAdded.stationName, [...stationsMap.get(lastAdded.stationName), lastAdded]);
                    } else {
                        stationsMap.set(lastAdded.stationName, [lastAdded]);
                    }
                });
                //console.log(stations);
                //console.log(stationsMap);
                buildDropdown(stations[0].lineName);
            } else if (req.readyState === req.DONE && req.status !== 200) {
                alert("Failed to load tube line data :(")
            }
        }
        req.send();

    }

    function buildDropdown(lineName) {
        var select = document.createElement("select");
        select.setAttribute("id", "stationsSelect");
        var option = document.createElement("option");
        option.value = -1;
        option.text = "Select a station";
        select.appendChild(option);
        stationsMap.forEach(function (value, key) {
            var option = document.createElement("option");
            option.value = key;
            option.text = key;
            select.appendChild(option);
        })
        removeAllChildsFromStationsContainer();
        var text = document.createElement("h3");
        text.innerText = "Select a " + lineName + " line station:"
        appendChildToStationsContainer(text);
        appendChildToStationsContainer(select);
        select.addEventListener("change", getStationPlatforms);
    }

    function getStationPlatforms(e) {
        var selectedStation = document.getElementById("stationsSelect").value;
        if (selectedStation === "-1") return
        stationPlatformsMap = new Map()
        stationsMap.get(selectedStation).forEach(stationTime => {
            if (stationPlatformsMap.has(stationTime.platformName)) {
                stationPlatformsMap.set(stationTime.platformName, [...stationPlatformsMap.get(stationTime.platformName), stationTime]);
            } else {
                stationPlatformsMap.set(stationTime.platformName, [stationTime]);
            }
        })
        //console.log(stationPlatformsMap)
        var text = document.createElement("h3");
        text.setAttribute("id", "platformSelectHeading")
        text.innerText = "Select a " + selectedStation + "  platform:"

        var select = document.createElement("select");
        select.setAttribute("id", "platformsSelect");
        stationPlatformsMap.forEach(function (value, key) {
            var option = document.createElement("option");
            option.value = key;
            option.text = key;
            select.appendChild(option);
        })

        buildNewPlatformsSelect(text, select)

    }
    function showPlatformTimetable() {
        var selectedPlatform = document.getElementById("platformsSelect").value;
        stationPlatformTimetableMap = stationPlatformsMap.get(selectedPlatform);
        setPlatformTimetable(stationPlatformTimetableMap)
        setShowModal(true);

    }

    function removeAllChildsFromStationsContainer() {
        var selectsContainer = document.getElementById("selectsContainer");
        while (selectsContainer.firstChild) {
            selectsContainer.removeChild(selectsContainer.firstChild);
        }
    }
    function appendChildToStationsContainer(child) {
        document.getElementById("selectsContainer").appendChild(child);
    }

    function buildNewPlatformsSelect(headingNode, selectNode) {
        var select = document.getElementById("platformsSelect");
        var text = document.getElementById("platformSelectHeading");
        var button = document.getElementById("showTimetableBtn");
        if (select != null) {
            document.getElementById("selectsContainer").removeChild(select);
        }
        if (text != null) {
            document.getElementById("selectsContainer").removeChild(text);
        }
        if (button != null) {
            document.getElementById("selectsContainer").removeChild(button);
        }
        appendChildToStationsContainer(headingNode)
        appendChildToStationsContainer(selectNode)
        var showTimetableBtn = document.createElement("button");
        showTimetableBtn.setAttribute("id", "showTimetableBtn")
        showTimetableBtn.className = "showTimetableBtn"
        showTimetableBtn.textContent = "Show Arrivals"
        showTimetableBtn.addEventListener("click", showPlatformTimetable)
        appendChildToStationsContainer(showTimetableBtn)
    }

    return (
        <div className="container">
            <h3>Select a Tube Line</h3>
            <div className="buttonsContainer">
                <button className="darkBlueBtn" value={"piccadilly"} onClick={getArrivals}>Piccadilly</button>
                <button className="redBtn" value={"central"} onClick={getArrivals}>Central</button>
                <button className="greyBtn" value={"jubilee"} onClick={getArrivals}>Jubilee</button>
                <button className="blueBtn" value={"victoria"} onClick={getArrivals}>Victoria</button>
                <button className="blackBtn" value={"northern"} onClick={getArrivals}>Northern</button>
                <button className="greenBtn" value={"district"} onClick={getArrivals}>District</button>
                <button className="yellowBtn" value={"circle"} onClick={getArrivals}>Circle</button>
            </div>
            <div id="selectsContainer" className='selectsContainer'>
            </div>
            <TimetableModal showModal={showModal} handleClose={handleClose} handleSuccess={handleSuccess} renderBackdrop={renderBackdrop} platformArrivals={platformTimetable} />
        </div>
    )
}


