const express = require("express")
const router = express.Router()
const Restaurant = require("../models/restaurant")
const Subscriber = require("../models/subscriber");
const passport = require("passport");
const randomRest = require("randomrestgenerator")
const LocalStrategy = require('passport-local')
const Order = require("../models/order");


passport.use('restlocal', new LocalStrategy(Restaurant.authenticate()));



router.get("/getactiveorders", checkAuthentication, authRole("rest"), async (req, res) => {

    console.log(req.user)

const rest = await Restaurant.findById(req.user._id, function (err, docs) {
    if (err) {
        console.log(err)
    } else {
        console.log("founduser")
    }

}).clone()

let activeOrders = rest.activeOrders

try{
    res.json(activeOrders)
}catch(err){
    res.status(500).json({
        message: err.message
    })
}

});

router.post("/rest-adj-order-status", checkAuthentication, authRole("rest"), async (req, res) => {

 const orderId = req.body.order



 let rest = await Restaurant.findById(req.user._id, function (err, docs) {
     if (err) {
         console.log(err)
     } else {
         console.log("founduser")
         console.log("docs", docs)
     }
 }).clone()


//    let restaurant = await Restaurant.findOne({
//            'activeOrders': {
//                $elemMatch: {
//                    '_id': orderId
//                }
//            }
//        },
//        function (err, docs) {
//            if (err) {
//                console.log(err)
//            } else {
//                // console.log("found restaurant")
//                console.log("docs",  docs)
//            }
//        }
//    ).clone();

   console.log("restaurant", rest)

 let activeOrders = rest.activeOrders

 let orderToChange 


 console.log(activeOrders)

 activeOrders.filter(function checkOption(option){
if (option.id === orderId){
    orderToChange = option
}


 }

 )

 console.log("order to change", orderToChange)

orderToChange["status"] = "ready for collection"

try{
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
    const updatedOrder = await rest.save()
    res.json(updatedOrder)

}catch(e){
    console.log(e)
    res.json(e)
}


});

