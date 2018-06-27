var auth = express.Router();

var signUp = async function(req, res) {
  console.log(req.body);
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
          generateAndSendAccessToken(uid, res);
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
  // res.end(uid);

}

function generateAndSendAccessToken(uid, res){
  crypto.randomBytes(256,  async function (ex, buffer) {
    if (ex){
      console.log("error generating token");
    }

    var token = crypto
      .createHash('sha1')
      .update(buffer)
      .digest('hex');
      saveAccessToken(token, uid, res);

  });

}
async function saveAccessToken(token, user_id, res){
   await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(user_id)
   .once('value', (snapshot)=>{
     snapshot.forEach((child)=>{
       child.getRef().remove()
     })
   })
   await firebase.database().ref('/tokens/'+token).set({
     user_id:user_id,
   });
   console.log("saved token to database:"+token);
   sendAccessToken(user_id, res)

}
async function sendAccessToken(uid, res){
  await firebase.database().ref("/tokens").orderByChild("/user_id").equalTo(uid)
  .once('value', (snapshot)=>{
    snapshot.forEach((child)=>{
      console.log("fecthed token using uid:"+child.key);
      res.end(JSON.stringify({
        access_token:child.key,
      }))
    })
  });

}
function getBearerToken() {

}
function checkToken(){

}
module.exports = (app) => {
  auth.generateAccessToken = generateAndSendAccessToken;
  auth.saveAccessToken = saveAccessToken;
  auth.post("/signup", signUp);
  auth.post("/login",login);
  auth.login = login;
  return auth;
}
