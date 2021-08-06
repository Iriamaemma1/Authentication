//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();
// view engine
app.set('view engine', 'ejs');
// middle ware
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'));

// using session
app.use(session({
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized : false
}));
// initializing passport
app.use(passport.initialize());
// let passport use session
app.use(passport.session());
// database client connection
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });
// clearing a depreciation
mongoose.set('useCreateIndex', true);
// userDB schema
const userSchema = new mongoose.Schema(
  {
    email : String,
    password : String,
    googleId : String
  }
);
// using passportLocalMongoose as a plugin wiht the schema of the database
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// password encryption
// userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ['password']});

// userDB model
const User = new mongoose.model('User', userSchema);
// creating a strategy using passport
passport.use(User.createStrategy());
// serialising the model
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// routes
app.get('/', (req, res)=>{
  res.render('home');
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
app.route('/login')
.get((req, res)=>{
  res.render('login');
})
.post((req, res) =>{
const user = new User({
  username : req.body.username,
  password : req.body.password
});
req.login(user, (err)=>{
  if(err){
    console.log(err);
  }else{
    // authenticating the user using passport
    passport.authenticate('local')(req, res, ()=>{
      res.redirect('/secrets');
    });
  }
});
});
app.get('/logout', (req, res) =>{
  req.logout();
  res.redirect('/');
});
app.route('/register')
.get((req, res)=>{
  res.render('register');
})
.post((req, res)=>{
// registering using passport by passportLocalMongoose
User.register({
  username : req.body.username
}, req.body.password, (err, User) =>{
  if(err){
    console.log(err);
    res.redirect('/register');
  }else{
    // authenticating using passport
    passport.authenticate('local')(req, res, ()=>{
      res.redirect('/secrets');
    });
  }
});
});
app.get('/secrets', (req, res) =>{
  // checking for authentication using passport
  if(req.isAuthenticated()){
    res.render('secrets');
  }else{
    res.redirect('/login');
  }
});

// port
app.listen(3000, () =>{
  console.log('The server started on port 3000');
});
