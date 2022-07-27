const express = require("express")
const router = express.Router()
const Restaurant = require("../models/restaurant")
const Subscriber = require("../models/subscriber");
const passport = require("passport");
const randomRest = require("randomrestgenerator")
const LocalStrategy = require('passport-local')
const Order = require("../models/order");

// passport strategy for restaurants
passport.use('restlocal', new LocalStrategy(Restaurant.authenticate()));



// creates a test active order for the purposes of testing 
router.post("/create-test-order", async (req, res) => {

    const order = req.body.order

    await Restaurant.updateOne({
        _id: "62dbbca4b4d02d9d26cbd270"
    }, {
        $push: {
            activeOrders: order
        }
    })

    try {
        res.json("sucessfully created order")
    } catch (err) {
        res.json(err)
    }

})

// gets all active orders of a specific restaurant based on the user id stroed in a cookie 
router.get("/getactiveorders", checkAuthentication, authRole("rest"), async (req, res) => {

    console.log("the user", req.user)

    // finds restaurant based on suer id
const rest = await Restaurant.findById(req.user._id, function (err, docs) {
    if (err) {
        console.log(err)
    } else {
        console.log("founduser")
    }

}).clone()

// stores retireived restaurants active orders array 
let activeOrders = rest.activeOrders

try{
    // sends back retrieved active orders array to client 
    res.json(activeOrders)
}catch(err){
    res.status(500).json({
        message: err.message
    })
}

});

// adjusts order status of a restuants active orders 
router.post("/rest-adj-order-status", checkAuthentication, authRole("rest"), async (req, res) => {

    // order id sent in requst from client
 const orderId = req.body.order


// finds relevant restaurant based on user id provided in cookie on request from client 
 let rest = await Restaurant.findById(req.user._id, function (err, docs) {
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


 console.log(activeOrders)

 // fiters active orders to find the relevant order based on order id sent in request by client
 activeOrders.filter(function checkOption(option){
if (option.id === orderId){
    orderToChange = option
}


 }

 )

 console.log("order to change", orderToChange)

 // changes the status of the retrieved active order from "prep" to "ready for collection" 
orderToChange["status"] = "ready for collection"

try{
    // updates status of order in mail orders collection
     await Order.updateOne({
            _id: orderId
        }, {
            status: "ready for collection"
        }, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("Updated Order", docs);
            }
        }).clone()

        // saves changes to actie orders in restaurants collection
    const updatedOrder = await rest.save()
    res.json(updatedOrder)

}catch(e){
    console.log(e)
    res.json(e)
}


});

// REGISTER USING PASSPORT JS endpoint for registering a new restuarant, this will eventually be moved to the admin panel once created
router.post("/register", async (req, res) => {

    // stores random restaurant object provided by randomrestgen npm package I created for producing test data, this route will eventually be adusted to fill alld etail in based on what is provided by the client
let restObject = randomRest()

console.log("request body", req.body)

// stores username email and password provided by request from cleint
const {username, email, password} = req.body

console.log("username", username, "email", email, "password", password)

// creates a new restuarant in restaurants colelction useing detail provided in request from cleint and random dta provided by randomrest generator npm packege
    Restaurant.register({
        username: req.body.username,
        email: req.body.email,
        src: restObject.img,
        title: restObject.title,
        description: restObject.description,
        menu: restObject.menu,
        rating: restObject.rating,
        categories: restObject.categories
        

    }, req.body.password, async (err, restaurant) => {
        if (err) {
            console.log(err)
        } else {
            try {
                await passport.authenticate("restlocal")(req, res, function () {
                    
                    console.log("is authenticated")
                    res.status(201).json(newRestaurant)

                })
                const newRestaurant = await restaurant.save()

            } catch (err) {
                res.status(400).json({
                    message: err.message
                })
            }
        }
    });
});


