const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscriber");
const passport = require("passport");
const session = require("express-session");
const Order = require("../models/order");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;






router.use(session({
    secret: "foodsecrets",
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());
passport.use(Subscriber.createStrategy());


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    Subscriber.findById(id, function (err, user) {
        done(err, user);
    });
});






// Google auth routes    
passport.use(new GoogleStrategy({
        clientID: "330178790432-ro0cr35k37f7kq4ln4pdq6dqdpqqtri6.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "http://localhost:3000/subscribers/google/callback",
    },
    function (accessToken, refreshToken, profile, email, done) {
        //check user table for anyone with a facebook ID of profile.id

        const ID = JSON.stringify(email.id)

        console.log(ID)
        Subscriber.findOne({
            googleID: ID
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                const subscriber = new Subscriber({
                    googleID: ID,
                    username: email.displayName,
                    email: email.emails[0].value,
                    provider: 'google',
                    //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                    google: profile._json
                });
                subscriber.save(function (err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }));

router.get("/google",


    passport.authenticate("google", {
        scope: ["profile", "email"]
    })

);

router.get("/google/callback",



    passport.authenticate("google", {
        successRedirect: "https://www.youtube.com/",
        failureRedirect: "/login/failed",

    })


);


// Facebook Auth Routes

passport.use(new facebookStrategy({
        clientID: "1142565916475628",
        clientSecret: "f0c297bf99f71d090b317cdcaa5ae6d8",
        callbackURL: "http://localhost:3000/subscribers/facebook/callback",
        profileFields: ["email", "displayName", "name"]
    },
    function (accessToken, refreshToken, profile, done) {
        //check user table for anyone with a facebook ID of profile.id
        console.log(profile)


        const ID = JSON.stringify(profile.id)

        console.log(ID)
        Subscriber.findOne({
            facebookID: ID
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                const subscriber = new Subscriber({
                    facebookID: ID,
                    username: profile.displayName,
                    email: profile._json.email,
                    provider: profile.provider,
                    //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                    facebook: profile._json
                });
                subscriber.save(function (err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
));

router.get("/facebook",
    passport.authenticate("facebook", {
        scope: [ "email"]
    })

);

router.get("/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect: "https://www.youtube.com/",
        failureRedirect: "/login/failed",

    })
);


// Edit cart (user must be authenticated)
router.patch("/editcart", async (req, res) => {

    // DETERMINES IF USER IS AUTH AND IF ADD OR REMOVE ITEM MAKE SURE ADD OR REMOVE PROP IS OUTSIDE OF CART ITEM OBECT
    if (req.isAuthenticated() && req.body.addOrRemoveItem === "add") {
        var sub
        // FINDS SUBSCRIBER BASED ON REQUEST
        sub = await Subscriber.findById(req.user._id, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("founduser1")
            }
        }).clone()
        console.log(sub.cart)

        // PUSHES ITEM FROM REQUEST INTO SUBSCRIBERS CART
        const currentCart = sub.cart
        const newCartItem = req.body.cartItem
        await currentCart.push(newCartItem)

        //    DETERMINES IF USER IS AUTH AND IF ADD OR REMOVE ITEM MAKE SURE REMOVE ITEM PROP IS NOT IN CARTITEM OBJECT
    } else if (req.isAuthenticated() && req.body.addOrRemoveItem === "remove") {
        var sub
        sub = await Subscriber.findById(req.user._id, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("founduser")
            }
        }).clone()

        // REMOVES A CART ITEM BASED ON ITEM ID MUST PASS IN CART ITEM ID ONLY REMOVES OFF OF SPCIFIC ITEM ID
        const cartItemId = req.body.id
        await Subscriber.updateOne({
            _id: sub._id
        }, {
            $pull: {
                cart: {
                    _id: cartItemId
                }
            }
        })
    } else {
        console.log("not reading")
    }
    try {
        // SAVES THE CHANGES IN THE SUBSCRIBERS COLLECTION
        const updatedSubscriber = await sub.save()
        res.json(updatedSubscriber)
    } catch (err) {
        console.log(err)
    }

})


// Create Order (user must be authenticated)
router.post("/createorder", async (req, res) => {

    if (req.isAuthenticated()) {

        try {
            // FINDS SUBSCRIBER BASED ON REQUEST ID
            const sub = await Subscriber.findById(req.user._id, function (err, docs) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("founduser")
                }
            }).clone()

            //STORES/TARGETS THE PENDING ORDER OF SUBSCRIBER
            const pendingOrder = await sub.pendingOrder

            //DETERMINES IF THE USER ALREADY HAS A PENDING ORDER, IF USER HAS PENDING ORDERS THEY WILL BE BLOCKED FROM CREATING A NEW ORDER UNTIL THE PREVIOUS ORDER IS CONFIRMED OR CANCELLED
            
                // IDENTIFIES SPECIFIC CART BASED ON REQUEST
                const cart = req.user.cart

                // STORES/TARGETS THE CART OF THE SUBSCRIBER
                const subCart = sub.cart

                //MAPS THE PRICE OF EACH CART ITEM TO AN ARRAY
                const itemTotals = cart.map(prop => prop.price)

                //FUNCTION FOR SUMMING ALL VALUES IN AN ARRAY
                const reducer = (accumulator, curr) => accumulator + curr;

                //USES REDUCER FUNCTION TO SUM ALL PRICES OF ITEMS IN CART
                const total = itemTotals.reduce(reducer)

                //CREATES A NEW ORDER USING THE ABOVE STORED VARIABLES
                const order = new Order({
                    userID: req.user._id,
                    total: total,
                    items: cart,
                    confirmed: false
                })

                // PUSHES NEW PENDING ORDER INTO SUBSCRIBERS PENDING ORDER ARRAY
                await pendingOrder.push(order)

                //EMPTIES THE SUBSCRIBERS CART
                await subCart.splice(0, subCart.length);

                // SAVES THE NEW ORDER TO THE MAIN ORDERS COLLECTION  & THE SUBS PENDING ORDER          
                const newOrder = await order.save()
                const newPendingOrder = await sub.save()

                //SENDS BACK BOTH THE ORDERS COLLECTION AND USERS ORDER HISTORY ARRAY
                res.status(201).send({
                    newOrder,
                    newPendingOrder

                })
             
        } catch (err) {
            res.status(400).json({
                message: err.message
            })
        }
    }
})

// GET ONE SUBSCRIBER BASED ON REQUEST ID USING PASSPORT IDEALLY USED FOR DATA NEEDED FOR THE PAYMENT PAGE AFTER MAKING AN ORDER

router.get("/getone", async (req, res) =>{
    if (req.isAuthenticated()){
const sub = await Subscriber.findById(req.user._id, function (err, docs) {
    if (err) {
        console.log(err)
    } else {
        console.log("founduser")
    }

}).clone()

try {
    res.json(sub)
} catch (err) {
    res.status(500).json({
        message: err.message
    })
}

    }
})


// CONFIRMS ORDER ON POST REQUEST RESULTING FROM A PAYMENT CONFIRMATION ON THE FRONTEND
router.post("/confirmorder", async (req, res) => {
    if (req.isAuthenticated) {
        const sub = await Subscriber.findById(req.user._id, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("founduser")
            }

        }).clone()

        const pendingOrder = await sub.pendingOrder
        const subOrderHistory = await sub.orderHistory

        const mainOrder = await Order.findById(pendingOrder[0]._id, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("Found Order")
            }
        }).clone()
        console.log(mainOrder)


        await subOrderHistory.push(pendingOrder[0]);

    
        mainOrder.confirmed = true

        try {
            pendingOrder.splice(0, pendingOrder.length);
            const updatedOrder = await mainOrder.save()
            const updatedSub = await sub.save()
            res.status(201).send({
                updatedOrder,
                updatedSub

            })

        } catch (err) {
            res.status(400).json({
                message: err.message
            })
        }


    }



})


