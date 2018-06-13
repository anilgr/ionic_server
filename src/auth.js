var signUp = async function(req, res) {

  await firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {
      // console.log(JSON.stringify(user));
      if (user) {
        user = firebase.auth().currentUser;
        user.updateProfile({
          displayName: req.body.username,
          photoURL: "fksdjfsd.jpg"
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

  res.end("successfuly signed up!");

}

var login = async function(req, res) {

  await firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {
      console.log(JSON.stringify(user));
      if (user) {
        user = firebase.auth().currentUser;
        user.updateProfile({
          displayName: req.body.username,
          photoURL: "fksdjfsd.jpg"
        });
      }
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);
    })

  res.end("successfuly logged in!");

}

module.exports.signUp = signUp;
module.exports.login = login;
