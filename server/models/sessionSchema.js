const Mongoose = require('mongoose');
const connection = require('./dbConnector');

const sessionSchema = new Mongoose.Schema({
  expires: {
    type: Date,
    required: true,
  },
  session: {
    cookie: { originalMaxAge: Number, expires: String, httpOnly: Boolean, path: String },
    user: { username: String, iat: Number, exp: Number }
  }
});

module.exports = connection.model('sessions', sessionSchema);