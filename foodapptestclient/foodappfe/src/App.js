import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import RestLoginOrRegister from "./components/restloginorregister";
import ActiveOrderTable from "./components/activeordertable";
import axios from "axios";

function App() {
  //  usestate to control which componenet is rendered

  var [count, setCount] = useState("ActiveOrderTable");

  // usestate as a dependancy on activeordertable useEffect to trigger
  var [newOrder, setNewOrder] = useState(null);

  console.log("env", process.env.REACT_APP_PUSHER_KEY);



  //pusher function
  function pusherFunction(props) {
    //creates new pusher instance
    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER,
    });

    //subscribers the pusher instance to the channel defined on the backend
    const channel = pusher.subscribe("rests");

    // listens for a specific action defined on the backend, once action takes place
    // it runs the code below, lsitens for new restaurant registrations
    channel.bind("inserted", (data) => {
      console.log("inserted");
      console.log("data on inserted", data);

      alert("you have been subscribed");
    });

    // also listens for an action as defined in backend, this channel lsitens for
    // new orders, if order is made channel will update UseEffect dependancy tp
    // update the active order lsit as well as alert the user of new orders
    channel.bind("updated", (data) => {
      console.log("data on updated", data);

      getLoggedState();

      function getLoggedState() {
        if (data.result.orderId && data.result.eventType === "newOrder") {
          axios({
            method: "POST",
            data: {
              orderId: data.result.orderId,
            },
            withCredentials: true,
            url: "http://localhost:3000/restaurants/isloggedin",
          }).then((response) => {
            console.log(
              "response on loggedin check restaurants",
              response.data
            );

            if (response.data === true) {
              console.log("data result rests", data.result);

              console.log("new order created");
              alert("new order recived");
            }
          });
        }
      }

      setNewOrder(newOrder++);

      console.log("new order called");
    });
    // unsubscribes from the channel after use to avoid too many concurrent
    // connections resulting in the limit being reached on pusher.
    return () => {
      pusher.unsubscribe("rests");
      props = false;
    };
  }

  // will be called when component is mounted, will only call one ach new render
  // and will only run once
  useEffect(() => {
    let mounted = true;

    if (mounted) {
      console.log("mounted");

      pusherFunction(mounted);
    }
  }, []);

  // [] would ensure that useEffect is executed only once returns different
  // componenets based on useState "count" defined above
  return (
    <div>
      {count === "activeOrderTable" ? (
        <ActiveOrderTable setNewOrder={setNewOrder} setCount={setCount} />
      ) : count === "restLoginOrRegister" ? (
        <RestLoginOrRegister setCount={setCount} />
      ) : (
        <ActiveOrderTable setNewOrder={setNewOrder} setCount={setCount} />
      )}
    </div>
  );
}

export default App;
