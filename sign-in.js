// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App Sign in page

"use strict";

var credentials = {"admin": "password", "me": "12345"}

window.addEventListener("load", function () {
    // MARK: Sign in page event listeners
    // TODO: this code also runs on index.html (and fails as it should)
    //      it should not run on index.html, just the sign in page
    var passwordField = document.getElementById("password");
    // Execute a function when the user releases a key on the keyboard
    passwordField.addEventListener("keyup", function(e) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            e.preventDefault();
            document.getElementById("sign-in").click(); 
        }
    });
    // hide warnings when the text boxes are changed
    passwordField.addEventListener("input", function() {
        $("#password").popover('disponse');
    });
    usernameField = document.getElementById("#username");
    usernameField.addEventListener("input", function(){
        $("#username").popover('dispose');
    });
});

function attemptSignIn() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    if (username in credentials) {
        if (password === credentials[username]) {
            window.location.href='index.html';
        } else {
            $("#password").popover({ title: 'Error', content: "Incorrect Password"});
            $("#password").click();
        }
    } else {
        $("#username").popover({ title: 'Error', content: "Unknown Username"});
        $("#username").click();
    }
}