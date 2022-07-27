import React, {useState, useEffect} from 'react'
import Pusher from 'pusher-js';
import LoginOrRegister from "./loginorregister"
import ActiveOrderTable from "./activeordertable"


// api keys for pusher 
const PUSHER_APP_KEY = "b4173b2b1b29274b8621";
const PUSHER_APP_CLUSTER = "eu";

function Resthome() {

  //  usestate to control which componenet is rendered
    var [count,
        setCount] = useState("login");


        // usestate as a dependancy on activeordertable useEffect to trigger 
    var [newOrder, setNewOrder]  = useState(0)  

    console.log("env", process.env.REACT_APP_PUSHER_KEY)

    //pusher function 
    function pusherFunction(props) {

        //creates new pusher instance
        const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {cluster: process.env.REACT_APP_PUSHER_CLUSTER})

        //subscribers the pusher instance to the channel defined on the backend
        const channel = pusher.subscribe("rests")

        // listens for a specific action defined on the backend, once action takes place it runs the code below, lsitens for new restaurant registrations
        channel.bind("inserted", (data) => {
            console.log("inserted")
            console.log("data", JSON.stringify(data))

            alert("you have been subscribed")

        })

        // also listens for an action as defined in backend, this channel lsitens for new orders, 
        //if order is made channel will update UseEffect dependancy tp update the active order lsit as well as alert the user of new orders
        channel.bind("updated", (data) =>{
            console.log("updated with data", data)
            setNewOrder(newOrder ++)
            console.log(newOrder)
            alert("a new order has been made")
        })
// unsubscribes from the channel after use to avoid too many concurrent connections resulting in the limit being reached on pusher.
        return (() => {
            pusher.unsubscribe("rests")
            props = false
        })

    }

    // will be called when component is mounted, will only call one ach new render and will only run once
    useEffect(() => {

        let mounted = true;
        if (mounted) {
            console.log("mounted")
            pusherFunction(mounted)

        }

    }, []);

    // [] would ensure that useEffect is executed only once

    // returns different componenets based on useState "count" defined above
    return (
        <div>
            {count === "allow"
                ? <ActiveOrderTable  setCount ={setCount}/>
                : <LoginOrRegister setCount ={setCount}/>}

        </div>
    )
}

export default Resthome