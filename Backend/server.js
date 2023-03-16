const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');
const app = express();
const server = http.createServer(app);
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const io = new Server(server);
const formatMessage = require('./utils/messages');
const connectToDb = require('./dbConfig/db'); // Connect to MongoDB
const Order = require('./models/orderModel');
const LocalStorage = require('node-localstorage').LocalStorage,
	localStorage = new LocalStorage('./scratch');
require('dotenv').config();

connectToDb();

app.use(bodyParser.urlencoded({ extended: true }));

//session configuration
const sessionMiddleware = session({
	secret: process.env.SESSION_SECRET || 'SomethingSecret',
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false,
		//set expiry time for session to 7 days
		// maxAge: 1000 * 60 * 60 * 24 * 7,
		maxAge: 120000,
	},
});
const bot = 'foodBot';

app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);


io.on('connection', (socket) => {
	const request = socket.request;
	console.log(`A user connected ${request.session.id} * ${socket.id}`);
	// console.log('a user connected');

	// Define menu orderMenu
	const menuItems = [
		{ id: 1, name: 'Burger', price: '₦4000' },
		{ id: 2, name: 'Pizza', price: '₦5000' },
		{ id: 3, name: 'Salad', price: '₦3000' },
		{ id: 4, name: 'Rice', price: '₦2500' },
		{ id: 5, name: 'Beans', price: '₦1500' },
		{ id: 6, name: 'Pasta', price: '₦1000' },
	];

	// let name = '';
	let progress = 0;
	//get the session id from the socket
	const session = socket.request.session;
	const sessionId = session.id;
	// console.log(sessionId);

	// DB Related functions.
	async function addOrderToDB(userId, items, total) {
    const order = {
      user_id: sessionId,
      items: items,
      total: total
    };
	try {
		// Insert order into database
		await Order.create(order);
		console.log('Order added to DB');
	} catch (err) {
		console.error(err);
	}
	return res.json({ status: true, order })
		
  }

    // Get all orders for a given user ID = sessionId
	async function getOrdersForUser(sessionId) {
		const query = { user_id: sessionId };
		return Order.find(query).toArray();
	  }

   // Get the user's order history
   async function getOrderHistory(session) {
    if (!session.userOrder) {
      // User does not have a session order.
      return [];
    }
    // Get the user's ID from their session
    // const userId = session.user.id;
    // Get all orders for the user from the database
    return getOrdersForUser(sessionId);
  }

	//join the socket to the session id
	socket.join(sessionId);
	// console.log(`User connected with sessionId ${sessionId}`);

	io.to(sessionId).emit(
		'chat message',
		formatMessage(
			'bot',
			`Hey It's good to have you here! <br> What's your name?`
		)
	);

	//listen for the chat message event from the client
	socket.on('chat message', (message) => {
		console.log(message);
		//output the user message to the DOM by emitting the chat message event to the client
		io.to(sessionId).emit('chat message', formatMessage('USER', `${message}`));
		let inputNumber = parseInt(message);

		switch (progress) {
			case 0:
				io.to(sessionId).emit(
					'chat message',
					formatMessage('bot', `Hello ${message} Welcome to the foodBot!!`)
				);

				io.to(sessionId).emit(
					'chat message',
					formatMessage(
						'bot',
						`Please select an item to get started: <br>
                        👉Select 1 to Place your order
                        <br />
                        👉Select 99 to checkout your order
                        <br />
                        👉Select 98 to see your order history
                        <br />
                        👉Select 97 to see your current order
                        <br />
                        👉Select 0 to cancel your order
                        <br />`
					)
				);

				progress = 1;
				break;
			case 1:
				//the user has selected an option, so we check which option they selected and
				// Return list of menu item names
				let itemOptions = '';
				menuItems.forEach((item, index) => {
					itemOptions += `${index + 1}. ${item.name}\n`;
				});

				if (inputNumber === 1) {
					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Select a number to place order. <br> Here is the menu: <br> ${itemOptions}\n`
						)
					);

					progress = 2;
					return;
				} else if (inputNumber === 99) {
					

					// Create an object representing the user's order
					const userOrder = {
						items: [],
						total: '',
					};

					// Convert the userOrder.items array to a string
					const itemsString = JSON.stringify(userOrder.items);
					const selectedItem = menuItems.find(
						(item) => item.id === inputNumber
					);

					// Add the selected item to the userOrder.items array

					if (selectedItem) {
						userOrder.items.push(selectedItem.name);
						userOrder.total += selectedItem.price;
					}
					// Where we begin.
					// Convert the userOrder.items array to a string
					const userOrderToJSON = JSON.stringify(userOrder);


					// Retrieve the JSON string from local storage
					const userOrderJSON = localStorage.getItem('userOrder');

					// Convert the JSON string back to an object
					const savedUserOrder = JSON.parse(userOrderJSON);
					console.log(savedUserOrder);

					io.to(sessionId).emit(
						'chat message',
						formatMessage('bot', `Your order has been placed successfully <br>`)
					);
					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Please select an item to continue: <br>
								👉Select 1 to Place your order
								<br />
								👉Select 99 to checkout your order
								<br />
								👉Select 98 to see your order history
								<br />
								👉Select 97 to see your current order
								<br />
								👉Select 0 to cancel your order
								<br />`
						)
					);

					progress = 1;
				} else if (inputNumber === 98) {
					// LOGIC FOR ORDER HISTORY
					// Check if user has an active session order.
					if(session.userOrder) {
						// Get the current user's order from their session
						const order = session.userOrder.items;
						// Display the order data
						console.log(order);}
					 else if (session.userOrder.items.length === 0) {
					   // User does not have an active order
					   io.to(sessionId).emit(
						   'chat message',
						   formatMessage('bot', `You do not have any order yet`)
					   );
					   
				   }
						
					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Here's your order history:<br>
							Item:${session.userOrder.items} <br>`
						)
					);

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Please select an item to continue: <br>
								👉Select 1 to Place your order
								<br />
								👉Select 99 to checkout your order
								<br />
								👉Select 98 to see your order history
								<br />
								👉Select 97 to see your current order
								<br />
								👉Select 0 to cancel your order
								<br />`
						)
					);
	
					return progress = 1;
					// DISPLAY ORDER HISTORY
					// function handleGetOrderHistory(socket) {
					// 	const session = socket.request.session;
					// 	const orderHistory = getOrderHistory(session);
					// 	if (orderHistory.length === 0) {
					// 	  // User has no orders
					// 	  socket.emit('chat message', formatMessage('bot', 'You have no order history'));
					// 	} else {
					// 	  // User has orders
					// 	  const orderHistoryMsg = orderHistory.map(order => `Order ID: ${order._id}, Items: ${order.items}, Total: ${order.total}`).join('<br>');
					// 	  socket.emit('chat message', formatMessage('bot', `Here is your order history:<br>${orderHistoryMsg}`));
					// 	}
					//   }

					// io.to(sessionId).emit(
					// 	'chat message',
					// 	formatMessage(
					// 		'bot',
					// 		`Here is your order history: <br> ${session.userOrder.items} <br> Total: ${session.userOrder.total}`
						// )
					// );
				} else if (inputNumber === 97) {
					// Logic here to see current order

					// Check if user has an active session order.
					if(session.userOrder) {
						// Get the current user's order from their session
						const order = session.userOrder.items;
						// Display the order data
						console.log(order);}
					 else if (session.userOrder.items.length === 0) {
					   // User does not have an active order
					   io.to(sessionId).emit(
						   'chat message',
						   formatMessage('bot', `You do not have any order yet`)
					   );
					   
				   }
						
					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Here's your current order:<br>
							Item:${session.userOrder.items} <br> Price: ${session.userOrder.total}`
						)
					);
					

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Please select an item to continue: <br>
								👉Select 1 to Place your order
								<br />
								👉Select 99 to checkout your order
								<br />
								👉Select 98 to see your order history
								<br />
								👉Select 97 to see your current order
								<br />
								👉Select 0 to cancel your order
								<br />`
						)
					);
	
					return progress = 1;
					

				} else if (inputNumber === 0) {
					// Logic here to cancel order
					function savedSession() {
						// if (inputNumber === 0) {
							// To cancel order
							try{
								
							} catch (err){
								console.log(err);
							}
							const selectedItem = menuItems.find(
								(item) => item.id === inputNumber
							);

							if (session.userOrder.items.length === 0) {
								session.userOrder.total = '';
								io.to(sessionId).emit(
									'chat message',
									formatMessage('bot', `You do not have any order to cancel`)
								);
							} else if (session.userOrder.items.length > 1) {
								// const removedItem = session.userOrder.items.splice(
								// 	selectedItem.name,
								// 	1
								// );
								const itemToRemove = session.userOrder.items.indexOf(selectedItem.name);
								session.userOrder.items.pop(itemToRemove);
								session.userOrder.total = selectedItem.price;
								// io.to(sessionId).emit(
								// 	'chat message',
								// 	formatMessage(
								// 		'bot',
								// 		`Your order: ${session.userOrder.items.map(item => item.name).join(',')} <br> has been cancelled`
								// 	)
								// );
								io.to(sessionId).emit(
									'chat message',
									formatMessage(
										'bot',
										`Your order has been cancelled successfully`
									)
								);
							}
						// }
					}
					savedSession();
					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`Your order has been cancelled successfully`
						)
					);

					progress = 1;
					return;
				} else {
					io.to(sessionId).emit(
						'chat message',
						formatMessage('bot', `<br> Please select a valid option`)
					);
				}

				progress = 1;

				break;

			case 2:
				inputNumber = parseInt(message);

				if (inputNumber === 1) {
					// LOGIC TO MAKE ORDERING POSSIBLE

					// Get the current session for the user
					const session = socket.request.session;
					// Create a new userOrder object or update an existing one

					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}
						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();

					// session.save();

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 1 <br> for Burger order <br> ${session.userOrder.total}`
						)
					);
				} else if (inputNumber === 2) {
					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}
						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();
					// console.log(savedSession());

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 2 <br> for Pizza order <br> ${session.userOrder.total}`
						)
					);
				} else if (inputNumber === 3) {
					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}
						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 3 <br> for Salad order <br> ${session.userOrder.total}`
						)
					);
				} else if (inputNumber === 4) {
					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}
						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 4 <br> for Rice order <br> ${session.userOrder.total}`
						)
					);
				} else if (inputNumber === 5) {
					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}
						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 5 <br>for Beans order <br> ${session.userOrder.total}`
						)
					);
				} else if (inputNumber === 6) {
					function savedSession() {
						if (!session.userOrder) {
							session.userOrder = {
								items: [],
								total: '',
							};
						}

						// // Get the current session for the user
						// const session = socket.request.session;
						// // Create a new userOrder object or update an existing one
						// if (!session.userOrder) {
						// 	session.userOrder = {
						// 		items: [],
						// 		total: '',
						// 	};
						// }
						//
						// // Get the selected item from the menu
						// const selectedItem = menuItems.find(
						// 	(item) => item.id === inputNumber
						// );
						// // Add the selected item to the user order
						// session.userOrder.items.push(selectedItem.name);
						// // Add the selected item price to the total price
						// session.userOrder.total = selectedItem.price;
						// // Save the user order to the session
						// session.save();
						//

						// // Initialize the selected item price variable
						// let selectedItemPrice = 0;
						// // Increase the price of the selected item when the user selects a new item
						// selectedItemPrice += menuItems[inputNumber - 1].price;
						// // Add the selected item to the user order
						// session.userOrder.items.push(menuItems[inputNumber - 1].name);
						// // Add the selected item price to the total price
						// session.userOrder.total += selectedItemPrice;
						// // Save the user order to the session
						// session.save();

						const selectedItem = menuItems.find(
							(item) => item.id === inputNumber
						);
						session.userOrder.items.push(selectedItem.name);
						session.userOrder.total = selectedItem.price;
						console.log(selectedItem.name);

						// session.save(selectedItem.name && selectedItem.total);
					}
					savedSession();

					io.to(sessionId).emit(
						'chat message',
						formatMessage(
							'bot',
							`You selected option 6 <br>for Pasta order <br> ${session.userOrder.total}`
						)
					);
				} else {
					io.to(sessionId).emit(
						'chat message',
						formatMessage('bot', `Please select a valid option`)
					);

					return progress = 1;
				}

				io.to(sessionId).emit(
					'chat message',
					formatMessage(
						'bot',
						`Please select an item to continue: <br>
                            👉Select 1 to Place your order
                            <br />
                            👉Select 99 to checkout your order
                            <br />
                            👉Select 98 to see your order history
                            <br />
                            👉Select 97 to see your current order
                            <br />
                            👉Select 0 to cancel your order
                            <br />`
					)
				);

				progress = 1;

				break;
			
		}
	});
	socket.on('disconnect', () => {
		io.to(sessionId).emit(
			'chat message',
			formatMessage('bot', 'A user has left the chat'),
			// (request.session.user = 'New user'),
			request.session.save()
		);
		// console.log(`User disconnected with sessionId ${sessionId}`);
	});
});

const PORT = process.env.PORT || 8001;

server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
