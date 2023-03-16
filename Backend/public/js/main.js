//connect to the socket
const socket = io();
//get the elements from the DOM
const messages = document.getElementById('messages');
const chatForm = document.getElementById("chat-form");

//listen for the chat message event from the server
socket.on("chat message", (message) => {
    console.log(message, 'chat');
  //output the message to the DOM
  outputMessage(message);

  // Scroll down
//   message.scrollTop = message.scrollHeight
    messages.scrollTop = messages.scrollHeight;
});

// attach an event listener to the form
chatForm.addEventListener("submit", (e) => {
//   prevent the default behaviour
  e.preventDefault();
//   get the message from the input
//   const message = e.target.elements["message-input"].value;
  const message = e.target.elements.messageInput.value;
  console.log(message);
  //sends the message to the server
  socket.emit("chat message", message);
  //clear the input field
  e.target.elements.messageInput.value = "";
  e.target.elements.messageInput.focus();
});

//Output the message to the DOM
const outputMessage = (message) => {
  //create a div element
  const div = document.createElement("div");
  
  div.classList.add("message");
  //check if the message is from the bot or the user
  if(message.username === "bot"){
    div.classList.add("bot-message");
    // document.querySelector('.bot-message').innerHTML = `bot-message: ${message.text}`}
  div.innerHTML = ` ${message.text}`}
  else{
    div.classList.add("user-message");
    // document.querySelector('.user-message').innerHTML = `user-message: ${message.text}`}
  div.innerHTML = ` ${message.text}`}
  //append the div to the messages div
  messages.appendChild(div);
}

// TO DISPLAY THE ORDER LIST ON THE FRONTEND

// Get the orders from local storage and parse them as JSON
const orders = JSON.parse(localStorage.getItem('orders'));

// Get a reference to the orders list element
const ordersList = document.getElementById('orders-list');

// Loop through the orders and create a new list item for each one
orders.forEach(order => {
  const listItem = document.createElement('li');
  listItem.innerText = `Order #${order.id} - ${order.items.length} items - Total: ${order.total}`;
  ordersList.appendChild(listItem);
});

 



