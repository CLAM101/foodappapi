const mongoose = require("mongoose")


const itemsSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String

})



const orderSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    items: [itemsSchema]
    ,
    removeItem: {
        type: String
    },
    orderData: {
        type: Date,
        required: true,
        default: Date.now
    },
    confirmed:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model("order", orderSchema)



