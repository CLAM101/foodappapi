const express = require("express");
const router = express.Router();
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const Driver = require("../models/driver");
const Subscriber = require("../models/subscriber");
const Restaurant = require("../models/restaurant");
const Order = require("../models/order");

// LOCAL STRATEGY FOR DRIVER MONGOOSE MODEL
passport.use("drivelocal", new LocalStrategy(Driver.authenticate()));

// TEST ROUTE
router.get("/test", checkAuthentication, authRole("drive"), (req, res) => {
  res.json("working");
});


// verifys logged status for persistance of logged state
router.post(
  "/logStatusCheck",
  checkAuthentication,
  authRole,
  async (req, res) => {
    res.json(true);
  }
);


// verifys drivers logged in status and order eligability based on proximity to restaurant
router.post("/isloggedin", checkAuthentication, async (req, res) => {
  console.log("request data", req.user instanceof Driver);
  console.log("request body is logged in", req.body)
  if (req.user instanceof Driver) {
    res.json(true);
  } else {
    res.json(false);
  }
});

// ROUTE FOR DRIVER TO INDECATE COMPLETION OF AND ORDER
router.post(
  "/order-completed",
  checkAuthentication,
  authRole("drive"),
  async (req, res) => {
    // ORDER ID PASSED IN WHEN DRIVER CLICKS COMPLETE ORDER
    const orderId = req.body.orderId;

    // FINDS RELEVANT DRIVER BASED ON USER ID IN COOKIE AND STORES DRIVER IN VARIABLE
    const driver = await Driver.findById(req.user._id, function (err, user) {
      if (err) {
        console.log(err);
      } else {
        console.log("found user", user);
      }
    }).clone();

    console.log("driver", driver);

    // STORES DRIVERS ACTIVE ORDER IN A VARIABLE
    const driverActiveOrder = driver.activeOrder[0];

    //CHANGES STATUS OF THE DRIVERS ACTIVE ORDER TO "COMPLETED"
    driverActiveOrder["status"] = "completed";

    //STORES THE DRIVERS COMPLETED ORDERS ARRAY IN A VARIABLE
    const driverCompletedOrders = driver.completedOrders;

    // PUSHED THE ORDER INTO THE DRIVERS COMPLETED ORDERS ARRAY
    driverCompletedOrders.push(driverActiveOrder);

    //FINDS AND STORES THE SUBSCRIBER RELEVANT TO THE ORDER IN A VARIABLE
    const sub = await Subscriber.findById(
      driverActiveOrder.userID,
      (err, sub) => {
        if (err) {
          console.log(err);
        } else {
          console.log("found sub", sub);
        }
      }
    ).clone();

    console.log("subscriber", sub);

    // STORES THE SUBSCRIBERS PENDING ORDERS ARRAY IN A VARIABLE
    const pendingOrders = sub.pendingOrder;

    console.log("pendingOrders", pendingOrders);

    let subPendOrder;

    // FILTERS THROUGH THE SUBS PENDING ORDERS ARRAY TO FIND THE RELEVANT PENDING ORDER
    pendingOrders.filter(function checkOption(option) {
      if (option.id === orderId) {
        subPendOrder = option;
      }
    });

    // STORES THE SUBS ORDER HISTORY IN A VARIABLE
    const subOrderHist = sub.orderHistory;

    console.log("sub order history", subOrderHist);

    // ADJSUTS THE SUBS PENDING ORDERS STATUS TO "COMPLETED"
    subPendOrder["status"] = "completed";

    // PUSHES THE NEWLY COMPLETED ORDER INTO THE SUBS ORDER HISTORY
    subOrderHist.push(subPendOrder);

    // SAVES THE UPDATED SUBSCRIBER IN DB
    const updatedSub = await sub.save();

    console.log(
      "active order driver",
      req.user.activeOrder[0].items[0].restaurantname
    );

    // FINDS AND STORES THE RELEVANT RESTAURANT IN A VARIABLE
    const restaurant = await Restaurant.findOne(
      {
        title: req.user.activeOrder[0].items[0].restaurantname,
      },
      function (err, rest) {
        if (err) {
          console.log(err);
        } else {
          console.log("foound rest", rest);
        }
      }
    ).clone();

    console.log("restaurant", restaurant);

    //STORES THE RESTAURANTS ACTIVE ORDERS ARRAY IN A VARIABLE
    const restActiveOrders = restaurant.activeOrders;

    // STORES THE RESTAURANTS COMPLETED ORDERS ARRAY IN A VARIABLE
    const restCompletedOrders = restaurant.completedOrders;

    console.log("rest active orders", restActiveOrders);

    let restActiveOrder;

    // FILTERS THROUGH THE RESTAURANTS ACRIVE ORERS ARRAY TO FIND THE RELEVANT ORDER
    restActiveOrders.filter((option) => {
      if (option.id === orderId) {
        restActiveOrder = option;
      }
    });

    // CHANGES THE STATUS OF THE ORDER TO "COMPLETED"
    restActiveOrder["status"] = "completed";

    // PUSHES THE NEWLY COMPLETED ORER INTO THE RESTAURANTS COMPLETED ORDERS ARRAY
    restCompletedOrders.push(restActiveOrder);

    // SAVES THE UPDATED RESTAURANT IN DB
    const updatedRestaurant = await restaurant.save();

    // SAVES THE UPDATED DRIVER IN DB
    const updatedDriver = await driver.save();

    console.log("driver id for driver update", driver._id);

    //REMOVES THE COMPLETED ORDER FROM THE DRIVERS ACTIVE ORDER ARRAY
    await Driver.updateOne(
      {
        _id: driver._id,
      },
      {
        $pull: {
          activeOrder: {
            _id: orderId,
          },
        },
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully updated driver", docs);
        }
      }
    ).clone();

    // CHANGES THE MAIN ORDER IN THE ORDERS COLELCTION STATUS TO "COMPLETED"
    console.log("order ID for order update", orderId);
    await Order.updateOne(
      {
        _id: orderId,
      },
      {
        status: "completed",
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("Updated Order", docs);
        }
      }
    ).clone();

    //  REMOVES THE COMPLETED ORDER FROM THE RESTAURANTS ACTIVE ORDERS ARRAY
    console.log(
      "restaurant name for retaurant update",
      restActiveOrder.items[0].restaurantname
    );
    await Restaurant.updateOne(
      {
        title: restActiveOrder.items[0].restaurantname,
      },
      {
        $pull: {
          activeOrders: {
            _id: orderId,
          },
        },
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("sucessfully updated restaurant", docs);
        }
      }
    ).clone();

    // REMOVES THE COMPLETED ORDER FROM THE SUBSCRIBERS PENDING ORDERS ARRAY
    console.log(
      "subscriber user id for sub update",
      req.user.activeOrder[0].userID
    );
    await Subscriber.updateOne(
      {
        _id: req.user.activeOrder[0].userID,
      },
      {
        $pull: {
          pendingOrder: {
            _id: orderId,
          },
        },
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("sucessfully updated subsriber", docs);
        }
      }
    ).clone();

    try {
      // RESPONDS WITH ALL UPDATES COMPLETED
      res.json(updatedRestaurant, updatedSub, updatedDriver);
      // CATCHES ANY ERRORS LOGS THEM AND SEND ERRORS TO CLIENT
    } catch (e) {
      console.log(e);
      res.json(e);
    }
  }
);
// endpoint for driver to accept or decline a new order that has come in, this will be attached to a button brought up by pusher on the client sidde, the button will hit this endpoint.
router.post(
  "/accept-or-decline",
  checkAuthentication,
  authRole("drive"),
  async (req, res) => {
    // uder id passed in from client side
    const orderId = req.body.orderId;

    console.log("user input orderId", orderId, "user id", req.user._id);

    // finds the logged in driver
    const driver = await Driver.findById(req.user._id, function (err, user) {
      if (err) {
        console.log(err);
      } else {
        console.log("found user", user);
      }
    }).clone();

    console.log("driver", driver);

    //finds the order in question
    const availOrder = await Order.findById(orderId, (err, item) => {
      if (err) {
        console.log(err);
      } else {
        console.log("found order", item);
      }
    }).clone();

    console.log(
      "avail order",
      availOrder,
      "avail order items",
      availOrder.items[0].restaurantname
    );

    // findes the restaurant the order is attached to
    const restaurant = await Restaurant.findOne(
      {
        title: availOrder.items[0].restaurantname,
      },
      function (err, rest) {
        if (err) {
          console.log(err);
        } else {
          console.log("foound rest", rest);
        }
      }
    ).clone();

    console.log("restaurant", restaurant);

    // strores the retrieved acetive orders fro, the above retireived restaurant
    const restActiveOrders = restaurant.activeOrders;

    console.log("rest active orders", restActiveOrders);

    let restActiveOrder;

    // filters through retreived active orders to find the specidied order
    restActiveOrders.filter((option) => {
      if (option.id === orderId) {
        restActiveOrder = option;
      }
    });

    // changes the status of the order to "out for delivery" after the driver accepts the order, may consider adjsuting this and adding another milestone for when the driver physically picks up the order
    restActiveOrder["status"] = "driver on way to collect";

    //  finds the subscriber the order in question was made by
    const sub = await Subscriber.findById(availOrder.userID, (err, sub) => {
      if (err) {
        console.log(err);
      } else {
        console.log("found sub", sub);
      }
    }).clone();

    const pendingOrders = sub.pendingOrder;

    let subPendOrder;

    // finds the order in question unders the subs pending orders
    pendingOrders.filter(function checkOption(option) {
      if (option.id === orderId) {
        subPendOrder = option;
      }
    });

    console.log("found driver", driver);
    console.log("sub pend order", subPendOrder);

    // changes the status of the order for the drive and the subscriber as well
    availOrder["status"] = "driver on way to collect";
    subPendOrder["status"] = "driver on way to collect";

    // psuhes the order into the drivers active orders
    driver.activeOrder.push(availOrder);

    try {
      // saves all changes to DB and provides a response to the client
      const updatedRest = await restaurant.save();
      const updatedOrder = await availOrder.save();
      const updatedDriver = await driver.save();
      const updatedSub = await sub.save();

      res.json({
        updatedDriver,
        updatedOrder,
        updatedSub,
        updatedRest,
      });
    } catch (e) {
      res.json(e);
    }
  }
);

