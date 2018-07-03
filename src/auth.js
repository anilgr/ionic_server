var auth = express.Router();

var signUp = async function(req, res) {
  try {
    await firebase.auth().createUserWithEmailAndPassword("agr@gmail.com", "123456")
      .then(async (user) => {
        // console.log(JSON.stringify(user));
        if (user) {
          user = await firebase.auth().currentUser;
          user.updateProfile({
            displayName: req.body.username,
            photoURL: "fksdjfsd.jpg"
          });
          firebase.database().ref("/users/" + user.uid).set({
            username: "gv",
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
    await firebase.auth().signInWithEmailAndPassword("agr@gmail.com", "123456")
      .then(async (user) => {
        if (user) {
          user = await firebase.auth().currentUser;
          uid = user.uid;
          await user.updateProfile({
            displayName: "req.body.username",
            photoURL: "fksdjfsd.jpg"
          });
          var token = await generateAccessToken();console.log("fhgdf");
          saveAccessToken(token,uid);
          sendAccessToken(uid,res);
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

function generateAccessToken() {
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
  await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(user_id)
    .once('value', (snapshot) => {
      snapshot.forEach((child) => {
        child.getRef().remove()
      })
    })
  await firebase.database().ref('/tokens/').push({
    user_id: user_id,
    access_token: token,
  });
  console.log("saved token to database:" + token);
}
async function sendAccessToken(uid, res) {

  await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(uid)
    .once('value', (snapshot) => {
      console.log(JSON.stringify(snapshot.val()));
      snapshot.forEach((child) => {
        console.log("fecthed token using uid:" + child.key);
        res.end(JSON.stringify({
          access_token: child.val().access_token,
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
  checkToken(res);
  next();

}
async function checkToken(res, next) {
    await firebase.database().ref("/tokens").orderByChild("/access_token").equalTo(auth.bearerToken)
    .once('value',(snapshot)=>{
    snapshot.forEach((child)=>{
      console.log(child.access_token+"-----"+auth.bearerToken);
      if( child.val().access_token == auth.bearerToken)
      console.log("token valid");
      else {
        res.end("you are not authorised to access this end point");
        next('route');
      }
    })
    })
}
async function saveToken() {
  await firebase.database().ref('/tokens/').push({
    user_id: "dfgkdsjgflksjdfkljsdlfjlskdjf",
    access_token: "jflskdjfksjdflkjseroieiu34urdjfdflskdf"
  });
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
  auth.saveToken = saveToken;
  auth.authorise = authorise;
  return auth;
}
