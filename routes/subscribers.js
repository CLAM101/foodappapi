const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscriber");
const Restaurant = require("../models/restaurant");
const passport = require("passport");
const session = require("express-session");
const Order = require("../models/order");
const bodyParser = require("body-parser");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET




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
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
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


router.post("/test", async (req, res) =>{

   const customerId = await stripe.customers.retrieve('cus_M0VlMfoYzKP3qj')

//    const customer = await stripe.customers.retrieve('cus_M0VpSyeeL4yRR3');

   console.log("customer id", customerId)

res.status(201).send({
    customerId

})
})

// Edit cart (user must be authenticated)
router.patch("/editcart", async (req, res) => {
    let menueItem = null
    let wrongRest = false
    let noItem = false
    let existingPendingOrder = false
    // DETERMINES IF USER IS AUTH AND IF ADD OR REMOVE ITEM MAKE SURE ADD OR REMOVE PROP IS OUTSIDE OF CART ITEM OBECT
    if (req.isAuthenticated() && req.body.addOrRemoveItem === "add" && req.user.pendingOrder.length === 0) {

        var sub
        // FINDS SUBSCRIBER BASED ON REQUEST
        sub = await Subscriber.findById(req.user._id, function (err, docs) {
            if (err) {
                console.log(err)
            } else {
                console.log("founduser1")
            }
        }).clone()
        // console.log(sub.cart)

        //  STORES SUBSCRIBERS CART IN A VARIABLE
        const currentCart = sub.cart

        // STORES ITEM ID SENT BY FRONTEND IN A VARIABLE
        const itemId = req.body.itemId

        // FINDS THE RESTAURANT THAT HAS THE UNIQUE MENUE ITEM SELECTED BY THE USER
        let restaurant = await Restaurant.findOne({
                'menue': {
                    $elemMatch: {
                        '_id': itemId
                    }
                }
            },
            function (err, docs) {
                if (err) {
                    console.log(err)
                } else {
                    // console.log("found restaurant")
                    // console.log(docs.menue)
                }
            }
        ).clone();

        // console.log(menueItem)



        function addCartItem() {
            const item = restaurant.menue;
            for (let i = 0; i < item.length; i++) {
                if (item[i].id === itemId) {
                    menueItem = item[i]
                }
            }
            // console.log(menueItem)
            // CREATES NEW CART ITEM VARIABLE FROM PULLED MENUEITEM
            let newCartItem = {
                name: menueItem.name,
                price: menueItem.price,
                description: menueItem.description,
                categories: menueItem.categories,
                rating: menueItem.rating,
                restaurantname: menueItem.restaurantname
            }

            console.log(newCartItem)
            console.log("function called")

            // PUSHES NEW CART ITEM INTO THE SUBSCRIBERS CART AND GENERATES A NEW UNIQUE OBJECT ID (THIS IS SO THAT THE USER CAN REMOVE UNIQUES ITEMS FROM THEIR CART EVEN IF ITS A DUPLICATE MENUE ITEM)
            currentCart.push(newCartItem)

        }
        console.log("im here")
        console.log(restaurant)
        // console.log(currentCart[0].restaurantname)
        // console.log(restaurant.title)
        // GOES THROUGH FOUND RESTAURANTS MENUE AND STORES THE CORRECT MENUE ITEM IN A VARIABLE BASED ON ITS OBJECT ID 
        if (restaurant) {
            console.log("im working")

            if (currentCart[0] === undefined) {
                 console.log("right here 1")
                addCartItem()
               
            } else if (restaurant.title === currentCart[0].restaurantname) {
                console.log("right here")
                addCartItem()
            } else if (restaurant.title != currentCart[0].restaurantname) {
                console.log("right here 2")
                wrongRest = true
            }

        } else if (!restaurant) {
            noItem = true

        } 

        console.log(noItem)
        console.log(wrongRest)

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
        const cartItemId = req.body.itemId
        await Subscriber.updateOne({
            _id: sub._id
        }, {
            $pull: {
                cart: {
                    _id: cartItemId
                }
            }
        })
    } else   {

         existingPendingOrder =true
        console.log("not reading")
    }

    console.log(wrongRest)
    console.log(noItem)
    console.log(existingPendingOrder)

    try {
        // console.log(menueItem)
        // SAVES THE CHANGES IN THE SUBSCRIBERS COLLECTION
         console.log("here")
        if (wrongRest === false && noItem === false && existingPendingOrder === false) {
           
            const updatedSubscriber = await sub.save()
            res.json(updatedSubscriber)
            // THROWS ERROR IF BAD REQUEST
        } else if (wrongRest === true) {
            res.status(404).json(
                "you are trying to add an item from a different restuarant to your cart"
            )


        }else if (noItem === true){
            res.status(404).json(
                "item does not exist"
            )
        }else if (existingPendingOrder === true){
            res.status(404).json(
                "please complete or cancel your last order before starting a new one"
            )
        }
    } catch (err) {
        console.log(err)
    }

});

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



