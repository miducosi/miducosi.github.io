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

    function getArrivalsSorted() {
        if(platformArrivals !== null && platformArrivals !== undefined && platformArrivals[0] !== (null || undefined)){
            platformArrivals.sort(function (a, b) {
                return new Date(a.timeToLive) - new Date(b.timeToLive);
            });
            let arrivals = []
            let i = 0
            platformArrivals.forEach(a =>{
                i++
                let d = new Date(a.timeToLive)
                arrivals.push(i.toString() + ". Leaving at... " + d.getHours().toString()+":"+ d.getMinutes().toString()+":" + d.getSeconds().toString() )
            })
            return arrivals;
        }else{return []}
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
                    {getArrivalsSorted().map(function(arrival, index){
                        return <p key={index}>{arrival}</p>
                    })}
                </div>
                <div className="modal-footer">
                    <button className="secondary-button" onClick={handleClose}>
                        Close
                    </button>
                    <button className="primary-button" onClick={handleSuccess}>
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    )
}
