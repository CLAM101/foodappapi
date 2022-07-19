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
        type: Number

    },
    restaurantname: {
        type: String
    }
})

const activeOrderSchema = new mongoose.Schema({
    userID: {
            type: String,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        items: [menueItemSchema
        ],
        orderData: {
            type: Date,
            required: true,
            default: Date.now
        },
        status: {
            type: String
        }
})


const restaurantSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    src: {
        type: String,
        // required: true

    },
    title: {
        type: String,
        // required: true
    },
    description: {
        type: String,
        // required: true

    },
    menue: [menueItemSchema],
    rating: {
        type: String
    },
    categories: {
        type: String
    },
    subscribeData: {
        type: Date,
        required: true,
        default: Date.now
    },
    activeOrders: [activeOrderSchema],
    completedOrders: {
        type: Array
    }

})

restaurantSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("restaurant", restaurantSchema)

