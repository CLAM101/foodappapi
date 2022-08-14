import React, {useState, useEffect} from 'react'
import axios from "axios";
import DriverAcceptOrDecline from "./driveracceptordecline"

function DriverLoggedIn(props) {

    console.log(props)

    useEffect(() => {
        let mounted = true
        if (mounted) {
            console.log("active order table use effect called")
            
        }

    }, []);

    return (
        <div>
            <h1>Hello {props.driverId.username}</h1>
            <DriverAcceptOrDecline/>
        </div>
    )

}

export default DriverLoggedIn
