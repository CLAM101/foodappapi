const express = require("express")
const router = express.Router()
const Restaurant = require("../models/restaurant")
const passport = require("passport");
const session = require("express-session");


router.use(session({
    secret: "foodsecrets",
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());
passport.use(Restaurant.createStrategy());


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    Restaurant.findById(id, function (err, user) {
        done(err, user);
    });
});


// Creating One
//// NEEDS PASSPORT JS FUNCTIONALITY
router.post("/createrestaurant", async (req, res) => {


Restaurant.register({
    username: req.body.username,
    email: req.body.email,
    src: req.body.src,
        title: req.body.title,
        description: req.body.description,
        menue: req.body.menue,
        rating: req.body.rating,
        categories: req.body.categories

}, req.body.password, async (err, restaurant) => {
    if (err) {
        console.log(err)
    } else {
        try {
            
            await passport.authenticate("local")(req, res, function () {
                console.log("working")
                console.log("is authenticated")
                res.status(201).json(newRestaurant)

            })
            const newRestaurant = await restaurant.save()

        } catch (err) {
            console.log("here!")
            res.status(400).json({
                message: err.message
            })
        }
    }
});




})



router.post("/test", (req, res) => {
 


})



// FILTER OPTIONS
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

    //PUSHES BOTH RESTURANT FILTER RESULT AND MENUE ITEM OPTION FILTER RESULT INTO A SINGLE ARRAY TO BE SENT AS A JSON RESPONSE BY THE SERVER

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
        return res.status(500).jsong({
            message: err.message
        })
    }
    res.restaurant = restaurant
    next()
}

module.exports = router