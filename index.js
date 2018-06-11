var express = require("express");
firebase = require("firebase");
var path = require("path");
var url = require('url');
var bodyParser = require('body-parser');
var cors = require('cors');
var auth = require('./src/auth');
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
// var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(cors());


app.post("/signup", auth.signUp);

app.get("/contacts", function(req, res){
  firebase.database().ref("users").once("value").then(sendResponse);
  function sendResponse(snapshot) {
    res.write(JSON.stringify(snapshot.val()), function(err) {
      if (err) {
        console.log("error sending data");
      }
    });
    res.end();
  }
})

app.listen(8081, function() {
  console.log("listening on port 8081...");
});
