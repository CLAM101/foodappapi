const express = require("express");
const router = express.Router();
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require('passport-local')
const Driver = require("../models/driver");
const Subscriber = require("../models/subscriber");
const Restaurant = require("../models/restaurant");
const Order = require("../models/order");

// LOCAL STRATEGY FOR DRIVER MONGOOSE MODEL
passport.use('drivelocal', new LocalStrategy(Driver.authenticate()));



// TEST ROUTE
router.get("/test", checkAuthentication, authRole("drive"), (req, res) =>{
    res.json("working")
})

router.post("/getdeliverydetail",checkAuthentication, authRole("drive"),  (req, res) =>{

         console.log("data from frontend order retrieval request", req.body )



         const orderDetail ={
            restId: req.user._id,
            orderId
         }

         checkForOrder(inputs)


    res.json("working")



})

router.get("/isloggedin", checkAuthentication, async (req, res) => {
    console.log("request data", req.user instanceof Driver)
    if (req.user instanceof Driver) {
        res.json(true)
    } else {
        res.json(false)
    }
});

// ROUTE FOR DRIVER TO INDECATE COMPLETION OF AND ORDER
router.post("/order-completed", checkAuthentication, authRole("drive"), async (req, res) => {

    // ORDER ID PASSED IN WHEN DRIVER CLICKS COMPLETE ORDER
    const orderId = req.body.orderId

// FINDS RELEVANT DRIVER BASED ON USER ID IN COOKIE AND STORES DRIVER IN VARIABLE
    const driver = await Driver.findById(req.user._id, function (err, user) {
        if (err) {
            console.log(err)
        } else {
            console.log("found user", user)
        }
    }).clone()

    console.log("driver", driver)


    // STORES DRIVERS ACTIVE ORDER IN A VARIABLE
    const driverActiveOrder = driver.activeOrder[0]


    //CHANGES STATUS OF THE DRIVERS ACTIVE ORDER TO "COMPLETED"
    driverActiveOrder["status"] = "completed"

    //STORES THE DRIVERS COMPLETED ORDERS ARRAY IN A VARIABLE
    const driverCompletedOrders = driver.completedOrders

    // PUSHED THE ORDER INTO THE DRIVERS COMPLETED ORDERS ARRAY
    driverCompletedOrders.push(driverActiveOrder)


    //FINDS AND STORES THE SUBSCRIBER RELEVANT TO THE ORDER IN A VARIABLE
    const sub = await Subscriber.findById(driverActiveOrder.userID, (err, sub) => {
        if (err) {
            console.log(err)
        } else {
            console.log("found sub", sub)
        }
    }).clone()

    console.log("subscriber", sub)

    // STORES THE SUBSCRIBERS PENDING ORDERS ARRAY IN A VARIABLE
    const pendingOrders = sub.pendingOrder

    console.log("pendingOrders", pendingOrders)

    let subPendOrder

    // FILTERS THROUGH THE SUBS PENDING ORDERS ARRAY TO FIND THE RELEVANT PENDING ORDER
    pendingOrders.filter(function checkOption(option) {
        if (option.id === orderId) {
            subPendOrder = option
        }
    })

    // STORES THE SUBS ORDER HISTORY IN A VARIABLE
    const subOrderHist = sub.orderHistory


    console.log("sub order history", subOrderHist)

    // ADJSUTS THE SUBS PENDING ORDERS STATUS TO "COMPLETED"
    subPendOrder["status"] = "completed"

    // PUSHES THE NEWLY COMPLETED ORDER INTO THE SUBS ORDER HISTORY
    subOrderHist.push(subPendOrder)


    // SAVES THE UPDATED SUBSCRIBER IN DB
    const updatedSub = await sub.save()



    console.log("active order driver", req.user.activeOrder[0].items[0].restaurantname)


    // FINDS AND STORES THE RELEVANT RESTAURANT IN A VARIABLE
    const restaurant = await Restaurant.findOne({
        title: req.user.activeOrder[0].items[0].restaurantname
    }, function (err, rest) {
        if (err) {
            console.log(err)
        } else {
            console.log("foound rest", rest)
        }
    }).clone()

    console.log("restaurant", restaurant)

    //STORES THE RESTAURANTS ACTIVE ORDERS ARRAY IN A VARIABLE
    const restActiveOrders = restaurant.activeOrders

    // STORES THE RESTAURANTS COMPLETED ORDERS ARRAY IN A VARIABLE
    const restCompletedOrders = restaurant.completedOrders


    console.log("rest active orders", restActiveOrders)

    let restActiveOrder

    // FILTERS THROUGH THE RESTAURANTS ACRIVE ORERS ARRAY TO FIND THE RELEVANT ORDER
    restActiveOrders.filter((option) => {
        if (option.id === orderId) {
            restActiveOrder = option
        }
    })


// CHANGES THE STATUS OF THE ORDER TO "COMPLETED"
    restActiveOrder["status"] = "completed"

    // PUSHES THE NEWLY COMPLETED ORER INTO THE RESTAURANTS COMPLETED ORDERS ARRAY
    restCompletedOrders.push(restActiveOrder)

    // SAVES THE UPDATED RESTAURANT IN DB
    const updatedRestaurant = await restaurant.save()

// SAVES THE UPDATED DRIVER IN DB
     const updatedDriver = await driver.save()

    


    console.log("driver id for driver update", driver._id)

    //REMOVES THE COMPLETED ORDER FROM THE DRIVERS ACTIVE ORDER ARRAY
    await Driver.updateOne({
        _id: driver._id
    }, {
        $pull: {
            activeOrder: {
                _id: orderId
            }
        }
    }, function (err, docs) {
        if (err) {
            console.log(err)
        } else {
            console.log("successfully updated driver", docs)
        }
    }).clone()

// CHANGES THE MAIN ORDER IN THE ORDERS COLELCTION STATUS TO "COMPLETED"
console.log("order ID for order update", orderId)
    await Order.updateOne({
        _id: orderId
    }, {
        status: "completed"
    }, function (err, docs) {
        if (err) {
            console.log(err)
        } else {
            console.log("Updated Order", docs);
        }
    }).clone()

//  REMOVES THE COMPLETED ORDER FROM THE RESTAURANTS ACTIVE ORDERS ARRAY
console.log("restaurant name for retaurant update", restActiveOrder.items[0].restaurantname)
    await Restaurant.updateOne({
        title: restActiveOrder.items[0].restaurantname
    }, {
        $pull: {
            activeOrders: {
                _id: orderId
            }
        }
    }, function (err, docs) {
        if (err) {
            console.log(err)
        } else {
            console.log("sucessfully updated restaurant", docs)
        }
    }).clone()

    // REMOVES THE COMPLETED ORDER FROM THE SUBSCRIBERS PENDING ORDERS ARRAY
    console.log("subscriber user id for sub update", req.user.activeOrder[0].userID)
    await Subscriber.updateOne({
        _id: req.user.activeOrder[0].userID
    }, {
        $pull: {
            pendingOrder: {
                _id: orderId
            }
        }
    }, function (err, docs) {
        if (err) {
            console.log(err)
        } else {
            console.log("sucessfully updated subsriber", docs)
        }
    }).clone()

    
    try {
        // RESPONDS WITH ALL UPDATES COMPLETED
        res.json(
            updatedRestaurant,
            updatedSub,
            updatedDriver
        )
// CATCHES ANY ERRORS LOGS THEM AND SEND ERRORS TO CLIENT
    } catch (e) {
        console.log(e)
        res.json(e)
    }

})
// endpoint for driver to accept or decline a new order that has come in, this will be attached to a button brought up by pusher on the client sidde, the button will hit this endpoint.
router.post("/accept-or-decline", checkAuthentication, authRole("drive"), async (req, res) => {

    // uder id passed in from client side
    const orderId = req.body.orderId

    console.log("user input orderId", orderId, "user id", req.user._id)


// finds the logged in driver
    const driver = await Driver.findById(req.user._id, function (err, user) {
        if (err) {
            console.log(err)
        } else {
            console.log("found user", user)
        }
    }).clone()

    console.log('driver', driver)

    //finds the order in question
    const availOrder = await Order.findById(orderId, (err, item) => {
        if (err) {
            console.log(err)
        } else {
            console.log("found order", item)
        }
    }).clone()

    console.log("avail order", availOrder, "avail order items", availOrder.items[0].restaurantname)


    // findes the restaurant the order is attached to 
    const restaurant = await Restaurant.findOne({
        title: availOrder.items[0].restaurantname
    }, function (err, rest) {
        if (err) {
            console.log(err)
        } else {
            console.log("foound rest", rest)
        }
    }).clone()

    console.log("restaurant", restaurant)

    // strores the retrieved acetive orders fro, the above retireived restaurant
    const restActiveOrders = restaurant.activeOrders


    console.log("rest active orders", restActiveOrders)

    let restActiveOrder

    // filters through retreived active orders to find the specidied order
    restActiveOrders.filter((option) => {
        if (option.id === orderId) {
            restActiveOrder = option
        }
    })

    // changes the status of the order to "out for delivery" after the driver accepts the order, may consider adjsuting this and adding another milestone for when the driver physically picks up the order
    restActiveOrder["status"] = "out for delivery"

    //  finds the subscriber the order in question was made by
    const sub = await Subscriber.findById(availOrder.userID, (err, sub) => {
        if (err) {
            console.log(err)
        } else {
            console.log("found sub", sub)
        }
    }).clone()

    const pendingOrders = sub.pendingOrder

    let subPendOrder

    // finds the order in question unders the subs pending orders
    pendingOrders.filter(function checkOption(option) {
        if (option.id === orderId) {
            subPendOrder = option
        }
    })

    console.log("found driver", driver)

    // changes the status of the order for the drive and the subscriber as well
    availOrder["status"] = "out for delivery"
    subPendOrder["status"] = "out for delivery"

    // psuhes the order into the drivers active orders
    driver.activeOrder.push(availOrder)

    try {

        // saves all changes to DB and provides a response to the client
        const updatedRest = await restaurant.save()
        const updatedOrder = await availOrder.save()
        const updatedDriver = await driver.save()
        const updatedSub = await sub.save()

        res.json({
            updatedDriver,
            updatedOrder,
            updatedSub,
            updatedRest
        })

    } catch (e) {
        res.json(e)
    }

})

