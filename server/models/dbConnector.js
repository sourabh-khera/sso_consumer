const mongoose = require('mongoose');

const dbString = 'mongodb://localhost/session_db';
const connection = mongoose.createConnection(dbString);


module.exports = connection;