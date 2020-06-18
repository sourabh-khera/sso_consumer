const express = require('express');
const session = require('express-session');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

const sessionModel = require('./models/sessionSchema');
const app = express();

const dbString = 'mongodb://localhost/session_db';
const connection = mongoose.createConnection(dbString);
const sessionStore = new MongoStore({
  mongooseConnection: connection,
  collection: 'sessions',
  stringify: false,
});

app.use(cors());
app.use(session({
  name: 'consumer_one',
  resave: false,
  saveUninitialized: false,
  secret: '12345',
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

const axiosInstance = axios.create({ baseURL: 'http://localhost:4000'});

const isAuthenticated = (req, res, next) => {
  if (req.path !== '/ssoRedirect') {
    const redirectUrl = 'http://localhost:3000';
    if (!req.session.user) {
      return res.redirect(`http://localhost:4000/simplesso/login?serviceURL=${redirectUrl}`);
    }
  }
  next();
}
const ssoRedirect = async (req, res, next) => {
  const { ssoToken } = req.query;
  axiosInstance.defaults.headers.Cookie = req.headers.cookie;
  if (!ssoToken) {
    return res.status(401).send({ message: 'Unauthorized' });
  }
  try {
    const response = await axiosInstance.get(`/verifySSO?ssoToken=${ssoToken}`);
    const token = response.data.token;
    if(!token){
      res.status(401).send({message: 'Unauthorized'});
    }
    jwt.verify(token, 'abcde@12345', (err, decoded) => {
      if (err){
        return res.status(400).send({message: 'Failed to authenticate token'});
      }
      const data = jwt.decode(token);
      req.session.user = data;
      res.redirect('/')
   })
  }
  catch (err) {
    console.log(err);
  }
}

app.use(isAuthenticated);

app.use('/ssoRedirect', ssoRedirect);

app.get('/', (req, res) => {
 res.status(200).send(req.session.user);
});

app.get('/logout', (req, res) => {
   deleteSessions(req.session.user.username)
   .then(res => {
     console.log(res)
   })
   .catch(err => {
     console.log(err);
   })
});

const deleteSessions = (username) => {
  return new Promise((resolve, reject) => {
    sessionModel.remove({"session.user.username": username}, (err, data)=>{
      if(err){
        reject(err)
      }
      resolve(data);
    }) 
  })
}

app.listen(3000, () => console.log('server listening on port 3000'));
module.exports = app;
