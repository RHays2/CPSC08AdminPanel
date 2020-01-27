// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App 

"use strict";
var edit = false;
var map, currentLocation, infoWindow, selectedLocation;


window.addEventListener("load", function () {
    // On the home page, the create tour button takes us to the tour page
    // and the map is initialized
    $('#create-tour').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        initMap("tour-map");
    });  
    
    // On the home page, the "edit this tour" button takes us to the tour page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-tour').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        edit = true;
        initMap("tour-map");
    });

    $('#create-stop').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        initMap("stop-map");
    });

    $('#create-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#media-page"]').tab('show');
    });

    $('#upload-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        initMap("stop-map");
    });

    $('#save-stop').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        edit = true;
        initMap("tour-map");
    });
    
    $('#save-tour').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#home-page"]').tab('show');
    });
    
});

function initMap(mapName) {
    map = new google.maps.Map(document.getElementById(mapName), {
        center: {
            lat: 47.667122,
            lng: -117.400617
        },
        zoom: 8
    });
    
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
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

    map.addListener('click', function (e) {
        replaceMarkerAndPanTo(e.latLng);
    });
}

function replaceMarkerAndPanTo(latLng) {
    infoWindow.close()
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