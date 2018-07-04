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
app.use(function(req, res, next) {
  // console.log(req.headers);
  next(undefined);
})
var auth = require('./src/auth')(app);
// auth.bearerToken = "dfjlsdjlsjdljslgjfdlgfdhgkjhdfkgjhfdg";
// auth.checkToken("res","next");
// auth.refreshTokens("ddf17e9bda7ce0fcfd0e5fcf2ad9dfe150500075");
app.use('/auth', auth);
app.get("/users", auth.authorise, function(req, res) {
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
app.get("/refresh_token", function(req, res){
  var refreshToken = req.get("refresh_token");
  if (refreshToken) {
    await firebase.database().ref("/tokens").orderByChild("/refresh_token").equalTo(refreshToken)
    .once('value', (snapshot)=>{
      snapshot.forEach(async (child) => {
        var token = await auth.generateRandomToken();
        child.getRef().child("access_token").set(token);
        console.log("token refreshed");
        res.end(JSON.stringify({
          access_token: token,
          refresh_token:refreshToken,
        }))

      })
    })
  }
  else {
    res.status(401).send("refresh token not found");
    console.log("no refresh_token in the header.");
  }
})
app.post("/messages", auth.authorise, async function(req, res) {
  messages.push(req.body)
  await firebase.database().ref("messages").push(req.body);
  console.log("message:");
  console.log(req.body);
  res.end("message recieved!");

})
app.listen(8081, function() {
  console.log("listening on port 8081...");
});