// LOGIN USING PASSPORT JS logs in the driver
router.post("/login", (req, res) => {
  console.log("driver login called");

  const driver = new Driver({
    username: req.body.username,
    password: req.body.password,
    //  email: req.body.email,
  });
  req.login(driver, async function (err) {
    if (err) {
      console.log(err);
    } else {
      try {
        passport.authenticate("drivelocal")(req, res, function () {
          console.log("Authenticated");
          // console.log(req)
          res.status(201).json(req.user);
        });
      } catch (err) {
        console.log("error on driver login", err);
        res.status(400).json({
          message: err.message,
        });
      }
    }
  });
});

router.post("/logout", async function (req, res, next) {
  console.log("logout user", req.user);

  try {
    req.logOut(req.user, function (err) {
      if (err) {
        console.log("error", err);
        return next(err);
      }
    });
  } catch (e) {
    console.log(e);
  }

  res.json(req.isAuthenticated());
  console.log("logout called");
});


// test endpoint for restaurants route
router.post("/test", checkAuthentication, (req, res) => {
  console.log("hello");
});

// RANDOM ORDER FILTER/GENERATOR
router.get("/randomorder", async (req, res) => {
  //USERS CHOSEN CATEGORIES SPH & NOP SENT THROUGH THE REQUEST
  const restCats = req.body.restcategories;
  const menuCats = req.body.menucats;
  var totalSpend = req.body.totalspend;
  const numberOfHeads = req.body.numberofheads;
  const spendPerHead = totalSpend / numberOfHeads;

  // console.log(spendPerHead)

  let restOptions = await Restaurant.aggregate([
    {
      $match: {
        categories: {
          $in: restCats,
        },
      },
    },
  ]);

  // console.log(restOptions)

  let eligbleRestOptions = [];

  // filters through restaurant options and spits put options that match the cosen paramaters sent by the client
  for (let i = 0; i < restOptions.length; i++) {
    restOptions[i].menu.filter(function checkOptions(option) {
      // console.log(option)

      for (let x = 0; x < option.categories.length; x++) {
        if (
          option.categories[x] === menuCats[0] ||
          option.categories[x] === menuCats[1] ||
          option.categories[x] === menuCats[2] ||
          option.categories[x] === menuCats[3] ||
          option.categories[x] === menuCats[4] ||
          option.categories[x] === menuCats[5] ||
          option.categories[x] === menuCats[6]
        ) {
          eligbleRestOptions.push(restOptions[i]);
        }
      }
    });
  }

  console.log(eligbleRestOptions);

  //STORES FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND menu ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES
  let randomRestOption =
    eligbleRestOptions[Math.floor(Math.random() * restOptions.length)];

  // console.log(randomRestOption.categories)

  //RESULT OF ALL menu ITEMS MATCHING USER CATEGORIES
  let menuOptions = [];

  // console.log(randomRestOption)

  // console.log(randomRestOption)

  // LOOPS THROUGH ALL RESTURANT OPTIONS MENUS AND OUTPUTS MENU  ITEMS MATCHING THE USERS CHOSEN CATEGORIES
  await randomRestOption.menu.filter(function checkoptions(option) {
    for (let x = 0; x < option.categories.length; x++) {
      // console.log(option)
      if (
        option.categories[x] === menuCats[0] ||
        option.categories[x] === menuCats[1] ||
        option.categories[x] === menuCats[2] ||
        option.categories[x] === menuCats[3] ||
        option.categories[x] === menuCats[4] ||
        option.categories[x] === menuCats[5] ||
        option.categories[x] === menuCats[6]
      ) {
        // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
        if (option.price <= spendPerHead) {
          menuOptions.push(option);
        } else if (spendPerHead === undefined) {
          menuOptions.push(option);
        }
      }
    }
  });

  // defines a start time for random order generator to run
  const startingTime = Date.now();

  // defnes how long the generator will run for these two paramater avoid an infinite loop encase there is not enough data to fill the random order result
  const timeTocancel = 4000;

  // console.log(menuOptions)

  let randomOrder = [];

  // will run the loop until number of heads is less than or equal to the random order result length
  while (randomOrder.length < numberOfHeads) {
    const currentTime = Date.now();

    // console.log(keepCalling)

    // will randomply spit out a menue option of the retireved elligble menue options
    let randommenuOption = await menuOptions[
      Math.floor(Math.random() * menuOptions.length)
    ];

    // console.log(randommenuOption)

    // will check to see if the random menue option is a duplicate of any options already in the random order result
    function checkDuplicates() {
      let duplicate = "";
      let itemName = randommenuOption.name;
      // console.log(itemName)
      for (let i = 0; i < randomOrder.length; i++) {
        if (itemName === randomOrder[i].name) {
          duplicate = "duplicate";
        }
        // console.log("loop running")
      }
      // console.log(randomOrder)
      return duplicate;
    }

    let checkduplicate = checkDuplicates();

    // will break the loop if its been running for longer than 4 seconds and hasnt filled the number of heads requirement
    if (currentTime - startingTime >= timeTocancel) break;

    if (checkduplicate === "duplicate") {
      // console.log("Found Duplicate")
    } else {
      randomOrder.push(randommenuOption);
    }
    randomOrder.length;
    // console.log(randommenuOption)
  }

  // console.log(spendPerHead)
  try {
    res.status(201).send({
      randomOrder,
    });
  } catch (err) {
    console.log(err);
  }
});

