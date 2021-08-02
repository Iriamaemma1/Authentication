//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');
const app = express();
// view engine
app.set('view engine', 'ejs');
// middle ware
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'));
// database client connection
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });
// userDB schema
const userSchema = new mongoose.Schema(
  {
    email : String,
    password : String
  }
);
// password encryption
// userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ['password']});

// userDB model
const User = new mongoose.model('User', userSchema);
// routes
app.get('/', (req, res)=>{
  res.render('home');
});
app.route('/login')
.get((req, res)=>{
  res.render('login');
})
.post((req, res) =>{
  const username = req.body.username;
  const password = md5(req.body.password);
  User.findOne({email : username}, (err, foundUser) =>{
    if(err){
      res.send(err);
    }else{ if(foundUser){
        if(foundUser.password === password){
          res.render('secrets');
        }
      }
}
  });
});
app.route('/register')
.get((req, res)=>{
  res.render('register');
})
.post((req, res)=>{
  const newUser = new User({
    email : req.body.username,
    password : md5(req.body.password)
  });
  newUser.save((err)=>{
    if(!err){
      res.render('secrets');
    }else{
      res.send(err);
    }
  });
});


// port
app.listen(8080, () =>{
  console.log('The server started on port 8080');
});
