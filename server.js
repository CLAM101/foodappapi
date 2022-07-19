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

mongoose.connect(process.env.DATABASE_URL)

const db = mongoose.connection



db.on("error", () => console.error(error))
db.once("open", () => console.log("connected to database"))

// app.use(express.json())


// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    // console.log(req.originalUrl)
    if (req.originalUrl === "/subscribers/webhook") {
        next();
    } else {
        bodyParser.json()(req, res, next);
    }
});
app.use(cors())

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
    }else if (user instanceof Driver){
        console.log("driver user")
        done(null, {
            id:user.id,
            type: "Driver"
        })
    }


});

passport.deserializeUser(function (id, done) {
    console.log("de-serialize called")
    console.log("id type", id.type)
    console.log("ID", id)
    if (id.type === "Subscriber") {
        Subscriber.findById(id.id, function (err, user) {
            done(err, user);
        })
    } else if(id.type === "Restaurant") {
        Restaurant.findById(id.id, function (err, user) {
            done(err, user);
        })
    } else if (id.type === "Driver"){
        Driver.findById(id.id, function (err, user){
            done(err, user);
        })
    }

});



app.use(session({
    secret: ["secret", "othersecret", "someothersecret" ],
    resave: false,
    saveUninitialized: false
}));app

app.use(passport.initialize());
app.use(passport.session());









const subscribersRouter = require("./routes/subscribers")
const restaurantsRouter = require("./routes/restaurants")
const ordersRouter = require("./routes/orders")
const seederRouter = require("./routes/seeder");
const driverRouter = require("./routes/drivers")








app.use("/subscribers", subscribersRouter)
app.use("/restaurants", restaurantsRouter)
app.use("/orders", ordersRouter)
app.use("/seeder", seederRouter)
app.use("/drivers", driverRouter)








app.listen(3000, () => {
    console.log("Server has started on port 3000")
});

