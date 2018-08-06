express = require("express");
path = require("path");
url = require('url');
bodyParser = require('body-parser');
cors = require('cors');
crypto = require('crypto')
http = require('http')
// Initialize Firebase
firebase = require("firebase");
var config = {
  apiKey: "AIzaSyDsId1IO77YJD3zpgik0pYpVx5RudtA6fY",
  authDomain: "ionic-messenger-20fe9.firebaseapp.com",
  databaseURL: "https://ionic-messenger-20fe9.firebaseio.com",
  projectId: "ionic-messenger-20fe9",
  storageBucket: "ionic-messenger-20fe9.appspot.com",
  messagingSenderId: "143374214715"
};
firebase.initializeApp(config);

admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ionic-messenger-20fe9.firebaseio.com"
});
var registrationToken = "dRxTLnUlYUU:APA91bE3hSLOJsYkwg_aIbFowXq5mpTqMjN0B8UIsOpZRtUEwubMM5k46Hq8CW1apDhJveGUYU_X4nmyY86yIc0cp7NuEX4yVNETevxKll-yaoL71YPO8dcHEkGG_cOwFn22Bu52xcG-0SOxkTdLby_cJg4uwu3StA"

var app = express();
var messages = [];
app.use(bodyParser.json());
app.use(cors());
var auth = require('./src/auth')(app);
app.use('/auth', auth);
app.get("/users", auth.authorise, listUsers)
app.get("/refresh_token",refreshToken)
app.post("/messages", auth.authorise,postMessage)
app.get("/conversations/:user",getConversations)
app.get("/messages/:user", getConversation)
app.post("/fcm",saveFCMToken)
app.post("/fcm/unsubscribe", removeFCMToken)
// function sendMessage(msg, fcmToken){
//   var message = {
//     notification:{
//       title:"Notification",
//       body:"lorem sit amet dolar ipsum...",
//       click_action:"FCM_PLUGIN_ACTIVITY",
//
//     },
//     data:msg,
//     token: fcmToken
//   };
//
//   // Send a message to the device corresponding to the provided
//   // registration token.
//   admin.messaging().send(message)
//     .then((response) => {
//       // Response is a message ID string.
//       console.log('Successfully sent message:', response);
//     })
//     .catch((error) => {
//       console.log('Error sending message:', error);
//     });
// }
function sendMessage(msg, fcmToken) {
  // Build the post string from an object
  var post_data = JSON.stringify({
    notification:{
      title:"Notification",
      body:"lordfsdfem sit amet dolar ipsum...",
      click_action:"FCM_PLUGIN_ACTIVITY",
    },
    to:fcmToken,
    data:msg,
    token: fcmToken
  });

  // An object of options to indicate where to post to
  var post_options = {
      host: 'fcm.googleapis.com',
      port: '80',
      path: '/fcm/send',
      method: 'POST',
      headers: {
           'Authorization': 'key=AAAAIWHE5js:APA91bFiACm50Ft0qSSXSbyQE2tKHWu5LztxW0fcKDkudANyA1NR1zp1JfeBofCD8WIbkXSyOSMAdHf7FJlCSi_rItPFdt0jU-E3LR7Cl81p0U7CRTJe5_TAX_dsn4NlYDFQvkjSqcCp',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}
var sampleMsg = {
  conversation_id:"-LHlKVSi9Rrjy0cc9jWe",
  message:"lorem ipsum dolar sample",
  senderId:"s0zrLqJsArcOw7jsXTO3GVvUkm63",
  recieverId:"AEBXoygDixZYnFtO6ExVHi4iR2I2",
  timestamp:new Date().toString(),
  sender:"Snow"
}
var sampleMsg1 = {
  conversation_id:"-LHmSEFQKUEEVGDDgDse",
  message:"lorem ipsum dolar sample",
  senderId:"E0Cifp8pcmOxvJoMqMVfYhuSw9X2",
  recieverId:"AEBXoygDixZYnFtO6ExVHi4iR2I2",
  timestamp:new Date().toString(),
  sender:"Snow"
}
// sendMessage(sampleMsg1,registrationToken)
// sendMessage({sdfdsf:"lkdfjlsdf"},registrationToken)
// PostCode();
// saveFCMToken();
function saveFCMToken(req, res){
  let userID = req.body.userID;
  let token = req.body.token;
  // let userID = "AEBXoygDixZYnFtO6ExVHi4iR2I2";
  // let token = "token_on";
  // firebase.database().ref('users').child(userID).child('fcm_token').update(token);

  firebase.database().ref('users').child(userID).child('fcm_tokens')
  .once('value',(snap)=>{
    let tokens = snap.val();
    if(tokens == null || !tokens.includes(token))
    {
      if(tokens == null)tokens = [];
      firebase.database().ref('users').child(userID).child('fcm_tokens').set(tokens.concat([token]));
    }
  })
  res.end();
}
async function getFCMTokens(userID){
  userID = userID;
  let tokens = [];
  await firebase.database().ref('users').child(userID).child('fcm_tokens')
  .once('value',(snapshot)=>{
    tokens = snapshot.val();
    console.log("fcm token fecthed:"+snapshot.val());
  })
  return tokens;
}
async function removeFCMToken(req, res){
  let userID = req.body.userID;
  let mToken = req.body.token;
  // let userID = "AEBXoygDixZYnFtO6ExVHi4iR2I2";
  // let mToken = "token_on";
  firebase.database().ref('users').child(userID).child('fcm_tokens')
  .once('value',(snap)=>{
    let tokens = snap.val().filter((token)=>{
      return token != mToken
    });
    firebase.database().ref('users').child(userID).child('fcm_tokens').set(tokens)
  })
  res.end();
}
async function getConversations(req, res){
  var userId = req.params.user;
  let chats = [];
  await firebase.database().ref("/conversations").once('value', (snapshot)=>{
    snapshot.forEach((covtn)=>{
      // console.log(covtn.val());

      if (covtn.val().member1 == userId || covtn.val().member2 == userId) {



        chats.push(covtn.val());
      }
    })

    chats.sort((a,b)=>{
      let x = a.lastMessage.timestamp;
      let y = b.lastMessage.timestamp;
      return new Date(y)-new Date(x);

    })

  })
  for (var i = 0; i < chats.length; i++) {
    let chat = chats[i];
    let recieverId = chat.member1 == userId?chat.member2:chat.member1;
    await firebase.database().ref('/users')
    .child(recieverId).once('value', (reciever)=>{
      chat.reciever = reciever.val();
      chat.reciever.uid = reciever.key
    })
  }
  res.end(JSON.stringify(chats));
}
async function getConversation(req, res) {
  var senderId = req.params.user;
  var recieverId = req.query.person2;
  // var sender = "AEBXoygDixZYnFtO6ExVHi4iR2I2";
  // var reciever = "s0zrLqJsArcOw7jsXTO3GVvUkm63";
  var endKey = req.query.endKey;
  if(endKey == "undefined")endKey = undefined;

  console.log("endKey:"+endKey);
  var messages = [];
  var members = [senderId,recieverId];


  let conversationId = await getConversationId(members) ;

  if (conversationId == undefined) {
    res.end(JSON.stringify(messages));
    return;
  }

  try {
    await firebase.database().ref("/messages").orderByChild("/conversation_id")
    .endAt(conversationId,endKey).limitToLast(10)
      .once('value', (snapshot) => {
        let valid = 0;
        let invalid = 0;
        snapshot.forEach((child) => {
          if (child.val().conversation_id == conversationId)
          {
            valid++;
            msg = child.val();
            msg.id = child.key;
            messages.push(msg);
          }
          else{
            invalid++;
            console.log("invalid:"+child.val().message);
          }
        })
        console.log("total "+valid+" valids and "+invalid+" invalids recieved");

      })
  } catch (e) {
    console.log("error fetching messages");
  }

  res.end(JSON.stringify(messages));
}
async function getConversationId(members){
  let member1, member2;
  if (members[0] > members[1]) {
    member1 = members[1];
    member2 = members[0];
  } else {
    member2 = members[1];
    member1 = members[0];
  }
  let conversationId;
  try {
    await firebase.database().ref("/conversations")
    .orderByChild("/member1").equalTo(member1)
      .once("value", (snapshot) => {
        snapshot.forEach((child) => {
          if (child.val().member2 == member2) {
            conversationId = child.key;
            console.log("conversation id:"+conversationId);
          }

        })
      })
  } catch (e) {
    console.log("error fetching conversation id");

  }
  return conversationId;
}

async function postMessage(req, res) {
 let data = req.body.messageData;
 let conversationId;
 let senderId = req.body.messageData.senderId;
 let recieverId = req.body.messageData.recieverId;
 let member1, member2;
 if (senderId > recieverId) {
   member1 = recieverId;
   member2 = senderId;
 } else {
   member2 = recieverId;
   member1 = senderId;
 }
 if (req.body.isNewConversation) {
   console.log("new conversation");
   conversationId = await firebase.database().ref("/conversations").push({
     initiator:senderId,
     member1: member1,
     member2: member2,
     lastMessage:data,
   }).key;
 } else {
   conversationId = await getConversationId([senderId, recieverId])
   await firebase.database().ref("/conversations").child(conversationId)
   .child("lastMessage").set(data);
 }
 data.conversation_id = conversationId;
 await firebase.database().ref("/messages").push(data);
 console.log("message:"+req.body.messageData.message);
 let tokens = await getFCMTokens(recieverId);
 tokens.forEach((token)=>{
   sendMessage(data,token);
 })
 res.end(JSON.stringify({
   conversationId: conversationId,
 }));

}
async function refreshToken(req, res) {
  var refreshToken = req.get("refresh_token");
  if (true) {
    await firebase.database().ref("/tokens")
    .orderByChild("/refresh_token").equalTo(refreshToken)
      .once('value', (snapshot) => {
        snapshot.forEach(async (child) => {
          var token = await auth.generateRandomToken();
          child.getRef().child("access_token").set(token);
          child.getRef().child("issued_at").set(new Date().toString());
          console.log("token refreshed");
          res.end(JSON.stringify({
            access_token: token,
            refresh_token: refreshToken,
            issued_at: new Date().toString()
          }))

        })
      })
  } else {
    res.status(401).send("refresh token not found");
    console.log("no refresh_token in the header.");
  }
}
function listUsers(req, res) {
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
}


app.listen(8081, function() {
  console.log("listening on port 8081...");
});





// async function getConversation(req, res) {
//   var arya = req.params.user;
//   var snow = req.query.person2;
//   console.log(req.query.endKey);
//   var messages = [];
//   await firebase.database().ref("/messages").orderByChild("/senderId").equalTo(arya)
//     .once('value', (snapshot) => {
//       snapshot.forEach((child) => {
//         if (child.val().recieverId == snow) {
//           let val = child.val();
//           val.isLeft = false;
//           messages.push(val);
//         }
//       })
//     })
//   await firebase.database().ref("/messages").orderByChild("/recieverId").equalTo(arya)
//     .once('value', (snapshot) => {
//       snapshot.forEach((child) => {
//         if (child.val().senderId == snow) {
//           let val = child.val();
//           val.isLeft = true;
//           messages.push(val);
//
//         }
//       })
//     })
//
//   messages.sort(function(a, b) {
//     return ((new Date(a.timestamp)) - (new Date(b.timestamp)));
//   })
//
//
//   res.end(JSON.stringify(messages));
// }
// app.get("/messages/:user",getConversation)
// async function getConversation1(req, res) {
//   console.log("entered 1");
//   var arya = req.params.user;
//   var snow = req.query.person2;
//   // var arya = "AEBXoygDixZYnFtO6ExVHi4iR2I2";
//   // var snow = "s0zrLqJsArcOw7jsXTO3GVvUkm63";
//   var endKey = req.query.endKey;
//   // console.log("end:"+req.query.endKey+" arya:"+arya+" snow"+snow);
//   var msg1;
//   var messages = [];
//   var msg2;
//   if (endKey == undefined)
//     endkey = null;
//   await firebase.database().ref("/messages").orderByChild("/senderId").equalTo(arya).limitToLast(6)
//     .once('value', (snapshot) => {
//       var isFirst = true;
//       snapshot.forEach((child) => {
//         if (child.val().recieverId == snow) {
//           let val = child.val();
//           val.isLeft = false;
//           val.id = child.key;
//           if (isFirst) {
//             msg1 = val;
//             isFirst = false;
//           }
//           console.log(val.message);
//           messages.push(val);
//         }
//       })
//       console.log("_______________");
//
//     })
//
//   await firebase.database().ref("/messages").orderByChild("/recieverId").equalTo(arya).limitToLast(6)
//     .once('value', (snapshot) => {
//       var isFirst = true;
//       snapshot.forEach((child) => {
//         if (child.val().senderId == snow) {
//           let val = child.val();
//           val.isLeft = true;
//           val.id = child.key;
//           if (isFirst) {
//             msg2 = val;
//             isFirst = false;
//           }
//           console.log(val.message);
//
//           messages.push(val);
//
//
//         }
//       })
//     })
//   var limit = ((new Date(msg1.timestamp)) - (new Date(msg2.timestamp))) > 0 ? msg1 : msg2;
//
//   // console.log(limit.message+":"+limit.id);
//
//
//   messages.sort(function(a, b) {
//     return ((new Date(a.timestamp)) - (new Date(b.timestamp)));
//   })
//   messages.forEach((msg) => {
//     console.log(msg.id + ":" + msg.message);
//   })
//   while (messages[0].id != limit.id) {
//     // console.log(messages[0].id +"   :    " +limit.id);
//     var temp = messages.shift();
//     // console.log("removing:"+temp.message +":"+ temp.id);
//
//   }
//   console.log("\n");
//   messages.forEach((msg) => {
//     console.log(msg.message);
//   })
//   console.log("\n");
//
//
//   res.end(JSON.stringify(messages));
// }
// async function getConversation(req, res) {
//   var sender = req.params.user;
//   var reciever = req.query.person2;
//   var endKey = req.query.endKey;
//   var msg1;
//   var messages = [];
//   var msg2;
//   await firebase.database().ref("/messages").orderByChild("/senderId").endAt(sender, endKey).limitToLast(6)
//     .once('value', (snapshot) => {
//       var isFirst = true;
//       snapshot.forEach((child) => {
//         if (child.val().recieverId == reciever) {
//           let val = child.val();
//           val.id = child.key;
//           val.isLeft = false;
//
//           if (isFirst) {
//             msg1 = val;
//             isFirst = false;
//           }
//           messages.push(val);
//         }
//       })
//     })
//   await firebase.database().ref("/messages").orderByChild("/recieverId").endAt(sender, endKey).limitToLast(6)
//     .once('value', (snapshot) => {
//       var isFirst = true;
//       snapshot.forEach((child) => {
//         if (child.val().senderId == reciever) {
//           let val = child.val();
//           val.id = child.key;
//           val.isLeft = true;
//
//           if (isFirst) {
//             msg2 = val;
//             isFirst = false;
//           }
//
//           messages.push(val);
//
//
//         }
//       })
//     })
//   var limit = ((new Date(msg1.timestamp)) - (new Date(msg2.timestamp))) > 0 ? msg1 : msg2;
//   messages.sort(function(a, b) {
//     return ((new Date(a.timestamp)) - (new Date(b.timestamp)));
//   })
//   while (messages[0].id != limit.id) {
//     // console.log(messages[0].id +"   :   " +limit.id);
//     var temp = messages.shift();
//     // console.log("removing:"+temp.message +":"+ temp.id);
//
//   }
//
//
//
//   res.end(JSON.stringify(messages));
// }
/*
conversation
  -{conversation_id}
    -members:[user_id1, user_id2....]
    -





messages
  -{id}
    -conversation_id
    -message
    -recieverId
    -senderId
    -timestamp



*/
