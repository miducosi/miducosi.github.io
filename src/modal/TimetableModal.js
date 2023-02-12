import React from 'react'
import Modal from "react-overlays/Modal";
import './Modal.css'

export default function TimetableModal({ showModal, handleClose, handleSuccess, renderBackdrop, platformArrivals }) {
    function getStationName() {
        if (platformArrivals !== null && platformArrivals !== undefined) {
            if (platformArrivals[0] !== null && platformArrivals[0] !== undefined) {
                if (platformArrivals[0].stationName !== undefined) {
                    return platformArrivals[0].stationName + "\n" + platformArrivals[0].platformName
                } else { return "" }
            } else { return "" }
        } else { return "" }
    }
    function addLeftZeroIfNeeded(str) {
        if (str.length === 1) {
            return "0" + str
        } else return str
    }
    function timeToString(date) {
        let hours = date.getHours().toString()
        let minutes = date.getMinutes().toString()
        let seconds = date.getSeconds().toString()
        return addLeftZeroIfNeeded(hours) + ":" + addLeftZeroIfNeeded(minutes) + ":" + addLeftZeroIfNeeded(seconds)
    }
    function getArrivalsSorted() {
        if (platformArrivals !== null && platformArrivals !== undefined && platformArrivals[0] !== (null || undefined)) {
            platformArrivals.sort(function (a, b) {
                return new Date(a.timeToLive) - new Date(b.timeToLive);
            });
            let arrivals = []
            platformArrivals.forEach(a => {
                let d = new Date(a.timeToLive)
                arrivals.push(" Leaving at... " + timeToString(d))
            })
            return arrivals;
        } else { return [] }
    }
    return (
        <Modal
            className="modal"
            show={showModal}
            onHide={handleClose}
            renderBackdrop={renderBackdrop}
        >
            <div>
                <div className="modal-header">
                    <div className="modal-title">{
                        getStationName()
                    }</div>
                    <div>
                        <span className="close-button" onClick={handleClose}>
                            x
                        </span>
                    </div>
                </div>
                <div className="modal-desc">
                    <ol>
                        {getArrivalsSorted().map(function (arrival, index) {
                            return <li key={index}>{arrival}</li>
                        })}
                    </ol>
                </div>
                <div className="modal-footer">
                    <button className="secondary-button" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    )
}