// REGISTER USING PASSPORT JS
router.post("/register", async (req, res) => {

let restObject = randomRest()

    Restaurant.register({
        username: req.body.username,
        email: req.body.email,
        src: restObject.img,
        title: restObject.title,
        description: restObject.description,
        menue: restObject.menue,
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


router.get("/test", checkAuthentication, async (req, res) => {
console.log("hello")
    
})

// RANDOM ORDER FILTER/GENERATOR
router.get("/randomorder", async (req, res) => {

    //USERS CHOSEN CATEGORIES SPH & NOP SENT THROUGH THE REQUEST
    const restCats = req.body.restcategories
    const menueCats = req.body.menuecats
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




    /// CURRENTLY TRYING TO GET RANDOM RESTAURANT TO RUN AGAIN IF NONE OF ITS MENUE CATS MATCH THE USER SPECIFIED MENUE CATS (BUG FIXED)

    // console.log(restOptions)

    let eligbleRestOptions = []

    for (let i = 0; i < restOptions.length; i++) {
        restOptions[i].menue.filter(function checkOptions(option) {
            // console.log(option)


            for (let x = 0; x < option.categories.length; x++) {
                if (option.categories[x] === menueCats[0] || option.categories[x] === menueCats[1] || option.categories[x] === menueCats[2] || option.categories[x] === menueCats[3] || option.categories[x] === menueCats[4] || option.categories[x] === menueCats[5] || option.categories[x] === menueCats[6]) {

                    eligbleRestOptions.push(restOptions[i])


                }
            }

        })
    }

    console.log(eligbleRestOptions)


    let randomRestOption = eligbleRestOptions[Math.floor(Math.random() * restOptions.length)];

    // console.log(randomRestOption.categories)


    //RESULT OF ALL MENUE ITEMS MATCHING USER CATEGORIES
    let menueOptions = []

    // console.log(randomRestOption)

    //FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND MENUE ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES    
    // console.log(randomRestOption)

    // LOOPS THROUGH ALL RESTURANT OPTIONS MENUES AND OUTPUTS MENUE ITEMS MATCHING THE USERS CHOSEN CATEGORIES

    await randomRestOption.menue.filter(function checkoptions(option) {
        for (let x = 0; x < option.categories.length; x++) {
            // console.log(option)
            if (option.categories[x] === menueCats[0] || option.categories[x] === menueCats[1] || option.categories[x] === menueCats[2] || option.categories[x] === menueCats[3] || option.categories[x] === menueCats[4] || option.categories[x] === menueCats[5] || option.categories[x] === menueCats[6]) {
                // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
                if (option.price <= spendPerHead) {
                    menueOptions.push(option)
                } else if (spendPerHead === undefined) {
                    menueOptions.push(option)

                }


            }
        }

    })



    const startingTime = Date.now();
    const timeTocancel = 4000;

    // console.log(menueOptions)

    let randomOrder = []

    while (randomOrder.length < numberOfHeads) {

        const currentTime = Date.now();


        // console.log(keepCalling)
        let randomMenueOption = await menueOptions[Math.floor(Math.random() * menueOptions.length)];

        // console.log(randomMenueOption)

        function checkDuplicates() {
            let duplicate = ""
            let itemName = randomMenueOption.name
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
        if (currentTime - startingTime >= timeTocancel) break;

        if (checkduplicate === "duplicate") {
            // console.log("Found Duplicate")

        } else {
            randomOrder.push(randomMenueOption)

        }
        randomOrder.length;
        // console.log(randomMenueOption)
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
    const menueCats = await req.body.menuecats
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
//RESULT OF ALL MENUE ITEMS MATCHING USER CATEGORIES
    let menueOptions = []

//FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND MENUE ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES    


    // LOOPS THROUGH ALL RESTURANT OPTIONS MENUES AND OUTPUTS MENUE ITEMS MATCHING THE USERS CHOSEN CATEGORIES
    for (let i = 0; i < restOptions.length; i++) {
        restOptions[i].menue.filter(function checkOptions(option) {
            for (let x = 0; x < option.categories.length; x++) {
                if (option.categories[x] === menueCats[0] || option.categories[x] === menueCats[1] || option.categories[x] === menueCats[2] || option.categories[x] === menueCats[3] || option.categories[x] === menueCats[4] || option.categories[x] === menueCats[5] || option.categories[x] === menueCats[6]) {

                    // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
                    if (option.price <= spendPerHead) {
                        menueOptions.push(option)
                    }else if (spendPerHead === undefined){
                        menueOptions.push(option)
                    }


                }
            }
        })
    }

    

// console.log(result)
    try {
        // position 0 == menue option result position 1 == resturant options result
        res.status(201).send({
            menueOptions,
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

//// NEED TO CREATE LOOP THAT CHANGES ALL RESTAURANTNAME KEY VALUES IN THE RESTAURANTS MENUE IF THE RESTAURANTS NAME CHANGES


    }
    if (req.body.title != null) {
        res.restaurant.title = req.body.title
    }
    if (req.body.description != null) {
        res.restaurant.description = req.body.description
    }
    if (req.body.menueitem != null) {
        const currentMenue = res.restaurant.menue
        const newMenueItem = req.body.menueitem
        if (req.body.menueitem.categories.includes(res.restaurant.categories)) {
console.log("working")
            //// NEED TO ADD SECOND CHECK TO MAKSE SURE RESTAURANT EDIT MENUE IS THE CORRECT ONE
            currentMenue.push(newMenueItem)
        }else{
            console.log("error, menue item does not contain correct primary category matching your restaurant")
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
//// NEEDS PASSPORT JS FUNCTIONALITY
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



function checkAuthentication(req, res, next) {
    // console.log("request body rest", req.user)
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