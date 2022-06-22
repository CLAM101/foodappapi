const express = require("express")
const router = express.Router()
const Order = require("../models/order")


// Getting All

router.get("/", async (req, res) => {
    try {
        const orders = await Order.find()
        res.json(orders)
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

// Getting One
router.get("/:id", getOrder, (req, res) => {
    res.json(res.order)
})

// Creating One
router.post("/createorder", async (req, res) => {
 
    

const autheticated = (req.isAuthenticated())





    // const order = new Order({
    //     userID: req.body.userID,
    //     total: req.body.total,
    //     items: req.body.items
    // })
    try {

       

     res.json(autheticated)





        // console.log(order)
        // const newOrder = await order.save()
        // res.status(201).json(newOrder)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

// Updating One 
router.patch("/:id", getOrder, async (req, res) => {

    if (req.body.userID != null && req.body.removeItem != "true") {
        res.order.userID = req.body.userID
    }
    if (req.body.total != null && req.body.removeItem != "true") {
        res.order.total = req.body.total
    }
    if (req.body.items != null && req.body.removeItem != "true") {
        const currentItems = res.order.items
        const newItem = req.body.items
        currentItems.push(newItem)
    }
    if (req.body.removeItem === "true") {
        const userID = req.body.userID
        const ID = req.body.items._id

        await Order.updateOne({
            userID: userID
        }, {
            $pull: {
                items: {
                    _id: ID
                }
            }
        })

    }

    try {
        const updatedItems = await res.order.save()
        res.json(updatedItems)
    } catch (err) {
        console.log("Shit didnt work fam")
        res.status(400).json({
            message: err.message
        })
    }
})



// Deleting One
router.delete("/:id", getOrder, async (req, res) => {
    try {
        await res.order.remove()
        res.json({
            message: "Deleted Order"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})


async function getOrder(req, res, next) {

    let order
    try {
        order = await Order.findById(req.params.id)
        if (order === null) {
            return res.status(404).json({
                message: "Cannot Find Order"
            })
        }
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
    res.order = order
    next()
}





module.exports = router