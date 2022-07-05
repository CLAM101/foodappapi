require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors")
const bodyParser = require("body-parser");
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


const subscribersRouter = require("./routes/subscribers")
const restaurantsRouter = require("./routes/restaurants")
const ordersRouter = require("./routes/orders")
const seederRouter = require("./routes/seeder");


app.use("/subscribers", subscribersRouter)
app.use("/restaurants", restaurantsRouter)
app.use("/orders", ordersRouter)
app.use("/seeder", seederRouter)




app.listen(3000, () => {
    console.log("Server has started on port 3000")
});

