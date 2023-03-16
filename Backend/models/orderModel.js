// Initialize the order model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      items: [
        {names: String,
        price: Number,}
      ],
    // items: {
    //     type: String,
    //     required: true
    //   },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: false
    },
    total: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});
// Define the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;