import React, {useState} from "react";
import './App.css';
import Resthome from "./components/resthome"
// import Pusher from 'pusher-js';

function App() {
    return (
        <div>
            <Resthome path="/resthome" className="rest-home-div"/>
        </div>
    );
}

export default App;