// LOGIN USING PASSPORT JS logs in the driver 
router.post("/login", (req, res) => {
    const driver = new Driver({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    req.login(driver, async function (err) {
        if (err) {
            console.log(err)
        } else {
            try {
                passport.authenticate("drivelocal")(req, res, function () {
                    console.log("Authenticated")
                    // console.log(req)
                    res.status(201).json(req.user)

                })
            } catch (err) {
                res.status(400).json({
                    message: err.message
                })
            }
        }
    })

})

// REGISTER USING PASSPORT JS registers a new driver
router.post("/register", async (req, res) => {
    Driver.register({
        username: req.body.username,
        email: req.body.email
        

    }, req.body.password, async (err, driver) => {
        if (err) {
            console.log(err)
        } else {
            try {
                await passport.authenticate("drivelocal")(req, res, function () {

                    console.log("is authenticated")
                    res.status(201).json(newDriver)

                })
                const newDriver = await driver.save()

            } catch (err) {
                res.status(400).json({
                    message: err.message
                })
            }
        }
    });
})


// function for checking logged in status of drivers
function checkAuthentication(req, res, next) {
   // console.log("request body sub", req.user)
    if (req.isAuthenticated()) {
        //req.isAuthenticated() will return true if user is logged in
        console.log("authenticated")
        next();
    } else {
        res.json(
            "Please log in"
        )
    }
}

// checks role of the user limiting access to certain endpoints based on user type
function authRole(role) {
    return (req, res, next) => {
   //     console.log("auth role user type", req.user instanceof Subscriber)
        if (req.user instanceof Subscriber && role === "sub") {
            next()
            console.log("correct role sub")
        } else if (req.user instanceof Restaurant && role === "rest") {
            next()
            console.log("correct role rest")
        } else if (req.user instanceof Driver && role === "drive") {
            next()
        } else {
            res.status(401)
            return res.send("wrong role acccess denied")
        }


    }
}

async function checkForOrder(inputs) {

    console.log("inputs in check for order", inputs)
    let rest

    try {
        rest = await Restaurant.findById(inputs.restId, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("founduser")
                console.log("docs", docs)
            }
        }).clone()
        console.log("restaurant", rest)

        // stroes retrieved active orders 
        let activeOrders = rest.activeOrders
        let orderToChange


        console.log("active orders check for order", activeOrders)

        // fiters active orders to find the relevant order based on order id sent in request by client
        activeOrders.filter(function checkOption(option) {
            if (option.id === inputs.orderId) {
                orderToChange = option
            }
        })

        return ({
            orderToChange: orderToChange,
            rest: rest
        })
    } catch (e) {
        console.log("catch error", e)
    }
}

module.exports = router