router.get("/getpaymentmethods", async (req, res) => {
    if (req.isAuthenticated()) {
        const stripeCustomerId = req.user.stripeCustId
        const customer = await stripe.customers.retrieve(stripeCustomerId)
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card',
        })
        try {
            res.json({
                paymentMethods
            })
        } catch (e) {
            console.log(e)
        };
    }
})

router.post("/editpaymentmethods", async (req, res) => {
    if (req.isAuthenticated()) {

        const subCard = req.body.card
        const subBillingDetails = req.body.billingdetails
        const intendedAction = req.body.intendedaction
        const paymentMethodRemove = req.body.paymentmethod
        const stripeCustomerId = req.user.stripeCustId
        

        console.log("stripe customer id", stripeCustomerId)

        const customer = await stripe.customers.retrieve(stripeCustomerId)

        console.log("customer id", customer)


        if (intendedAction === "addcard") {
            const paymentMethod = await stripe.paymentMethods.create({
                type: "card",
                card: {
                    number: subCard.number,
                    exp_month: subCard.exp_month,
                    exp_year: subCard.exp_year,
                    cvc: subCard.cvc
                },
                billing_details: subBillingDetails,

            });

            const attachedPaymentMethod = await stripe.paymentMethods.attach(
                paymentMethod.id, {
                    customer: customer.id
                }
            );

            console.log("payment method", attachedPaymentMethod);
            res.json({
                attachedPaymentMethod,
            });

        } else if (intendedAction === "deletecard") {
            const removedpaymentMethod = await stripe.paymentMethods.detach(
                paymentMethodRemove
            )

            res.json({
                removedpaymentMethod
            });
        }

    }

});


router.post("/create-payment-intent", async (req, res) => {
    if (req.isAuthenticated()) {

        // NEEDS TO BE BEEFED OUT WITH MORE ORDER DETAIL
        const {
            paymentMethodType,
            currency,
        } = req.body

        console.log(req.user._id)
        const paymentIntent = await stripe.paymentIntents.create({
            payment_method_types: [paymentMethodType],
            amount: 2000,
            currency: currency,
            receipt_email: req.user.email




        });
        try {

console.log(paymentIntent.client_secret)
            res.json({
                clientSecret: paymentIntent.client_secret,

            });

        } catch (e) {
            console.log("its my bitch ass")
            res.status(401).json({
                error: {
                    message: e.message
                }
            });
        }
    }



    //    console.log(req.body.paymentMethodType)



});

router.post(
    "/webhook",
    bodyParser.raw({
        type: "application/json"
    }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;
        // console.log("type", typeof sig)
        // console.log("type", typeof req.body)
        try {
            // console.log("request", req)
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            // console.log(event)
        } catch (err) {
            console.log(`❌ Error message: ${err.message}`);
            return res.status(400).send(`webhook Error: ${err.message}`);
        }
        console.log("✅ Success:", event.id);
        console.log("event object", event.data.object)
        if (event.type === "payment_intent.created") {
            const paymentIntent = event.data.object;
            console.log(`[${event.id}] PaymentIntent (${paymentIntent.id}):${paymentIntent.status}`);
            res.json({
                recieved: true
            });
        } else if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;

            console.log("payment intent", paymentIntent.receipt_email)

            const sub = await Subscriber.findOne({
                email: paymentIntent.receipt_email
            }, function (err, docs) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("founduser")
                }

            }).clone()

            console.log(sub)

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

            pendingOrder[0].confirmed = true

            await subOrderHistory.push(pendingOrder[0]);


            mainOrder.confirmed = true

            pendingOrder.splice(0, pendingOrder.length);
            const updatedOrder = await mainOrder.save()
            const updatedSub = await sub.save()

            res.json({
                recieved: true
            });
        }


    })


router.get("/config", async (req, res) => {
    res.json({
        publishablekey: process.env.STRIPE_PUBLISHABLE_KEY
    });
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

        pendingOrder[0].confirmed = true


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
router.get("/:id", getSubscriber, (req, res) => {
    res.json(res.subscriber)
});

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

    const customer = await stripe.customers.create({
        name: req.body.username,
        email: req.body.email
    });

    console.log("customer", customer)

    Subscriber.register({
        username: req.body.username,
        email: req.body.email,
        stripeCustId: customer.id

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