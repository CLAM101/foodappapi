require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors")
const bodyParser = require("body-parser");
const passport = require("passport");
const Subscriber = require("./models/subscriber");
const Restaurant = require("./models/restaurant");
const session = require("express-session");
const Driver = require("./models/driver");
const Pusher = require('pusher');

// connects app to DB
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
// throws error if any conencton to DB errors
db.on("error", () => console.error(error))

//  logs if connection to DB is successfull
db.once("open", () => console.log("connected to database"))

//creates a new pusher instance
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    encrypted: true
});
const channel1 = 'rests';

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    // console.log(req.originalUrl)
    if (req.originalUrl === "/subscribers/webhook") {
        next();
    } else {
        bodyParser.json()(req, res, next);
    }
});

// used to connect frontend to backedn allowing credentials so taht cookies work
// correctly
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}))

// part of passport js used to serialzie a user
passport.serializeUser(function (user, done) {
    if (user instanceof Subscriber) {
        done(null, {
            id: user.id,
            type: "Subscriber"
        });
        console.log("sub user")
    } else if (user instanceof Restaurant) {
        console.log("rest user")
        done(null, {
            id: user.id,
            type: "Restaurant"
        })
    } else if (user instanceof Driver) {
        console.log("driver user")
        done(null, {
            id: user.id,
            type: "Driver"
        })
    }

});

// part of passport js used ro deserialize the user
passport.deserializeUser(function (id, done) {
    console.log("de-serialize called")
    console.log("id type", id.type)
    console.log("ID", id)
    if (id.type === "Subscriber") {
        Subscriber
            .findById(id.id, function (err, user) {
                done(err, user);
            })
    } else if (id.type === "Restaurant") {
        Restaurant
            .findById(id.id, function (err, user) {
                done(err, user);
            })
    } else if (id.type === "Driver") {
        Driver
            .findById(id.id, function (err, user) {
                done(err, user);
            })
    }

});

// creates sessions for cookie functionality
app.use(session({
    secret: [
        "secret", "othersecret", "someothersecret"
    ],
    resave: true,
    saveUninitialized: true
}));

// initializes passport
app.use(passport.initialize());

// initializes the session
app.use(passport.session());

// stroes various routes based on their location
const subscribersRouter = require("./routes/subscribers")
const restaurantsRouter = require("./routes/restaurants")
const ordersRouter = require("./routes/orders")
const seederRouter = require("./routes/seeder");
const driverRouter = require("./routes/drivers")

// gets app to use routes
app.use("/subscribers", subscribersRouter)
app.use("/restaurants", restaurantsRouter)
app.use("/orders", ordersRouter)
app.use("/seeder", seederRouter)
app.use("/drivers", driverRouter)

// indecates successfull connection to DB and server startup
db.once('open', () => {
    app.listen(3000, () => {
        console.log("Server has started on port 3000")
    });

    // pusher and restStream configuration
    const orderCollection = db.collection('restaurants');
    const driverCollection = db.collection("drivers")

    const restStream = orderCollection.watch([], {
        fullDocument: 'updateLookup'
    });
    const driveStream = driverCollection.watch();

    driveStream.on("drivechange", (change) => {

        console.log("drivechange", change)

    })

    restStream.on('change', (change) => {
        console.log("change", change);

        console.log("change op type", change.operationType)

        const fullChange = change.fullDocument;

        if (change.operationType === "insert") {

            console.log("rest1", fullChange)
            pusher.trigger("rests", "inserted", {
                result: fullChange
            }, function (err) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("inserted Trigger hit")
                }
            })

        } else if (change.operationType === "delete") {
            pusher
                .trigger(channel1, "deleted", {
                    result: fullChange
                }, function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("delete trigger hit")
                    }
                });
        } else if (change.operationType === "update") {
            console.log("restaurant update change", change)

            const orderKeyLength = JSON
                .stringify(change.updateDescription.updatedFields)
                .length

            let result = null

            function checkLength() {

                let orderIndex = ''
                switch (orderKeyLength) {
                    case 48:
                        orderIndex = JSON
                            .stringify(change.updateDescription.updatedFields)
                            .slice(15, 16)
                        break;
                    case 49:
                        orderIndex = JSON
                            .stringify(change.updateDescription.updatedFields)
                            .slice(15, 17)
                        // code block
                        break;
                    case 50:
                        orderIndex = JSON
                            .stringify(change.updateDescription.updatedFields)
                            .slice(15, 18)
                        break;
                    default:
                        orderIndex = JSON
                            .stringify(change.updateDescription.updatedFields)
                            .slice(15, 18)
                }
                return orderIndex

            }

            if (JSON.stringify(change.updateDescription.updatedFields).includes("prep")) {

                console.log("requested order", change.fullDocument.activeOrders[parseInt(checkLength())])

                result = {
                    eventType: "newOrder",
                    orderId: change.fullDocument.activeOrders[parseInt(checkLength())]._id
                }

            } else {


                function checkLength() {

                    let orderIndex = ''
                    switch (orderKeyLength) {
                        case 48:
                            orderIndex = JSON
                                .stringify(change.updateDescription.updatedFields)
                                .slice(15, 16)
                            break;
                        case 49:
                            orderIndex = JSON
                                .stringify(change.updateDescription.updatedFields)
                                .slice(15, 17)
                            // code block
                            break;
                        case 50:
                            orderIndex = JSON
                                .stringify(change.updateDescription.updatedFields)
                                .slice(15, 18)
                            break;
                        default:
                            orderIndex = JSON
                                .stringify(change.updateDescription.updatedFields)
                                .slice(15, 18)
                    }
                    return orderIndex

                }

                result = change.fullDocument.activeOrders[checkLength()]
            }

            pusher
                .trigger("rests", "updated", {
                    result: result
                }, function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Update Trigger hit")
                    }
                })
        }

    });
});
