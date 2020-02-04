// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App 


 
// TODO: use this to go back to the home page when saving edited content
var edit = false;

// variables for the map
var map, currentLocation, infoWindow, selectedLocation;

// variables for the added media and added tours 
var addedMedia = {}, addedStops = {};

// variables to hold the list of created media, stops, and tours
// these will be filled with information from the database
// they are each a dictionary with keys representing titles
var existingMedia = {}, existingStops = {}, existingTours = {};

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
        var selectedTour = document.getElementById("edit-existing-tour").value;
        if (selectedTour === "") {
            $("#edit-existing-tour").popover({ title: 'Error', content: "Please select a tour to edit"});
            $("#edit-existing-tour").click(); // bring up the popover
        } else {
            document.getElementById("tour-title").value = selectedTour;
            document.getElementById("tour-description").value = existingTours[selectedTour]["description"];
            document.getElementById("admin-only").value = existingTours[selectedTour]["visibility"];

            // add stops back to the table
            var stops = Object.keys(existingTours[selectedTour]["stops"]); 
            for (var i = 0; i < stops.length; i++) {
                updateStopTable(stops[i]);
                addedStops[stops[i]] = existingStops[stops[i]];
            }

            $('#edit-which-tour').modal('hide');
            $('#nav-pills a[href="#tour-page"]').tab('show');
            edit = true;
            initTourMap();
        }
    });

    // Remove the warning next time the edit-existing-tour dropdown box is changed
    $('#edit-existing-tour').on('change', function() {
        $("#edit-existing-tour").popover('dispose');
    }); 

    // On the home page, the "edit this stop" button takes us to the stop page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-stop').click(function(e) {
        e.preventDefault();
        var selectedStop = document.getElementById("edit-existing-stop").value;
        if (selectedStop === "") {
            $("#edit-existing-stop").popover({ title: 'Error', content: "Please select a stop to edit"});
            $("#edit-existing-stop").click(); // bring up the popover
        } else {
            document.getElementById("stop-title").value = selectedStop;
            document.getElementById("stop-description").value = existingStops[selectedStop]["description"];
            
            // add media back to the table
            var mediaItems = Object.keys(existingStops[selectedStop]["media"]); 
            for (var i = 0; i < mediaItems.length; i++) {
                updateMediaTable(mediaItems[i]);
                addedMedia[mediaItems[i]] = existingMedia[mediaItems[i]];
            }
            
            // TODO: add a marker for the selected location

            $('#edit-which-stop').modal('hide');
            $('#nav-pills a[href="#stop-page"]').tab('show');
            initStopMap();
            edit = true;
        }
    });

    // Remove the warning next time the edit-existing-stop dropdown box is changed
    $('#edit-existing-stop').on('change', function() {
        $("#edit-existing-stop").popover('dispose');
    }); 

    // On the home page, the "edit this media item" button takes us to the stop page
    // Edit mode is set to true
    $('#start-edit-media').click(function(e) {
        e.preventDefault();
        var selectedMedia = document.getElementById("edit-existing-media").value;
        if (selectedMedia === "") {
            $("#edit-existing-media").popover({ title: 'Error', content: "Please select a media item to edit"});
            $("#edit-existing-media").click(); // bring up the popover
        } else {
            document.getElementById("media-title").value = selectedMedia;
            document.getElementById("media-description").value = existingMedia[selectedMedia]["description"];
            document.getElementById("media-preview").src = existingMedia[selectedMedia]["media-item"];
            $('#edit-which-media').modal('hide');
            $('#nav-pills a[href="#media-page"]').tab('show');
            edit = true;
        }
    });

    // Remove the warning next time the edit-existing-media dropdown box is changed
    $('#edit-existing-media').on('change', function() {
        $("#edit-existing-media").popover('dispose');
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
    $('#save-tour').click(function(e) {
        e.preventDefault();

        var title = document.getElementById("tour-title");
        var description = document.getElementById("tour-description")
        var titleValue = title.value;
        var descriptionValue = description.value;

        var stopTable = document.getElementById("tour-stops")
        numRows = stopTable.rows.length;

        if (!titleValue) { // there must be a title
            $("#tour-title").popover({ title: 'Error', content: "Title required"});
            $("#tour-title").click();
        } else if (Object.keys(existingTours).includes(titleValue)) { // title must be unique
            $("#tour-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#tour-title").click();
        } else {
            // save the tour
            var visibility = document.getElementById("admin-only").value;
            existingTours[titleValue] = {"description": descriptionValue, "stops": addedStops, "visibility" : visibility};
            // make an option in the edit tour modal's dropdown
            var editTourSelect = document.getElementById("edit-existing-tour");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            editTourSelect.add(option);
            // clear the fields
            var title = document.getElementById("tour-title");
            var description = document.getElementById("tour-description");
            title.value = "";
            description.value = "";
            // clear table
            mediaTableBody = document.getElementById("tour-stops");
            mediaTableBody.innerHTML = "";
            // navigate back to the tour page
            $('#nav-pills a[href="#home-page"]').tab('show');
        }
    });

    // clicking a row in the stop table highlights it
    $('#stop-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // confirming add stop puts it in the table
    $('#confirm-add-stop').click(function() {
        var existingStopSelect = document.getElementById("existing-stops");
        var selectedStop = existingStopSelect.value;
        if (Object.keys(addedStops).includes(selectedStop)) { // this media item is already added to the stop
            $("#existing-stops").popover({ title: 'Error', content: "This stop was already added to the tour"});
            $("#existing-stops").click(); // bring up the popover
        } else {
            updateStopTable(selectedStop);
            addedStops[selectedStop] = existingStops[selectedStop];
            // restore default for the select existing media dropdown
            document.getElementById("select-stop-default").selected = true; 
            $('#add-stop-popup').modal('hide');
        }
    });

    // remove a stop item from the table
    $('#confirm-remove-stop').click(function() {
        var tableBody = document.getElementById("tour-stops");
        var selectedRow = document.querySelector('#tour-stops > .bg-info');
        var name = selectedRow.cells[0].innerHTML;
        tableBody.removeChild(selectedRow);
        delete addedStops[name];
    });

    // MARK: stop page event listeners

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

        // TODO: Get current selected location, or error otherwise

        if (!titleValue) { // there must be a title
            $("#stop-title").popover({ title: 'Error', content: "Title required"});
            $("#stop-title").click();
        } else if (Object.keys(existingMedia).includes(titleValue)) { // title must be unique
            $("#stop-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#stop-title").click();
        } else {
            // save the stop
            existingStops[titleValue] = {"description": descriptionValue, "media": addedMedia};
            // clear addedMedia
            addedMedia = {};
            // make an option in the add stop modal's dropdown
            var existingMediaSelect = document.getElementById("existing-stops");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            option.selected = true; // the newly created stop should be selected
            existingMediaSelect.add(option);
            // make an option in the edit stop modal's dropdown
            var editStopSelect = document.getElementById("edit-existing-stop");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            editStopSelect.add(option);
            // clear the fields
            title.value = "";
            description.value = "";
            selectedLocation = undefined; // TODO: handle location
            // clear table
            mediaTableBody = document.getElementById("stop-media");
            mediaTableBody.innerHTML = "";
            
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
    // TODO: check that it isn't already in the table
    $('#confirm-add-media').click(function() {
        var existingMediaSelect = document.getElementById("existing-media");
        var selectedMedia = existingMediaSelect.value;
        if (Object.keys(addedMedia).includes(selectedMedia)) { // this media item is already added to the stop
            $("#existing-media").popover({ title: 'Error', content: "This media was already added to the stop"});
            $("#existing-media").click(); // bring up the popover 
        } else {
            updateMediaTable(selectedMedia);
            addedMedia[selectedMedia] = existingMedia[selectedMedia];
            // restore default for the select existing media dropdown
            document.getElementById("select-media-default").selected = true; 
            $('#add-media-popup').modal('hide');
        }
    });

    // Remove the warning next time the existing-media dropdown box is changed
    $('#existing-media').on('change', function() {
        $("#existing-media").popover('dispose');
    }); 

    // remove a media item from the table
    $('#confirm-remove-media').click(function() {
        var tableBody = document.getElementById("stop-media");
        var selectedRow = document.querySelector('#stop-media > .bg-info');
        var name = selectedRow.cells[0].innerHTML;
        tableBody.removeChild(selectedRow);
        delete addedMedia[name];
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
            var preview = document.getElementById('media-preview');
            existingMedia[titleValue] = {"description": descriptionValue, "media-item": preview.src}; // TODO: add image
            // make an option in the add media modal's dropdown
            var existingMediaSelect = document.getElementById("existing-media");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            option.selected = true; // the newly created media should be selected
            existingMediaSelect.add(option);
            // make an option in the edit media modal's dropdown
            var editMediaSelect = document.getElementById("edit-existing-media");
            var option = document.createElement('option');
            option.text = option.value = titleValue;
            editMediaSelect.add(option)
            // clear the fields
            title.value = "";
            description.value = "";
            document.getElementById("media-item").value = "";
            document.getElementById("media-preview").src = "";
            // navigate back to the stop page
            $('#nav-pills a[href="#stop-page"]').tab('show');
            initStopMap()
            $('#add-media-popup').modal('show'); // bring back up the modal
            $("#existing-media").popover('dispose'); // hide the warning about repeat media
                                                    // if it exists
        }
    });

    // Remove the warning next time the media-title box is clicked
    $('#media-title').on('input', function() {
        $("#media-title").popover('dispose');
    }); 
});

// trigger by onchange on the html element media-item
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