// logs in esisting restaurant based on credentials provided by client request
router.post("/login", (req, res) => {
    const restaurant = new Restaurant({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    req.login(restaurant, async function (err) {
        if (err) {
            console.log(err)
        } else {
            try {
                passport.authenticate("restlocal")(req, res, function () {
                    console.log("Authenticated")
                 res.status(201).json("authenticated")
                   

                })
                 
            } catch (err) {
                res.status(400).json({
                    message: err.message
                })
            }
        }
    })

})

// test endpoint for restaurants route
router.get("/test", checkAuthentication, async (req, res) => {
console.log("hello")
    
})

// RANDOM ORDER FILTER/GENERATOR 
router.get("/randomorder", async (req, res) => {

    //USERS CHOSEN CATEGORIES SPH & NOP SENT THROUGH THE REQUEST
    const restCats = req.body.restcategories
    const menuCats = req.body.menucats
    var totalSpend = req.body.totalspend
    const numberOfHeads = req.body.numberofheads
    const spendPerHead = totalSpend / numberOfHeads

    // console.log(spendPerHead)


    let restOptions = await Restaurant.aggregate(
        [{
            $match: {
                categories: {
                    $in: restCats
                }
            }
        }]
    )




  

    // console.log(restOptions)

    let eligbleRestOptions = []


    // filters through restaurant options and spits put options that match the cosen paramaters sent by the client
    for (let i = 0; i < restOptions.length; i++) {
        restOptions[i].menu.filter(function checkOptions(option) {
            // console.log(option)


            for (let x = 0; x < option.categories.length; x++) {
                if (option.categories[x] === menuCats[0] || option.categories[x] === menuCats[1] || option.categories[x] === menuCats[2] || option.categories[x] === menuCats[3] || option.categories[x] === menuCats[4] || option.categories[x] === menuCats[5] || option.categories[x] === menuCats[6]) {

                    eligbleRestOptions.push(restOptions[i])


                }
            }

        })
    }

    console.log(eligbleRestOptions)

//STORES FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND menu ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES  
    let randomRestOption = eligbleRestOptions[Math.floor(Math.random() * restOptions.length)];

    // console.log(randomRestOption.categories)


    //RESULT OF ALL menu ITEMS MATCHING USER CATEGORIES
    let menuOptions = []

    // console.log(randomRestOption)

      
    // console.log(randomRestOption)

    // LOOPS THROUGH ALL RESTURANT OPTIONS MENUS AND OUTPUTS MENU  ITEMS MATCHING THE USERS CHOSEN CATEGORIES
    await randomRestOption.menu.filter(function checkoptions(option) {
        for (let x = 0; x < option.categories.length; x++) {
            // console.log(option)
            if (option.categories[x] === menuCats[0] || option.categories[x] === menuCats[1] || option.categories[x] === menuCats[2] || option.categories[x] === menuCats[3] || option.categories[x] === menuCats[4] || option.categories[x] === menuCats[5] || option.categories[x] === menuCats[6]) {
                // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
                if (option.price <= spendPerHead) {
                    menuOptions.push(option)
                } else if (spendPerHead === undefined) {
                    menuOptions.push(option)

                }


            }
        }

    })


// defines a start time for random order generator to run
    const startingTime = Date.now();

    // defnes how long the generator will ru for these two paramater avoid an infinite loop encase there is not enough data to fill teh random order result
    const timeTocancel = 4000;

    // console.log(menuOptions)

    let randomOrder = []

    // will run the loop until number of heads is less than or equl to the random order result length
    while (randomOrder.length < numberOfHeads) {

        const currentTime = Date.now();


        // console.log(keepCalling)

        // will randomply spit out a menue option of the retireved elligble menue options 
        let randommenuOption = await menuOptions[Math.floor(Math.random() * menuOptions.length)];

        // console.log(randommenuOption)

        // will check to see if the random menue option is a duplicate of any uptions already in the random order result
        function checkDuplicates() {
            let duplicate = ""
            let itemName = randommenuOption.name
            // console.log(itemName)
            for (let i = 0; i < randomOrder.length; i++) {

                if (itemName === randomOrder[i].name) {
                    duplicate = "duplicate"

                }
                // console.log("loop running")
            }
            // console.log(randomOrder)
            return duplicate
        }

        let checkduplicate = checkDuplicates()

        // will break the loop if its been running for longer than 4 seconds and hasnt filled the number of heads requirement
        if (currentTime - startingTime >= timeTocancel) break;

        if (checkduplicate === "duplicate") {
            // console.log("Found Duplicate")

        } else {
            randomOrder.push(randommenuOption)

        }
        randomOrder.length;
        // console.log(randommenuOption)
    }


    // console.log(spendPerHead)
    try {
        res.status(201).send({
            randomOrder


        })
    } catch (err) {
        console.log(err)
    }


})

// GENERAL FILTER
router.get("/filter", async (req, res) => {
    //USERS CHOSEN CATEGORIES SPH & NOP SENT THROUGH THE REQUEST
    const restCats = await req.body.restcategories
    const menuCats = await req.body.menucats
    var spendPerHead = await req.body.spendperhead
   
    // RETURNS ONLY RESTURANT OPTIONS WITH CATEGORIES CONTAINING AT LEAST ONE OPTION IN THE USERS REQUESTED CATEGORIES
    let restOptions = await Restaurant.aggregate(
        [{
            $match: {
                categories: {
                    $in: restCats
                }
            }
        }]
    )
//RESULT OF ALL menu ITEMS MATCHING USER CATEGORIES
    let menuOptions = []

//FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND menu ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES    


    // LOOPS THROUGH ALL RESTURANT OPTIONS menuS AND OUTPUTS menu ITEMS MATCHING THE USERS CHOSEN CATEGORIES
    for (let i = 0; i < restOptions.length; i++) {
        restOptions[i].menu.filter(function checkOptions(option) {
            for (let x = 0; x < option.categories.length; x++) {
                if (option.categories[x] === menuCats[0] || option.categories[x] === menuCats[1] || option.categories[x] === menuCats[2] || option.categories[x] === menuCats[3] || option.categories[x] === menuCats[4] || option.categories[x] === menuCats[5] || option.categories[x] === menuCats[6]) {

                    // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
                    if (option.price <= spendPerHead) {
                        menuOptions.push(option)
                    }else if (spendPerHead === undefined){
                        menuOptions.push(option)
                    }


                }
            }
        })
    }

    

// console.log(result)
    try {
        // position 0 == menu option result position 1 == resturant options result

        // sends rest options and menue options result back to client
        res.status(201).send({
            menuOptions,
            restOptions

        })
        
    } catch (err) {
        if (err) {
            res.status(500).json({
                message: err.message
            })

        }
    }


})


// Getting All
router.get("/", async (req, res) => {
    try {
        const restaurants = await Restaurant.find()
        res.json(restaurants)
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

// Getting One
router.get("/:id", getRestaurant, (req, res) => {
    res.json(res.restaurant)
})


// Updating One 
//// NEEDS PASSPORT JS FUNCTIONALITY
router.patch("/:id", getRestaurant, async (req, res) => {

    //// NEED TO ADD IS AUTHENTICATED VERIFICATION NEEDS TO BE ADDED FOR ACCESS TO EDIT RESTAURANT
    if (req.body.name != null) {
        res.restaurant.name = req.body.name

//// NEED TO CREATE LOOP THAT CHANGES ALL RESTAURANTNAME KEY VALUES IN THE RESTAURANTS menu IF THE RESTAURANTS NAME CHANGES


    }
    if (req.body.title != null) {
        res.restaurant.title = req.body.title
    }
    if (req.body.description != null) {
        res.restaurant.description = req.body.description
    }
    if (req.body.menuitem != null) {
        const currentmenu = res.restaurant.menu
        const newmenuItem = req.body.menuitem
        if (req.body.menuitem.categories.includes(res.restaurant.categories)) {
console.log("working")
            //// NEED TO ADD SECOND CHECK TO MAKSE SURE RESTAURANT EDIT menu IS THE CORRECT ONE
            currentmenu.push(newmenuItem)
        }else{
            console.log("error, menu item does not contain correct primary category matching your restaurant")
        }



    }
    try {
        const updatedRestaurant = await res.restaurant.save()
        res.json(updatedRestaurant)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

// Deleting One
//// NEEDS PASSPORT JS FUNCTIONALITY will be added to admin panel once created
router.delete("/:id", getRestaurant, async (req, res) => {
    try {
        await res.restaurant.remove()
        res.json({
            message: "Deleted Restaurant"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

// function to get restaurant based on id provided in params will be moved to admin panel later on
async function getRestaurant(req, res, next) {

    let restaurant
    try {
        restaurant = await Restaurant.findById(req.params.id)
        if (restaurant == null) {
            return res.status(404).json({
                message: "cannot find Restaurant"
            })
        }
    } catch (err) {
        // return res.status(500).json({
        //     message: err.message
        // })
    }
    res.restaurant = restaurant
    next()
}


// checks authentications tatus of a user 
function checkAuthentication(req, res, next) {
    console.log("request user", req.user)
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

// checks role of user trying toa ccess certain endpoints
function authRole(role) {
    return (req, res, next) => {
        // console.log("auth role user type", req.user instanceof Subscriber)
        if (req.user instanceof Subscriber && role === "sub") {
            next()
            console.log("correct role sub")
        } else if (req.user instanceof Restaurant && role === "rest") {
            next()
            console.log("correct role rest")
        } else {
            res.status(401)
            return res.send("wrong role acccess denied")
        }

    }
}

module.exports = router