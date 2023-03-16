const mongoose = require('mongoose');
require('dotenv').config()

function connectionToDb() {
	// To manually ensure that its only fields that are specified in our schema that will be
	// stored in the db, since it will be switched back to false from mongoose v7
	mongoose.set('strictQuery', true);

	mongoose.connect(process.env.MONGODB_CONNECTION_URI);

	mongoose.connection.on('connected', () => {
		console.log('Your connection to Mongodb was successful!');
	});

	mongoose.connection.on('error', (error) => {
		console.error(error);
		process.exit(1);
	});
}

module.exports = connectionToDb;