// GETS ALL SUBSCRIBERS
router.get("/getall", async (req, res) => {

    if (req.isAuthenticated()) {
        try {
            const subscribers = await Subscriber.find()
            res.json(subscribers)
        } catch (err) {
            res.status(500).json({
                message: err.message
            })
        }

    }

});

// DELIVERS ALL DATA NEEDED FOR LOGGED IN HOMEPAGE BASED ON IF THE USER IS AUTHENTICATED
router.get("/loggedin", async (req, res) => {

    if (req.isAuthenticated()) {
        try {

            const subscribers = await Subscriber.findById(req.user._id, function (err, docs) {

                if (err) {
                    console.log(err)
                } else {
                    console.log("Found User!")

                }
            }).clone()

            res.json(subscribers)

        } catch (err) {
            res.status(500).json({
                message: err.message
            })
        }

    }

});

// // Getting One
// router.get("/:id", getSubscriber, (req, res) => {
//     res.json(res.subscriber)
// });


// LOGIN USING PASSPORT JS 
router.post("/login", (req, res) => {
    const subscriber = new Subscriber({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    req.login(subscriber, async function (err) {
        if (err) {
            console.log(err)
        } else {
            try {
                passport.authenticate("local")(req, res, function () {
                    console.log("Authenticated")
                    console.log(req)
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

// REGISTER USING PASSPORT JS
router.post("/register", async (req, res) => {
    Subscriber.register({
        username: req.body.username,
        email: req.body.email

    }, req.body.password, async (err, subscriber) => {
        if (err) {
            console.log(err)
        } else {
            try {
                await passport.authenticate("local")(req, res, function () {

                    console.log("is authenticated")
                    res.status(201).json(newSubscriber)

                })
                const newSubscriber = await subscriber.save()

            } catch (err) {
                res.status(400).json({
                    message: err.message
                })
            }
        }
    });
})


// UPDATES ONE SUBSCRIBER BASED ON THE SUBSCRIBERS ID
router.patch("/:id", getSubscriber, async (req, res) => {
    if (req.body.email != null) {
        res.subscriber.email = req.body.email
    }
    if (req.body.password != null) {
        res.subscriber.password = req.body.password
    }
    try {
        const updatedSubscriber = await res.subscriber.save()
        res.json(updatedSubscriber)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

// DELETES ONE SUBSCRIBER BASED ON THE SUBSCRIBERS ID
router.delete("/:id", getSubscriber, async (req, res) => {
    try {
        await res.subscriber.remove()
        res.json({
            message: "Deleted Subscriber"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

// FUNCTION FOR GETTING A SPECIFIC SUBSCRIBER FROM THE SUBSCRIBERS COLLECTION BASED ON A PRIOVIDED ID IN THE REQUEST PARAMATERS
async function getSubscriber(req, res, next) {
    let subscriber
    try {
        subscriber = await Subscriber.findById(req.params.id)
        if (subscriber == null) {
            return res.status(404).json({
                message: "cannot find subscriber"
            })
        }
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
    res.subscriber = subscriber
    next()
}

module.exports = router