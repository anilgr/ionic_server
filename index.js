express = require("express");
firebase = require("firebase");
 path = require("path");
 url = require('url');
 bodyParser = require('body-parser');
 cors = require('cors');
crypto = require('crypto')
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
var messages = [];
// var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(cors());
app.use(function(req,res,next){
  console.log(req.headers);
  next(undefined);
})
// const oAuth2Server = require('node-oauth2-server');
// const oAuthModel = require('./src/accessTokenModel');
// app.oauth = oAuth2Server({
//     model: oAuthModel,
//     grants: ['password'],
//     debug: true
// })
var auth = require('./src/auth')(app);
app.use('/auth', auth);
// app.use(app.oauth.errorHandler());
app.get("/users",function(req, res) {
  firebase.database().ref("users").once("value").then(sendResponse)
    .catch((err) => {
      log("error occured");
    });

  function sendResponse(snapshot) {
    res.write(JSON.stringify(snapshot.val()), function(err) {
      if (err) {
        console.log("error sending data");
      }
    });
    res.end("");
  }
})

app.post("/messages",function(req, res) {
  console.log(req.body);
  messages.push(req.body)
  res.end("message recieved!");
})
app.listen(8081, function() {
  console.log("listening on port 8081...");
});
