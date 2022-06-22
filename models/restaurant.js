const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose");

const menueItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true

    },
    description: {
        type: String,
        required: true
    },
    categories: {
        type: Array,
        required: true

    },
    rating: {
        type: String

    },
   
    restaurantname: {
        type: String
    }
})


const restaurantSchema = new mongoose.Schema({
    src: {
        type: String,
        required: true

    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true

    },
    menue: [menueItemSchema],
    rating: {
        type: String
    },
    categories:{
        type: String
    },
    subscribeData: {
        type: Date,
        required: true,
        default: Date.now
    }

})

restaurantSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("restaurant", restaurantSchema)