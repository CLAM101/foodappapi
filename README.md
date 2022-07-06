# Food delivery app backend Node.js REST API 

## Backend API for my food delivery web & mobile app project

## This API has the following functionality built in so far 

•	CRUD operations for Subscribers, Restaurants & Orders.

•	Local MongoDB database with mongoose

•	Restaurant, menu filters & random order generator

•	Google, Facebook O Auth and standard Passport JS Auth and cookie functionality.

•	User cart functionality, Order creation & confirmation

•	Fully Dockized the project.

•	Built and deployed an NPM package to generate/ seed restaurants into my DB.

•	Initial Stripe backend integration 

## The API has the following functionality still to be built (this is a growing list)

•	User wallet and wallet funding functionality (Stripe)

stripe to add:

more detailed payment intent data

if elses for different payment methods, refunds, cancelations etc

order cancelation

refunds

store cards for future payments

•	Passport JS auth for Restaurants (some ruotes still to be completed)

•	Driver interface and management (CRUD, order management, payment tracking, navigation)

•	Subscribers (order tracking, driver comms, maps data, CC payments, wallet functionality, location tracking, on/offline status, favorites)

•	Restaurant interface (Profile/menu/promotions management, order tracking and management, driver communication and tracking, open/closed status)

•	Update seeder to seed all required data for testing (locations, subscriber data, random orders, random menu items etc)

•	Subscriber favorites algorithm 

•	Promotions wheel

•	Restaurant leaderboards

•	Basic analytics dashboard for app admin, drivers and restaurants

•	Restaurant, Subscriber and Driver profile settings

•	Search functionality

## Breakdown of previous commits

## 17th June commit

(restaurants/filter) Removed SPH duplication functionality for a later iteration, needs multi user identification when creating the order to serve up the data effectively. 

(seeder/populaterestdb) Updated price and rating generation to faker datatype rather than numberic as banned digits functionality was not working resulting in ratings above 5 and prices below the specified 20 limit

(restaurant model) updated restaurantSchema to include date of creation, added restaurant name key to menueitem schema to enable differentiation of menueitems from various restaurants

(seeder/populaterestdb) included function to check for duplicates and only push non duplicate random menue options into the menue items array, resulting in restaurants with menues free of duplicate items. 



## 5th July 2022 commit

(seeder) fixed bug where random restaurant generator was being called multiple times for each piece of restaurant detail

router.patch(/restaurants/:id) Added if statement checking menue item category before restaurant user is allowed to add item to menue

(restaurants) removed junk code for test route

(restaurants) Random order filter added

(restaurants) main filter completed

passport js added for restaurant registration (still needs to be added for other routes)

subscribers/editcart -changed cart edit to check for item in DB by Object ID,
also allows for removal of item from cart using unique ID  

added checker to confirm item being added is not from a different restaurant to the first item added to cart 

created an if else to prevent items being added to cart if a pendign order exists 

.env: updated .env with FB, Google, and stripe secrets, also updated DB name from "subscribers" to "foodapp" 

subscribers route: added initial Stripe basic payment functionality 



# additional info

This proejct is fully dockerized, use docker compose to run in your local environment (I am aware of a bug where npm CI stated in the dockerfile doesnt work, run npm I before spinning up the container should you run into any issues, I will fix this soon).

I am also aware of the mispelling of the word menu throughout the project, I plan to fix this on the next commit. 

I plan to build the frontend in React.js and React Native once the backend has been fully built out