// GENERAL FILTER
router.get("/filter", async (req, res) => {
  //USERS CHOSEN CATEGORIES SPH & NOP SENT THROUGH THE REQUEST
  const restCats = await req.body.restcategories;
  const menuCats = await req.body.menucats;
  var spendPerHead = await req.body.spendperhead;

  // RETURNS ONLY RESTURANT OPTIONS WITH CATEGORIES CONTAINING AT LEAST ONE OPTION IN THE USERS REQUESTED CATEGORIES
  let restOptions = await Restaurant.aggregate([
    {
      $match: {
        categories: {
          $in: restCats,
        },
      },
    },
  ]);
  //RESULT OF ALL menu ITEMS MATCHING USER CATEGORIES
  let menuOptions = [];

  //FULL RESULT OF BOTH RESTURANTS MATCHING USERS CHOSEN CATEGORIES AND menu ITEMS OF THOSE RESTURANTS MATCHING USERS CATEGORIES

  // LOOPS THROUGH ALL RESTURANT OPTIONS menuS AND OUTPUTS menu ITEMS MATCHING THE USERS CHOSEN CATEGORIES
  for (let i = 0; i < restOptions.length; i++) {
    restOptions[i].menu.filter(function checkOptions(option) {
      for (let x = 0; x < option.categories.length; x++) {
        if (
          option.categories[x] === menuCats[0] ||
          option.categories[x] === menuCats[1] ||
          option.categories[x] === menuCats[2] ||
          option.categories[x] === menuCats[3] ||
          option.categories[x] === menuCats[4] ||
          option.categories[x] === menuCats[5] ||
          option.categories[x] === menuCats[6]
        ) {
          // FILTERS RESULTS BASED ON TOTAL SPEND PER HEAD CHOSEN BY USER
          if (option.price <= spendPerHead) {
            menuOptions.push(option);
          } else if (spendPerHead === undefined) {
            menuOptions.push(option);
          }
        }
      }
    });
  }

  // console.log(result)
  try {
    // position 0 == menu option result position 1 == resturant options result

    // sends rest options and menue options result back to client
    res.status(201).send({
      menuOptions,
      restOptions,
    });
  } catch (err) {
    if (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
});

// Getting All
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// REGISTER USING PASSPORT JS registers a new driver
router.post("/register", async (req, res) => {
  Driver.register(
    {
      username: req.body.username,
      email: req.body.email,
    },
    req.body.password,
    async (err, driver) => {
      if (err) {
        console.log(err);
      } else {
        try {
          await passport.authenticate("drivelocal")(req, res, function () {
            console.log("is authenticated");
            res.status(201).json(newDriver);
          });
          const newDriver = await driver.save();
        } catch (err) {
          res.status(400).json({
            message: err.message,
          });
        }
      }
    }
  );
});

// function for checking logged in status of drivers
function checkAuthentication(req, res, next) {
  // console.log("request body sub", req.user)
  if (req.isAuthenticated()) {
    //req.isAuthenticated() will return true if user is logged in
    console.log("authenticated");
    next();
  } else {
    res.json("Please log in");
  }
}

// checks role of the user limiting access to certain endpoints based on user type
function authRole(role) {
  return (req, res, next) => {
    //     console.log("auth role user type", req.user instanceof Subscriber)
    if (req.user instanceof Subscriber && role === "sub") {
      next();
      console.log("correct role sub");
    } else if (req.user instanceof Restaurant && role === "rest") {
      next();
      console.log("correct role rest");
    } else if (req.user instanceof Driver && role === "drive") {
      next();
    } else {
      res.status(401);
      return res.send("wrong role acccess denied");
    }
  };
}


// finds order in restaurants active orders based on rest ID and order ID
async function checkForOrder(inputs) {
  console.log("inputs in check for order", inputs);
  let rest;

  try {
    rest = await Restaurant.findById(inputs.restId, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        console.log("founduser");
        console.log("docs", docs);
      }
    }).clone();
    console.log("restaurant", rest);

    // stroes retrieved active orders
    let activeOrders = rest.activeOrders;
    let orderToChange;

    console.log("active orders check for order", activeOrders);

    // fiters active orders to find the relevant order based on order id sent in request by client
    activeOrders.filter(function checkOption(option) {
      if (option.id === inputs.orderId) {
        orderToChange = option;
      }
    });

    return {
      orderToChange: orderToChange,
      rest: rest,
    };
  } catch (e) {
    console.log("catch error", e);
  }
}

module.exports = router;
