// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App 


var edit = false;

// variables for the map
var map, currentLocation, infoWindow, selectedLocation;

// variables for the added media and added tours 
var addedMedia, addedTours;

// variables to hold the list of created media, stops, and tours
// these will be filled with information from the database
// they are each a dictionary with keys representing titles
var existingMedia = {}, existingStops = {}, existingTour = {};

window.addEventListener("load", function () {
    // MARK: Home page event listeners 

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

    // On the home page, the "edit this stop" button takes us to the stop page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-stop').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        edit = true;
        initStopMap();
    });

    // On the home page, the "edit this media item" button takes us to the stop page
    // Edit mode is set to true
    $('#start-edit-media').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#media-page"]').tab('show');
        edit = true;
    });

    // MARK: tour page event listeners

    // On the tour page, the "Create new stop" button 
    // takes us to the stop page
    $('#create-stop').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        initStopMap();
    });

    // On the tour page, the "Save tour" button returns us to the 
    // home page
    $('#save-tour').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#home-page"]').tab('show');
    });

    // clicking a row in the stop table highlights it
    $('#stop-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // confirming add stop puts it in the table
    $('#confirm-add-stop').click(function() {
        var existingStopSelect = document.getElementById("existing-stops");
        updateStopTable(existingStopSelect.value);
    })

    // MARK: stop page event listeners

    // fill the add existing media drop down with existing media 
    var existingMediaSelect = document.getElementById("existing-media");
    for (var title of Object.keys(existingMedia)) {
        var option = document.createElement('option');
        option.text = option.value = title;
        option.selected = true;
        existingMediaSelect.add(option);
        console.log("added", title)
    }

    // On the stop page, the "Create new media" button
    // takes us to the media page
    $('#create-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#media-page"]').tab('show');
    });

    // On the stop page, the "Save stop" button returns us
    // to the tour page
    $('#save-stop').click(function(e) {
        e.preventDefault();

        var title = document.getElementById("stop-title");
        var description = document.getElementById("stop-description")
        var titleValue = title.value;
        var descriptionValue = description.value;

        var mediaTable = document.getElementById("stop-media")
        numRows = mediaTable.rows.length;
        addedMedia = []
        for (var i = 0; i < numRows; i++) {
            addedMedia.push(mediaTable.rows[i].cells[0].innerHTML);
        }
        console.log("addedMedia")
        // TODO: Get current selected location, or error otherwise

        if (!titleValue) { // there must be a title
            $("#stop-title").popover({ title: 'Error', content: "Title required"});
            $("#stop-title").click();
        } else if (Object.keys(existingMedia).includes(titleValue)) { // title must be unique
            $("#stop-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#stop-title").click();
        } else {
            // save the media item
            existingStops[titleValue] = {"description": descriptionValue}
            // make an option in the add media modal's dropdown
            var existingMediaSelect = document.getElementById("existing-stops");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            option.selected = true; // the newly created stop should be selected
            existingMediaSelect.add(option);
            // navigate back to the tour page
            $('#nav-pills a[href="#tour-page"]').tab('show');
            initTourMap()
            $('#add-stop-popup').modal('show'); // bring back up the modal
        }
    });

    // Remove the warning next time the media-title box is clicked
    $('#stop-title').on('input', function(e) {
        $("#stop-title").popover('dispose');
    }); 

    // clicking a row in the media table highlights it
    $('#media-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // confirming add media puts it in the table
    $('#confirm-add-media').click(function() {
        var existingMediaSelect = document.getElementById("existing-media");
        updateMediaTable(existingMediaSelect.value);
    })

    // remove a media item from the table
    $('#confirm-remove-media').click(function() {
        tableBody = document.getElementById("stop-media");
        selectedRow = document.querySelector('#stop-media > .bg-info');
        tableBody.removeChild(selectedRow);
    });

    // MARK: media page event listeners

    // On the media page, the "Upload Media" button
    $('#upload-media').click(function(e) {
        e.preventDefault();
        // TODO: save the image as well
        var title = document.getElementById("media-title");
        var description = document.getElementById("media-description")
        var titleValue = title.value;
        var descriptionValue = description.value;
        if (!titleValue) { // there must be a title
            $("#media-title").popover({ title: 'Error', content: "Title required"});
            $("#media-title").click();
        } else if (Object.keys(existingMedia).includes(titleValue)) { // title must be unique
            $("#media-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#media-title").click();
        } else {
            // save the media item
            existingMedia[titleValue] = {"description": descriptionValue}
            // make an option in the add media modal's dropdown
            var existingMediaSelect = document.getElementById("existing-media");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            option.selected = true; // the newly created media should be selected
            existingMediaSelect.add(option);
            // navigate back to the stop page
            $('#nav-pills a[href="#stop-page"]').tab('show');
            initStopMap()
            $('#add-media-popup').modal('show'); // bring back up the modal
        }
    });

    // Remove the warning next time the media-title box is clicked
    $('#media-title').on('input', function() {
        $("#media-title").popover('dispose');
    }); 
});


function loadFile(e) {
    var preview = document.getElementById('media-preview');
    preview.src = URL.createObjectURL(e.target.files[0]);
}

function updateStopTable(name) {
    var stopTable = document.getElementById("tour-stops");
    var row = stopTable.insertRow(0);
    row.className = 'clickable-row';
    var cell = row.insertCell(0);
    cell.innerHTML = name;
    // TODO: Add event listeners when a stop is double clicked
    // to display the tour's description and a list of 
    // images and their descriptions in the popup
    // add event listeners when a stop is single clicked to show its
    // location on the map
}

function updateMediaTable(name) {
    var mediaTable = document.getElementById("stop-media");
    var row = mediaTable.insertRow(0);
    row.className = 'clickable-row';
    var cell = row.insertCell(0);
    cell.innerHTML = name;
    // TODO: Add event listeners when media is double clicked
    // to display the image and description in a popup
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