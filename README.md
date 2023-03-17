# Restaurant-chatbot

This is a chatbot interface designed to help customers place orders for their preferred meals in a restaurant. The chatbot is designed to mimic a human-like conversation, where customers can select options to navigate through the ordering process.

## Getting Started

To get started with the chatbot, simply clone the repository,
run `npm install` in the terminal and open the index.html file in your browser. The chatbot interface will be displayed, and you can start interacting with it.

## Features

The chatbot interface allows customers to perform the following actions:

Place an order: When a customer selects "1", the chatbot will return a list of items from the restaurant, and the customer can select their preferred item from the list using the number select system.
Checkout order: When a customer selects "99", the chatbot will respond with "order placed" if there is an order to place. Otherwise, the chatbot will respond with "No order to place". Customers can also see an option to place a new order.
View order history: When a customer selects "98", the chatbot will return all placed orders.
View current order: When a customer selects "97", the chatbot will return the current order.
Cancel order: When a customer selects "0", the chatbot will cancel the order if there is one.
Session Management

The chatbot is designed to store user session based on devices, so customers can resume their orders from where they left off even if they switch devices.

Customization

The chatbot is designed to be customizable, so you can easily modify the options and items to suit your restaurant's menu.

## Built With

HTML
CSS
JavaScript
Nodejs 

## Acknowledgments

This chatbot is inspired by AltSchool, courtesy of tutor's relentless efforts to teaching us the use of web socket.
