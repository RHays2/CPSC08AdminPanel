// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App Sign in page

"use strict";


firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
  
      var user = firebase.auth().currentUser;
  
      if(user != null){

        window.location.href='index.html';
      }
  
    } else {
      // No user is signed in.

    }
  });
  
  //runs when login button is clicked
  function login(){
  
    //gets email and password field
    var userEmail = document.getElementById("email_field").value;
    var userPass = document.getElementById("password_field").value;
  
    //checks with firebase authentication service
    firebase.auth().signInWithEmailAndPassword(userEmail, userPass).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
  
      //already has pre built error alerts through firebase
      window.alert("Error : " + errorMessage);
  
      // ...
    });
  
  }
  function logout(){
    firebase.auth().signOut();
  }
  