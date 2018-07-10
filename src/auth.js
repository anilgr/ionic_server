var auth = express.Router();

var signUp = async function(req, res) {
  try {
    await firebase.auth().createUserWithEmailAndPassword(req.body.email, "123456")
      .then(async (user) => {
        if (user) {
          user = await firebase.auth().currentUser;
          user.updateProfile({
            uid:user.uid,
            displayName: req.body.username,
          });
          firebase.database().ref("/users/" + user.uid).set({
            username: req.body.username,
            email: user.email,
          })
        }
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
      })
  } catch (e) {
    console.log(e.message);
  } finally {

  }

  res.end("successfuly signed up!");

}

var login = async function(req, res) {

  let uid;
  try {
    await firebase.auth().signInWithEmailAndPassword(req.body.username, req.body.password)
      .then(async (user) => {
        if (user) {
          user = await firebase.auth().currentUser;
          uid = user.uid;
          await user.updateProfile({
            displayName: "req.body.username",

          });
          var token = await generateRandomToken();
          await saveAccessToken(token, uid);
          sendAccessToken(res, uid);
        }

      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
        res.status(500).send("could not login please try again...");
      })

  } catch (e) {
    console.log(e.message);
  } finally {

  }
  // res.end(uid);

}

function generateRandomToken() {
  return new Promise((resolve, reject)=>{
    crypto.randomBytes(256,function(ex, buffer) {
      if (ex) {
        console.log("error generating token");
      }

      var token = crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex');
      resolve(token);

    });
  })

}

async function saveAccessToken(token, user_id) {
  var refreshToken = await generateRandomToken();
  await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(user_id)
    .once('value', (snapshot) => {
      snapshot.forEach((child) => {
        child.getRef().remove()
      })
    })
  await firebase.database().ref('/tokens/').push({
    user_id: user_id,
    access_token: token,
    refresh_token: refreshToken,
    issued_at:new Date().toString(),
  });
}
async function sendAccessToken(res, uid) {

  await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(uid)
    .once('value', (snapshot) => {
      snapshot.forEach((child) => {
        res.end(JSON.stringify({
          access_token: child.val().access_token,
          uid:uid,
          refresh_token:child.val().refresh_token,
        }))
      })
    });

}

function getBearerToken(req) {
  var headerToken = req.get('Authorization');
  if (headerToken) {
    var matches = headerToken.match(/Bearer\s(\S+)/);

    if (!matches) {
      console.log("malformed auth header");
    }

    headerToken = matches[1];
  }
  auth.bearerToken = headerToken;
}
function authorise(req, res, next){
  getBearerToken(req, next);
  checkToken(res, next);

}
async function checkToken(res, next) {
    await firebase.database().ref("/tokens").orderByChild("/access_token").equalTo(auth.bearerToken)
    .once('value',(snapshot)=>{
    snapshot.forEach((child)=>{
      if( child.val().access_token == auth.bearerToken  )
      {
        let now  = new Date();
        let tokenDate = new Date(child.val().issued_at);
        let diffMillis = now - tokenDate;
        var diffMins =  Math.floor((diffMillis/1000)/60);;
        if(diffMins > 2)
        {
          res.status(401).send("access token expired");

        }
        else {
          next()
        }
      }
      else {
        res.status(401).send("invalid token");
        next('route');
      }
    })
    })
}
async function refreshTokens(refreshToken){

}
async function logout(req, res){
  await firebase.auth().signOut().then(function(){
    //logout successfull
    res.end("logged out yaa!");
  }).catch(function(error){
    //error occured.
  })
}
module.exports = (app) => {

  auth.post("/signup", signUp);
  auth.post("/login", login);
  auth.post("/logout", logout);
  auth.authorise = authorise;
  auth.saveAccessToken = saveAccessToken;
  auth.checkToken = checkToken;
  auth.refreshTokens = refreshTokens;
  auth.generateRandomToken = generateRandomToken;
  return auth;
}
