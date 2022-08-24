# Food delivery app backend Node.js REST API

## Backend API for my food delivery web & mobile app project


Breakdown of previous commits


## 17th June 2022 commit

(restaurants/filter) Removed SPH duplication functionality for a later iteration, needs multi user identification when creating the order to serve up the data effectively.

(seeder/populaterestdb) Updated price and rating generation to faker datatype rather than numberic as banned digits functionality was not working resulting in ratings above 5 and prices below the specified 20 limit

(restaurant model) updated restaurantSchema to include date of creation, added restaurant name key to menueitem schema to enable differentiation of menueitems from various restaurants

(seeder/populaterestdb) included function to check for duplicates and only push non duplicate random menu options into the menu items array, resulting in restaurants with menus free of duplicate items.

## 5th July 2022 commit

(seeder) fixed bug where random restaurant generator was being called multiple times for each piece of restaurant detail

router.patch(/restaurants/:id) Added if statement checking menu item category before restaurant user is allowed to add item to menu

(restaurants) removed junk code for test route

(restaurants) Random order filter added

(restaurants) main filter completed

passport js added for restaurant registration (still needs to be added for other routes)

subscribers/editcart -changed cart edit to check for item in DB by Object ID, also allows for removal of item from cart using unique ID

added checker to confirm item being added is not from a different restaurant to the first item added to cart

created an if else to prevent items being added to cart if a pending order exists

.env: updated .env with FB, Google, and stripe secrets, also updated DB name from "subscribers" to "foodapp"

subscribers route: added initial Stripe basic payment functionality

## 6th July 2022 commit 

integrated stripe functionality with passport js cookies

Stripe edit payment methods (just card for now)

Stripe get payment methods

Added stripe customer creation as part of register route

tested payment intent creation and confirmation on webhook app now updates DB once payment intent has succeeded

## 8th July 2022 commit:

created a check auth function for passport auth and implemented it across relevant subscribers and restaurant endpoints

built out payment intent data with order detail from subscriber cart

moved cart clearance to only happen on completion of payment via webhook endpoint

on order creation sub is now found by stripe customer ID and not reciept email

created a checkout endpoint where user can see all cart items and the order total

adjusted passport setup to only create strategy in each route while router handles the rest in server.js

### Total overhaul of order creation payment and confirmation (this is still in progress):

changed order confirmed key in order model to status, will now work with status "prep", "out for delivery" and "completed"
 order is now only created once payment has succeeded , the order will be pushed into orders collection with a a value of prep on the status key, restaurants active orders array for the specific restaurant and the subscribers pending orders array and will only move into the subs order history once marked "completed" in main the orders collection and removed from restaurants active orders array to completed orders array once the driver has indicated completion of the delivery.
This also allows for a user to edit their cart and create a new order even though they already have a pending order in existance allowing them to make seperate orders from seperate restaurants one after the other.

will have endpoints for the restaurants and drivers to adjsut status of orders.

Also exploring how to seperate usertype access for certain routes with passport.

## 15th July 2022 Commit:
created a role check function to separate user roles and endpoint access and applied it to all relevant routes.

fixed bug where cookie for restaurant was not being generated correctly due to response being outside of passport. authenticate callback function as well as needed if else as identifiers for user types in serialize and deserialize user functions. 

Stripe webhook now ads charge ID to subscribers pending order once charge succeeds.

added an endpoint to create a stripe refund.

added if else to web hook for successful refund, now removes order from users pending orders and places it into their order history as well as changes the orders status in orders and the subs order history to "refunded". 

Also created a postman collection which can be accessed with the below link, to test stripe functionality you will need ot make user of the stripe API postman colelction and environment along with the below foodappapi collection The collection is pretty self-explanatory with its request names but I will eventually write detailed documentation for the application.

https://www.postman.com/clam102/workspace/foodappapi-postman/collection/19940847-bd4f1670-0752-4fb2-bb94-b22124757b82?action=share&creator=19940847

Currently exploring how to make the DB real-time with pusher channels and change streams to enable real-time driver notifications, live location notifications order status notifications for users etc.

I want to finalize my plan for this implementation before I continue with the rest of the functionality for each user type as it will have a big effect on the app’s overall operation.

## 19th July 2022 commit:
added driver model and drivers route drivers can now create account, login, accept orders and mark orders as completed

restaurants can now mark orders ready for collection

DB now updates according to actions taken by the driver and restaurant

overhaul for order creation, payment and confirmation is now done on a database and server side level.

afer this commit I have begun impementing mongo changestreams and pusher to get the live database system going. I plan to create a basic react client purely for testing this functionality in its early stages. 

## 27th July 2022 Commit:
implemented basic pusher functionality on server and test client 

adjusted server to use a replica set config instead of standalone as mongoDB changestreams require replset DBs to work

Have built basic frontend for restaurant so far with pusher integrated to notify the user of subscription

built in a table and mapped retrieved active orders to it for the restaurant

Built restaurant notification and update system, restaurant now gets an alert that they have a new order and their order list automatically updates with the new order

added a button to each order row allowing restaurant to update the order status in the DB

fixed the misspelling of menu across the project, all occurences are now spelled correctly

deprecated create order endpoint in subscribers route as this is now handled by the stripe webhook in subscribers

deprecated confirm order in subscribers route as it is now handled by the stripe webhook endpoint

added basic commenting to all code on both server and test client

## 14 August 2022 commit:
Added Logout endpoint for restaurants (still need to add this for all other users)

Further built out pusher integration:

Built out endpoints to support driver pusher functionality

built out endpoints to support restaurant pusher functionality

Drivers now get alerts when orders are ready for collection

adjusted MongoDB change streams to deliver more comprehensive data

Added loggedin checks to differentiate unique users when pusher makes requests unique restaurants will only get alerts for orders and status changes related to their specific ID

Created function for finding restaurant match based on order ID, implemented across relevant endpoints and routes

Fixed bugs related to passport JS not terminating cookies/sessions correctly 

Refactored frontend test client code to be cleaner and more efficient

Added login and home functionality for drivers to test client

Before continuing with the React test client I will now explore implementing Google Maps api to handle and implement location data for effective selection of restaurants subscribers and drivers to facilitate successful orders.


##24th August 2022 commit:

Seperated out driver and mobile applications, repos for applications can be found below.

Added isLogged  endpoints for drivers and restaurants to verify their authenticated state as well as their unique user ID's and related data from pusher triggered calls.

Further built out pusher integration to support driver collection notifications resulting prompts for acceptance or decline of orders and the relevant updates on the restaurant webapp.

Now that location is implemented on the driver mobile app I will move to building in logic to check a drivers eligability based on proximity to the restaurant with an available collection before triggering an accept or decline promt to the driver.




## Additional info

Restaurant Web App https://github.com/CLAM101/restWebApp
driverMobileApp https://github.com/CLAM101/driverMobileApp
