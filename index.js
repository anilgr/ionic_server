var express = require("express");
var firebase = require("firebase");
var path = require("path");
var url = require('url');

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDsId1IO77YJD3zpgik0pYpVx5RudtA6fY",
  authDomain: "ionic-messenger-20fe9.firebaseapp.com",
  databaseURL: "https://ionic-messenger-20fe9.firebaseio.com",
  projectId: "ionic-messenger-20fe9",
  storageBucket: "ionic-messenger-20fe9.appspot.com",
  messagingSenderId: "143374214715"
};
firebase.initializeApp(config);
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser)
app.post("/signup", function(req, res){
 console.log("request:"+req.body);
 console.log(req)
 // console.log(res);
 res.header("Access-Control-Allow-Origin","*");
 res.end("WOO hooo signed you up!");
});
app.listen(8081, function(){
  console.log("listening on port 8081...");
});
