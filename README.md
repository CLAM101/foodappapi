17th June commit

1. (restaurants/filter) Removed SPH duplication functionality for a later iteration, needs multi user identification when creating the order to serve up the data effectively. 

2. (seeder/populaterestdb) Updated price and rating generation to faker datatype rather than numberic as banned digits functionality was not working resulting in ratings above 5 and prices below the specified 20 limit

3. (restaurant model) updated restaurantSchema to include date of creation, added restaurant name key to menueitem schema to enable differentiation of menueitems from various restaurants

4. (seeder/populaterestdb) included function to check for duplicates and only push non duplicate random menue options into the menue items array, resulting in restaurants with menues free of duplicate items. 



 commit 5th July 2022
(seeder) fixed bug where random restaurant generator was being called multiple times for each piece of restaurant detail
 router.patch(/restaurants/:id) Added if statement checking menue time category before restaurant user is allowed to add item to menue
 (restaurants) removed junk code for test route
Random order filter added
main filter completed
passport js added for restaurant registration (still needs to be added for other routes)
subscribers/editcart -
changed cart edit to check for item in DB by Object ID (complete) 
also allows for removal of item from cart using unique ID  (complete)
added checker to confirm item being added is not from a different restaurant to the first item added to cart (complete)
created an if else to prevent items being added to cart if a pendign order exists (complete)
.env: updated .env with FB, Google, and stripe secrets, also updated DB name from "subscribers" to "foodapp" (complete)
subscribers route:add initial stripe payment functionality (complete)







Stuff im working on(this is an ever growing and changing list):
stripe to add:
more detailed payment intent data
if elses for different payment methods, refunds, cancelations etc
order cancelation
refunds
store cards for future payments


Frontend 
User wallet and wallet funding functionality (ties in with stripe currently being implemented)
Passport JS auth for Restaurants
Driver interface and management (CRUD, order management, payment tracking, navigation)
Subscribers (order tracking, driver comms, maps data, CC payments, wallet functionality, location tracking, on/offline status, favourites)
Restaurant interface (Profile/menu/promotions management, order tracking and management, driver communication and tracking, open/closed status)
Update seeder to seed all required data for testing (locations, subscriber data, random orders, random menu items etc)
Subscriber favorites algorithm 
Promotions wheel
Restaurant leaderboards
Basic analytics dashboard for app admin, drivers and restaurants
Restaurant, Subscriber and Driver profile settings
Search functionality
