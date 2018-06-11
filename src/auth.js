var signUp = async function(req, res) {

    await firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {
      // console.log(JSON.stringify(user));
      if (user) {
        user = firebase.auth().currentUser;
        user.updateProfile({
          displayName: req.body.username,
          photoURL:"fksdjfsd.jpg"
        });
      }
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
      })

      res.end("successfuly signed up!");

    }
    module.exports.signUp = signUp;
