// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App 

"use strict";
var edit = false;
var map, currentLocation, infoWindow, selectedLocation;
var credentials = {"admin": "password", "me": "12345"}

window.addEventListener("load", function () {
    // MARK: Navigation event listeners 

    // On the home page, the create tour button takes us to the tour page
    // and the map is initialized
    $('#create-tour').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        initTourMap();
    });  
    
    // On the home page, the "edit this tour" button takes us to the tour page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-tour').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        edit = true;
        initTourMap();
    });

    $('#create-stop').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        initStopMap();
    });

    $('#create-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#media-page"]').tab('show');
    });

    $('#upload-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        initStopMap();
    });

    $('#save-stop').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        edit = true;
        initTourMap();
    });
    
    $('#save-tour').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#home-page"]').tab('show');
    });
    
    $('#stop-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    $('#media-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // TODO: this code also runs on index.html and fails as it should
    var passwordField = document.getElementById("password");
    // Execute a function when the user releases a key on the keyboard
    passwordField.addEventListener("keyup", function(e) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            e.preventDefault();
            document.getElementById("sign-in").click();
        }
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

function initTourMap() {
    map = new google.maps.Map(document.getElementById("tour-map"), {
        center: {
            lat: 47.667122,
            lng: -117.400617
        },
        zoom: 13
    });
    
    if (currentLocation) { // use the current location we already have
        currentLocation = new google.maps.Marker({
            position: currentLocation["position"], // users current position
            map: map,
            icon: { // use a blue marker for current location 
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
        });
        map.setCenter(currentLocation["position"]);
    } else if (navigator.geolocation) { // Try HTML5 geolocation.
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos)
            currentLocation = new google.maps.Marker({
                position: pos, // users current position
                map: map,
                icon: { // use a blue marker for current location 
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                }
            });
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function initStopMap() {
    map = new google.maps.Map(document.getElementById("stop-map"), {
        center: {
            lat: 47.667122,
            lng: -117.400617
        },
        zoom: 13
    });

    if (currentLocation) { // use the current location we already have
        currentLocation = new google.maps.Marker({
            position: currentLocation["position"], // users current position
            map: map,
            icon: { // use a blue marker for current location 
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
        });
        map.setCenter(currentLocation["position"]);
    } else if (navigator.geolocation) { // Try HTML5 geolocation.
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            currentLocation = new google.maps.Marker({
                position: pos, // users current position
                map: map,
                icon: { // use a blue marker for current location 
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                }
            });
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
    // on the stop map, place a marker where the user clicks
    map.addListener('click', function (e) {
        replaceMarkerAndPanTo(e.latLng);
    });
}

function replaceMarkerAndPanTo(latLng) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map
    });
    if (selectedLocation) {
        selectedLocation.setMap(null);
    }
    map.panTo(latLng);
    selectedLocation = marker;
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}