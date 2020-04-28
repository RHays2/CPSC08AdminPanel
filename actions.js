// Gonzaga Walking AR Tour
// Group 08 2019-2020
// Admin Panel Web App



// determine whether we are editing something previously created.
var editMode = false;

// remember the start place for editing (and go back to the home page on confirmation)
var startEdit = undefined;

// variables for the map
var map, detectedLocation, infoWindow, selectedLocation;

// variables for the added media and added tours
var addedMedia = {}, addedStops = {};

// variables to hold the list of created media, stops, and tours
// these will be filled with information from the database
// they are each a dictionary with keys representing titles
var existingMedia = {}, existingStops = {}, existingTours = {};

// when media is deleted from stops or stops from tours, remember what was
// removed so we can delete it when they save.
var removedStops = [], removedMedia = [];

// this variable will hold the object that contains the quill text editor
var quillEditor = undefined;
// this variable holds the last known cursor location within the editor
var cursorLocation = undefined;

var currentTab = "home"; // ["home", "tour", "stop", "media"]

window.addEventListener("load", function () {
    // Initialize firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDfS00TUVcfmZxEBGH6J9dK6JpxpdEbO4A",
      authDomain: "gonzagawalkingtour.firebaseapp.com",
      databaseURL: "https://gonzagawalkingtour.firebaseio.com",
      projectId: "gonzagawalkingtour",
      storageBucket: "gonzagawalkingtour.appspot.com",
      messagingSenderId: "239906026383",
      appId: "1:239906026383:web:12366df5d3d970d7c6d1fa",
      measurementId: "G-QZYFQXWSGT"
    };

    firebase.initializeApp(firebaseConfig);

    // called when firebase.auth().signInWithEmailAndPassword happens
    firebase.auth().onAuthStateChanged(function(user) {
        // checks that there is user information passed
        if (user) {
            // makes sure the user information is actually in firebase
            var user = firebase.auth().currentUser;
            // if the user is a registered user in firebase
            if (user != null) {

                document.getElementById('login-content').style.display = "none";
                document.getElementById('home-content').style.display = "block";
                // user has signed in with the correct password
                var tempTours;
                var tempStops;
                var tempMedia;

                // read the existing items and populate the edit drop downs
                firebase.database().ref('tours').once('value').then(function(snapshot) {
                    var tempTours = (snapshot.val());
                    firebase.database().ref('stops').once('value').then(function(snapshot) {
                        var tempStops = (snapshot.val());
                        firebase.database().ref('assets').once('value').then(function(snapshot) {
                            var tempMedia = (snapshot.val());

                            for (tour of Object.keys(tempTours)) {
                            var stopItems = {};
                                if (tempStops[tour] !== undefined) { // if the tour has stops
                                    for (stop of Object.keys(tempStops[tour])) { // all the stops of the current tour
                                        var mediaItems = {};
                                        var idValue = tempStops[tour][stop]["id"]
                                        if (tempMedia[stop] !== undefined) { // if the stop has media
                                            for (media of Object.keys(tempMedia[stop])) { // all the media of the current stop
                                                var name = tempMedia[stop][media]["name"];
                                                mediaItems[name] = {
                                                    "caption" : tempMedia[stop][media]["description"],
                                                    "id": media,
                                                    "stopID": stop,
                                                    "storage_name": tempMedia[stop][media]["storage_name"],
                                                }
                                                existingMedia[name] = mediaItems[name];
                                                // // make an option in the add media modal's dropdown
                                                // var existingMediaSelect = document.getElementById("existing-media");
                                                // var option = document.createElement('option');
                                                // option.text = option.value = name;
                                                // existingMediaSelect.add(option);

                                                // make an option in the edit media modal's dropdown
                                                var editMediaSelect = document.getElementById("edit-existing-media");
                                                var option = document.createElement('option');
                                                option.text = option.value = name;
                                                editMediaSelect.add(option)
                                            }
                                            // create stop object for stop existing stops and dropdowns

                                            stopItems[idValue] = {
                                                "description": tempStops[tour][stop]["description"],
                                                "media": mediaItems,
                                                "location": {
                                                    lat: tempStops[tour][stop]["lat"],
                                                    lng: tempStops[tour][stop]["lng"]
                                                },
                                                "id": idValue,
                                                "databaseID": stop,
                                                "tourID": tour,
                                                "title": tempStops[tour][stop]["name"],
                                                "stop_order": tempStops[tour][stop]["stop_order"]
                                            }
                                        } else {
                                            stopItems[idValue] = {
                                                "description": tempStops[tour][stop]["description"],
                                                "media": {},
                                                "location": {
                                                    lat: tempStops[tour][stop]["lat"],
                                                    lng: tempStops[tour][stop]["lng"]
                                                },
                                                "id": idValue,
                                                "databaseID": stop,
                                                "tourID": tour,
                                                "title": tempStops[tour][stop]["name"],
                                                "stop_order": tempStops[tour][stop]["stop_order"]
                                            }
                                        }
                                        existingStops[idValue] = stopItems[idValue];
                                        var editStopSelect = document.getElementById("edit-existing-stop");
                                        var option = document.createElement('option');
                                        option.text = option.value = tempStops[tour][stop]["id"];
                                        editStopSelect.add(option);
                                    }
                                }
                                var name = tempTours[tour]["name"];
                                existingTours[name] = {
                                    "description": tempTours[tour]["description"],
                                    "stops": stopItems,
                                    "isAdminOnly" : "false",
                                    "storage_name": tempTours[tour]["preview_image"],
                                    "databaseID": tour
                                }
                                // make an option in the edit tour modal's dropdown
                                var editTourSelect = document.getElementById("edit-existing-tour");
                                var option = document.createElement('option');
                                option.text = option.value = name;
                                editTourSelect.add(option);
                            }
                        });
                    });
                });

                // currently permission_denied
                // read the existing admin_only items and populate the edit drop downs
                firebase.database().ref('admin_only_tour').once('value').then(function(snapshot) {
                    var tempTours = (snapshot.val());
                    firebase.database().ref('stops').once('value').then(function(snapshot) {
                        var tempStops = (snapshot.val());
                        firebase.database().ref('assets').once('value').then(function(snapshot) {
                            var tempMedia = (snapshot.val());

                            for (tour of Object.keys(tempTours)) {
                                var stopItems = {};
                                if (tempStops[tour] !== undefined) {// make sure the tour has stops
                                    for (stop of Object.keys(tempStops[tour])) { // all the stops of the current tour
                                        var mediaItems = {};
                                        var idValue = tempStops[tour][stop]["id"]
                                        if (tempMedia[stop] !== undefined) { // make sure the stop has media
                                            for (media of Object.keys(tempMedia[stop])) { // all the media of the current stop
                                                var name = tempMedia[stop][media]["name"];
                                                mediaItems[name] = {
                                                    "caption" : tempMedia[stop][media]["description"],
                                                    "id": media,
                                                    "stopID": stop,
                                                    "storage_name": tempMedia[stop][media]["storage_name"]
                                                }
                                                existingMedia[name] = mediaItems[name];

                                                // make an option in the edit media modal's dropdown
                                                var editMediaSelect = document.getElementById("edit-existing-media");
                                                var option = document.createElement('option');
                                                option.text = option.value = name;
                                                editMediaSelect.add(option)
                                            }
                                        }
                                        // create stop object for existing stops and dropdowns
                                        stopItems[idValue] = {
                                            "description": tempStops[tour][stop]["description"],
                                            "media": mediaItems,
                                            "location": {
                                                lat: tempStops[tour][stop]["lat"],
                                                lng: tempStops[tour][stop]["lng"]
                                            },
                                            "id": idValue,
                                            "databaseID": stop,
                                            "tourID": tour,
                                            "title": tempStops[tour][stop]["name"],
                                            "stop_order": tempStops[tour][stop]["stop_order"]
                                        }
                                        existingStops[idValue] = stopItems[idValue];
                                        var editStopSelect = document.getElementById("edit-existing-stop");
                                        var option = document.createElement('option');
                                        option.text = option.value = tempStops[tour][stop]["id"];
                                        editStopSelect.add(option);
                                    }
                                }
                                var name = tempTours[tour]["name"];
                                existingTours[name] = {
                                    "description": tempTours[tour]["description"],
                                    "stops": stopItems,
                                    "isAdminOnly" : "true",
                                    "storage_name": tempTours[tour]["preview_image"],
                                    "databaseID": tour
                                }
                                // make an option in the edit tour modal's dropdown
                                var editTourSelect = document.getElementById("edit-existing-tour");
                                var option = document.createElement('option');
                                option.text = option.value = name;
                                editTourSelect.add(option);
                            }
                        });
                    });
                });
            }
        }
    });
    var signOutButton = document.getElementById("sign-out");
    signOutButton.addEventListener('click', function() {
        firebase.auth().signOut().then(function() {
            //hide home content
            document.getElementById('login-content').style.display = "block";
            document.getElementById('home-content').style.display = "none";
            //delete all data from the objects
            existingMedia = {};
            existingStops = {};
            existingTours = {};
            window.location.reload(false);
        })
    });


    $('#tour-title').click(function(e) {
        if (editMode) {
            $('#tour-title').blur();
            $('#tour-title').popover({ title: 'Error', content: "You may not edit the tour id."});
            $("#tour-title").popover('show'); // bring up the popover
        }
    });

    $('#stop-id').click(function(e) {
        if (startEdit === "stop") {
            $('#stop-id').blur();
            $('#stop-id').popover({ title: 'Error', content: "You may not edit the stop id."});
            $("#stop-id").popover('show'); // bring up the popover
        }
    });

    $('#media-title').click(function(e) {
        if (startEdit === "media") {
            $('#media-title').blur();
            $('#media-title').popover({ title: 'Error', content: "You may not edit the media id."});
            $("#media-title").popover('show'); // bring up the popover
        }
    });


    // MARK: tab close event listeners
    //      remove warnings when a tab is exited
    $('#nav-pills a[href="#home-page"]').on('hide.bs.tab', function(){
        removeHomeWarnings();
    });
    $('#nav-pills a[href="#tour-page"]').on('hide.bs.tab', function(){
        removeTourWarnings();
    });
    $('#nav-pills a[href="#stop-page"]').on('hide.bs.tab', function(){
        removeStopWarnings();
    });
    $('#nav-pills a[href="#media-page"]').on('hide.bs.tab', function(){
        removeMediaWarnings();
    });

    // MARK: Home page event listeners
    // On the home page, the create tour button takes us to the tour page
    // and the map is initialized
    $('#create-tour').click(function(e) {
        e.preventDefault();
        $('#nav-pills a[href="#tour-page"]').tab('show');
        hideSignOutButton();
        showCancelButton();
        currentTab = "tour";
        initTourMap();
    });

    // On the home page, the "edit this tour" button takes us to the tour page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-tour').click(function(e) {
        e.preventDefault();
        var selectedTour = document.getElementById("edit-existing-tour").value;
        if (selectedTour === "") {
            $("#edit-existing-tour").popover('dispose');
            $("#edit-existing-tour").popover({ title: 'Error', content: "Please select a tour to edit"});
            $("#edit-existing-tour").popover('show'); // bring up the popover
        } else {
            clearTourFields();
            document.getElementById("tour-title").value = selectedTour;
            document.getElementById("tour-description").value = existingTours[selectedTour]["description"];
            document.getElementById("admin-only").value = existingTours[selectedTour]["isAdminOnly"];

            var preview_image = document.getElementById("preview-image-preview");
            if (!existingTours[selectedTour]["preview"]) {
                getImageNamed(existingTours[selectedTour]["storage_name"], function(url) {
                    preview_image.src = setImageOrientation(url, preview_image);
                    existingTours[selectedTour]["preview"] = url;
                });
            } else {
                preview_image.src = setImageOrientation(existingTours[selectedTour]["preview"], preview_image);
            }

            // add stops back to the table
            var existingStops = existingTours[selectedTour]["stops"]
            var stops = Object.keys(existingStops);
            // for (var i = 0; i < stops.length; i++) {
            //     updateStopTable(stops[i]);
            // }
            for (var i = 1; i <= stops.length; i++) {
                for (var j = 0; j < stops.length; j++) {
                    if (existingStops[stops[j]]["stop_order"]===i) { // add items in order 1+
                        updateStopTable(stops[j]);
                    }
                }
            }

            $('#edit-which-tour').modal('hide');
            $('#nav-pills a[href="#tour-page"]').tab('show');
            hideSignOutButton();
            showCancelButton();
            currentTab = "tour";
            // show delete tour button
            document.getElementById('delete-tour').style.visibility = "visible";
            editMode = true;
            startEdit = "tour";
            initTourMap();
        }
    });

    // Remove the warning next time the edit-existing-tour dropdown box is changed
    $('#edit-existing-tour').on('change', function() {
        $("#edit-existing-tour").popover('dispose');
    });
    // remove the warning if the edit existing tour modal is closed
    $('#edit-which-tour').on('hide.bs.modal', function() {
        $("#edit-existing-tour").popover('dispose');
    });

    // On the home page, the "edit this stop" button takes us to the stop page
    // Edit mode is set to true
    // The map is initialized
    $('#start-edit-stop').click(function(e) {
        e.preventDefault();
        var selectedStop = document.getElementById("edit-existing-stop").value;
        if (selectedStop === "") {
            $("#edit-existing-stop").popover('dispose');
            $("#edit-existing-stop").popover({ title: 'Error', content: "Please select a stop to edit"});
            $("#edit-existing-stop").popover('show'); // bring up the popover
        } else {
            clearStopFields();
            document.getElementById("stop-title").value = existingStops[selectedStop]["title"];
            var existingMediaForDescription = document.getElementById("existing-media-for-description");
            //document.getElementById("stop-description").value = existingStops[selectedStop]["description"];
            document.getElementById("stop-id").value = selectedStop;
            // add media back to the table
            addedMedia = JSON.parse(JSON.stringify(existingStops[selectedStop]["media"]));
            var mediaItems = Object.keys(addedMedia);

            var promises = [];
            for (var j = 0; j < mediaItems.length; j++) {
                //add media as options to the existing-media-for-description selector
                var option = document.createElement('option');
                option.text = option.value = mediaItems[j];
                existingMediaForDescription.add(option);
                //updateMediaTable(mediaItems[j], false);
                promises.push(updateMediaObj(mediaItems[j],addedMedia[mediaItems[j]]["storage_name"]));
            }

            Promise.all(promises).then(function() {
                //update stop description
                reenterSavedDescription(selectedStop);
            }, function(error){ console.log(error) });

            $('#edit-which-stop').modal('hide');
            $('#nav-pills a[href="#stop-page"]').tab('show');
            currentTab = "stop";
            showCancelButton();
            hideSignOutButton();
            initStopMap();
            replaceMarkerAndPanTo(existingStops[selectedStop]["location"]);
            editMode = true;
            startEdit = "stop";
        }
    });

    function updateMediaObj(mediaName, storageName) {
      return new Promise(function(resolve, reject){
        getImageNamed(addedMedia[mediaName]["storage_name"], function(url){
            addedMedia[mediaName]["media-item"] = url;
            existingMedia[mediaName]["media-item"] = url;
            updateMediaTable(mediaName, false);
            resolve();
          });
      });
    }

    // Remove the warning next time the edit-existing-stop dropdown box is changed
    $('#edit-existing-stop').on('change', function() {
        $("#edit-existing-stop").popover('dispose');
    });
    // remove the warning if the edit existing stop modal is closed
    $('#edit-which-stop').on('hide.bs.modal', function() {
        $("#edit-existing-stop").popover('dispose');
    });

    // On the home page, the "edit this media item" button takes us to the stop page
    // Edit mode is set to true
    $('#start-edit-media').click(function(e) {
        e.preventDefault();
        var selectedMedia = document.getElementById("edit-existing-media").value;
        if (selectedMedia === "") {
            $("edit-existing-media").popover('dispose');
            $("#edit-existing-media").popover({ title: 'Error', content: "Please select a media item to edit"});
            $("#edit-existing-media").popover('show'); // bring up the popover
        } else {
            clearMediaFields();
            document.getElementById("media-title").value = selectedMedia;
            console.log(document.getElementById("media-title").value);
            // document.getElementById("media-description").value = existingMedia[selectedMedia]["description"];

            var preview_image = document.getElementById("media-preview");
            if (!existingMedia[selectedMedia]["media-item"]) {
                getImageNamed(existingMedia[selectedMedia]["storage_name"], function(url) {
                    preview_image.src = setImageOrientation(url, preview_image);
                    existingMedia[selectedMedia]["media-item"] = url;
                });
            } else {
                preview_image.src = setImageOrientation(existingMedia[selectedMedia]["media-item"], preview_image);
            }


            document.getElementById("media-caption").value = existingMedia[selectedMedia]["caption"];
            $('#edit-which-media').modal('hide');
            $('#nav-pills a[href="#media-page"]').tab('show');
            currentTab = "media";
            hideSignOutButton();
            showCancelButton();
            editMode = true;
            startEdit = "media";
        }
    });

    // Remove the warning next time the edit-existing-media dropdown box is changed
    $('#edit-existing-media').on('change', function() {
        $("#edit-existing-media").popover('dispose');
    });
    // remove the warning if the edit existing stop modal is closed
    $('#edit-which-media').on('hide.bs.modal', function() {
        $("#edit-existing-media").popover('dispose');
    });

    // Back button event listener
    $('#cancel-back').click(function() {
        var modalText = document.getElementById("back-warning-text");
        if (currentTab === "tour") {
            if (startEdit === "tour") {
                // change the message
                modalText.innerHTML = "Any changes made, including new stops and media, will be lost and the tour will revert to its state before editing. Do you want to go back to the home tab?"
            } else {
                // change the message
                modalText.innerHTML = "The progress on this tour, including stops and media, will be lost. Do you want to go back to the home tab?"
            }
        } else if (currentTab === "stop") {
            if (startEdit === "stop") {
                // change the message
                modalText.innerHTML = "Any changes made, including new media, will be lost and the stop will revert to its state before editing. Do you want to go back to the home tab?"
            } else {
                // change the message
                modalText.innerHTML = "The progress on this stop, including added media, will be lost. Do you want to go back to the tour tab?"
            }
        } else if (currentTab === "media") {
            if (startEdit === "media") {
                // change the message
                modalText.innerHTML = "Any changes made will be lost and the media asset will revert to its state before editing. Do you want to go back to the home tab?"
            } else {
                // change the message
                modalText.innerHTML = "The progress on this media asset will be lost. Do you want to go back to the stop tab?"
            }
        }
        $('#cancel-back-warning').modal('toggle');
    });

    // confirm going back button listener
    $("#go-back").click(function() {
        console.log("go back clicked on ", currentTab, " tab.")
        if (currentTab === "tour") {
            $('#nav-pills a[href="#home-page"]').tab('show');
            clearTourFields();
            hideCancelButton();
            showSignOutButton();
            currentTab = "home";
            editMode = false;
            startEdit = undefined;
        } else if (currentTab === "stop") {
            if (startEdit === "stop") {
                $('#nav-pills a[href="#home-page"]').tab('show');
                hideCancelButton();
                showSignOutButton();
                currentTab = "home";
                editMode = false;
                startEdit = undefined;
            } else {
                $('#nav-pills a[href="#tour-page"]').tab('show');
                currentTab = "tour";
            }
            clearStopFields();
        } else if (currentTab === "media") {
            if (startEdit === "media") {
                $('#nav-pills a[href="#home-page"]').tab('show');
                hideCancelButton();
                showSignOutButton();
                currentTab = "home";
                editMode = false;
                startEdit = undefined;
            } else {
                $('#nav-pills a[href="#stop-page"]').tab('show');
                currentTab = "stop";
            }
            clearMediaFields();
        }
    });

    // MARK: tour page event listeners

    // On the tour page, the "Create new stop" button
    // takes us to the stop page
    $('#create-stop').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#stop-page"]').tab('show');
        currentTab = "stop";
        initStopMap();
    });

    // On the tour page, the "Save tour" button returns us to the
    // home page
    $('#save-tour').click(function(e) {
        e.preventDefault();
        var title = document.getElementById("tour-title");
        var description = document.getElementById("tour-description");
        var preview = document.getElementById("preview-image-preview");
        var titleValue = title.value;
        var descriptionValue = description.value;
        var src = preview.src.substring(preview.src.length - 10);
        var stopTable = document.getElementById("tour-stops");
        var isAdminOnly = document.getElementById("admin-only").value;
        numRows = stopTable.rows.length;

        if (!titleValue) { // there must be a title
            $("#tour-title").popover('dispose');
            $("#tour-title").popover({ title: 'Error', content: "Title required"});
            $("#tour-title").popover('show');
        } else if (Object.keys(existingTours).includes(titleValue) && !editMode) { // title must be unique unless in editMode
            $("#tour-title").popover('dispose');
            $("#tour-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#tour-title").popover('show');
        } else if (src == "index.html") {
            $("#tour-preview-image").popover('dispose');
            $("#tour-preview-image").popover({ title: 'Error', content: "Tour must have a preview image.", placement: "bottom"});
            $("#tour-preview-image").popover('show');
        } else {
            // updating a tour in the database: edit mode and it is not being moved between admin_only tours and all user tours
            if (editMode && existingTours[titleValue]["isAdminOnly"] === isAdminOnly) {
                editMode = false;
                startEdit = undefined;
                console.log("update");

                existingTours[titleValue]["description"] = descriptionValue;
                existingTours[titleValue]["stops"] = addedStops;
                existingTours[titleValue]["isAdminOnly"] = isAdminOnly;
                existingTours[titleValue]["preview"] = preview.src;

                // upload the preview image to the database
                var file = document.getElementById('tour-preview-image').files[0];
                if (file) { // if in edit mode, the file may not have been changed
                    console.log("file");
                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot);
                    var fileName = titleValue + extension;

                    // Create a root reference for uploading the preview image
                    var storageRef = firebase.storage().ref();
                    var fileLoc = 'images/' + fileName;
                    if (existingTours[titleValue]) {
                        existingTours[titleValue]["storage_name"] = fileName; // be aware - this runs even if the upload fails.
                    }
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }

                var tourId = existingTours[titleValue].databaseID;
                // post to the DB
                if (tourId != undefined) { // make sure we have the databaseID
                    var toursRef;
                    var stopsRef = firebase.database().ref("stops");
                    //get reference to database for assets
                    var assetsRef = firebase.database().ref("assets");
                    if (isAdminOnly === "true") {
                        toursRef = firebase.database().ref("admin_only_tour");
                    } else {
                        toursRef = firebase.database().ref("tours");
                    }
                    // save the tour to the appropriate location
                    console.log(tourId);
                    toursRef.child(tourId).set({
                        description: descriptionValue,
                        length: numRows,
                        name: titleValue,
                        preview_image: existingTours[titleValue]["storage_name"]
                    });

                    for (stop of Object.keys(addedStops)) {
                        if (!existingStops[stop]["databaseID"]) {  // if the stop is newly added during editing
                            // pushes the stop to the database
                            var newStopRef = stopsRef.child(tourId).push({
                                description: sanitizeForDatabase(addedStops[stop]["description"]),
                                lat: addedStops[stop]["location"]["lat"],
                                lng: addedStops[stop]["location"]["lng"],
                                name: addedStops[stop]["title"],
                                id: stop,
                                stop_order: addedStops[stop]["stop_order"]
                            });

                            //adding the stops from the tour
                            let stopId = newStopRef.key;
                            existingTours[titleValue]["stops"][stop]["databaseID"] = stopId;
                            existingTours[titleValue]["stops"][stop]["tourID"] = tourId;
                            var newAddedMedia = addedStops[stop]["media"];
                            var asset;

                            for(asset of Object.keys(newAddedMedia)) {
                                var newAssetsRef = assetsRef.child(stopId).child(newAddedMedia[asset].id).set({
                                    description: newAddedMedia[asset]["caption"],
                                    name: asset,
                                    storage_name: newAddedMedia[asset]["storage_name"]
                                });
                                existingTours[titleValue]["stops"][stop]["media"][asset]["id"] = newAssetsRef.key;
                                existingTours[titleValue]["stops"][stop]["media"][asset]["stopID"] = stopId;
                            }
                        }
                    }
                    // delete removed stops and their media items from the database
                    // references to be used to delete  from database
                    var databaseRef = firebase.database().ref();
                    var stopsRef = databaseRef.child("stops");
                    var assetsRef = databaseRef.child("assets");
                    var storageRef = firebase.storage().ref();

                    for (stopName of removedStops) { // go through the stops that were removed
                        stop = existingStops[stopName];
                        for (mediaName of Object.keys(stop["media"])) { // go though the media assets
                            media = stop["media"][mediaName];
                            // delete the image from storage
                            var fileLoc = 'images/' + media['storage_name'];
                            storageRef.child(fileLoc).delete().then(function() {
                                // File deleted successfully
                                console.log("deleted ", fileLoc)
                            }).catch(function(error) {
                                // Uh-oh, an error occurred!
                                console.log("failed to delete ", fileLoc)
                            });
                            // delete the asset
                            assetsRef.child(media["stopID"]).child(media["id"]).remove();
                            // remove from edit drop down
                            editMediaSelect = document.getElementById("edit-existing-media");
                            editMediaSelect.value = mediaName;
                            editMediaSelect.remove(editMediaSelect.selectedIndex);
                        }
                        // delete the stop
                        assetsRef.child(stop["databaseID"]).remove();
                        stopsRef.child(stop["tourID"]).child(stop["databaseID"]).remove();
                        // remove from edit drop down
                        editStopSelect = document.getElementById("edit-existing-stop");
                        editStopSelect.value = stopName;
                        editStopSelect.remove(editStopSelect.selectedIndex);
                    }
                    // clear list of removed stops
                    removedStops = [];
                }

                document.getElementById("delete-tour").style.visibility = "hidden";
            } else { // adding a new tour to the database
                var databaseRef = firebase.database().ref();
                var toursRef = databaseRef.child("tours");
                var stopsRef = databaseRef.child("stops");
                //get reference to database for assets
                var assetsRef = databaseRef.child("assets");
                var adminOnlyRef = databaseRef.child("admin_only_tour");
                var storageRef = firebase.storage().ref();
                console.log("create new");


                // if we are in edit mode here, that means admin only status was changed and
                // we need to delete the old and recreate it
                if (editMode) {
                    // "changing tour visibility"
                    console.log("edit mode 721")
                    editMode = false;
                    startEdit = undefined;
                    existingTours[titleValue]["description"] = descriptionValue;
                    existingTours[titleValue]["stops"] = addedStops;
                    existingTours[titleValue]["isAdminOnly"] = isAdminOnly;
                    existingTours[titleValue]["preview"] = preview.src;
                    var tourId = existingTours[titleValue].databaseID;
                    var tour = existingTours[titleValue];
                    for (stopName of Object.keys(tour["stops"])) { // go through the stops
                        stop = tour["stops"][stopName];
                        for (mediaName of Object.keys(stop["media"])) { // go though the media assets
                            media = stop["media"][mediaName];
                            // delete the image from storage
                            var fileLoc = 'images/' + media['storage_name'];
                            storageRef.child(fileLoc).delete().then(function() {
                                // File deleted successfully
                                console.log("deleted ", fileLoc)
                            }).catch(function(error) {
                                // Uh-oh, an error occurred!
                                console.log("failed to delete ", fileLoc)
                            });
                            // delete the asset
                            assetsRef.child(media["stopID"]).remove();
                        }
                        // delete the stop
                        stopsRef.child(stop["tourID"]).remove();
                    }
                    console.log('tour["isAdminOnly"]', tour["isAdminOnly"], "749");
                    if (tour["isAdminOnly"] === "true") { // if it is now admin-only, is was all-users
                        toursRef.child(tour["databaseID"]).remove();
                        console.log("deleted an admin only tour 751");
                    } else { // if it is now all-users, it was admin-only 
                        // delete admin only tours
                        adminOnlyRef.child(tour["databaseID"]).remove();
                        console.log("deleted an all users tour 755");
                    }
                    removedStops = [];
                    document.getElementById("delete-tour").style.visibility = "hidden";
                } else { // for a new tour, add it to existingTours
                    existingTours[titleValue] = {
                        "description": descriptionValue,
                        "stops": addedStops,
                        "isAdminOnly": isAdminOnly,
                        "preview": preview.src
                    };

                    // make an option in the edit tour modal's dropdown
                    var editTourSelect = document.getElementById("edit-existing-tour");
                    var option = document.createElement('option');
                    option.text = option.value = titleValue;
                    editTourSelect.add(option);
                }

                // upload the preview image to the database
                var file = document.getElementById('tour-preview-image').files[0];
                if (file) { // if in edit mode, the file may not have been changed
                    console.log("file");
                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot);
                    var fileName = titleValue + extension;

                    // Create a root reference for uploading the preview image
                    var storageRef = firebase.storage().ref();
                    var fileLoc = 'images/' + fileName;
                    existingTours[titleValue]["storage_name"] = fileName; // be aware - this runs even if the upload fails.
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }

                // add the new tour to the database
                var newTourRef;
                console.log('existingTours[titleValue]["storage_name"]', existingTours[titleValue]["storage_name"]);
                console.log("titleValue", titleValue);
                if (isAdminOnly === "true") {
                    newTourRef  = adminOnlyRef.push({
                        description: descriptionValue,
                        length: numRows,
                        name: titleValue,
                        preview_image: existingTours[titleValue]["storage_name"]
                    });
                } else {
                    newTourRef = toursRef.push({
                        description: descriptionValue,
                        length: numRows,
                        name: titleValue,
                        preview_image: existingTours[titleValue]["storage_name"]
                    });
                }

                // saving all of the stop informations to the tour
                // first gets a reference to the tour database key
                var tourId = newTourRef.key;
                existingTours["databaseID"] = tourId; // remember the databaseID in tours
                var stop;
                //iterating through the stops
                for (stop of Object.keys(addedStops)) {
                    //pushes to the database the tour object
                    var newStopRef = stopsRef.child(tourId).push({
                        description: sanitizeForDatabase(addedStops[stop]["description"]),
                        lat: addedStops[stop]["location"]["lat"],
                        lng: addedStops[stop]["location"]["lng"],
                        name: addedStops[stop]["title"],
                        id: stop,
                        stop_order: addedStops[stop]["stop_order"]
                    });

                    //adding the stops from the tour
                    let stopId = newStopRef.key;
                    existingTours[titleValue]["stops"][stop]["databaseID"] = stopId;
                    existingTours[titleValue]["stops"][stop]["tourID"] = tourId;
                    var newAddedMedia = addedStops[stop]["media"];
                    var asset;

                    for(asset of Object.keys(newAddedMedia)) {
                        var newAssetsRef = assetsRef.child(stopId).child(newAddedMedia[asset].id).set({
                            description: newAddedMedia[asset]["caption"],
                            name: asset,
                            storage_name: newAddedMedia[asset]["storage_name"]
                        });
                        existingTours[titleValue]["stops"][stop]["media"][asset]["id"] = newAssetsRef.key;
                        existingTours[titleValue]["stops"][stop]["media"][asset]["stopID"] = stopId;
                    }
                }
            }
            clearTourFields();
            // navigate back to the home page
            $('#nav-pills a[href="#home-page"]').tab('show');
            hideCancelButton();
            showSignOutButton();
            currentTab = "home";
        }
    });

    // clicking a row in the stop table highlights it
    $('#stop-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // remove a stop item from the table
    $('#confirm-remove-stop').click(function() {
        var tableBody = document.getElementById("tour-stops");
        var selectedRow = document.querySelector('#tour-stops > .bg-info');
        var name = selectedRow.cells[1].innerHTML;
        tableBody.removeChild(selectedRow);
        var removedStopOrder = addedStops[name]["stop_order"];
        delete addedStops[name];
        // if we are editing a tour and the stop is already in the database
        if (startEdit === "tour" && stop["databaseID"] !== undefined) {
            removedStops.push(name);
        }

        // readjust the "stop_order" in addedStops
        for (stop of Object.keys(addedStops)) {
            if (addedStops[stop]["stop_order"] > removedStopOrder) {
                addedStops[stop]["stop_order"] = addedStops[stop]["stop_order"] - 1;
            }
        }

        // readd items to the table in order
        stopTableBody = document.getElementById("tour-stops");
        stopTableBody.innerHTML = "";
        var stops = Object.keys(addedStops);
        for (var i = 1; i <= stops.length; i++) {
            for (var j = 0; j < stops.length; j++) {
                if (addedStops[stops[j]]["stop_order"]===i) { // add items in order 1+
                    updateStopTable(stops[j]);
                }
            }
        }
    });

    // move an item up in the table
    $('#stop-up').click(function(){
        moveTableRowUp("tour-stops")
    });

    // move an item down in the table
    $('#stop-down').click(function(){
        moveTableRowDown("tour-stops")
    });

    $('#confirm-delete-tour').click(function() {
        var checkbox = document.getElementById("checkbox-delete-tour");
        if (checkbox.checked) { // if the checkbox to confirm they've read the warning message is checked
            // get the tour's name from the edit select in case they've changed it on the edit page
            editTourSelect = document.getElementById("edit-existing-tour");
            name = editTourSelect.value;
            tour = existingTours[name];
            // remove from edit tour drop down
            editTourSelect.remove(editTourSelect.selectedIndex);

            // references to be used to delete tour from database
            var databaseRef = firebase.database().ref();
            var toursRef = databaseRef.child('tours');
            var stopsRef = databaseRef.child("stops");
            var assetsRef = databaseRef.child("assets");
            var adminOnlyRef = databaseRef.child("admin_only_tour");
            var storageRef = firebase.storage().ref();

            for (stopName of Object.keys(tour["stops"])) { // go through the stops
                stop = tour["stops"][stopName];
                for (mediaName of Object.keys(stop["media"])) { // go though the media assets
                    media = stop["media"][mediaName];
                    // delete the image from storage
                    var fileLoc = 'images/' + media['storage_name'];
                    storageRef.child(fileLoc).delete().then(function() {
                        // File deleted successfully
                        console.log("deleted ", fileLoc)
                    }).catch(function(error) {
                        // Uh-oh, an error occurred!
                        console.log("failed to delete ", fileLoc)
                    });
                    // delete the asset
                    assetsRef.child(media["stopID"]).remove();
                    // remove from edit drop down
                    editMediaSelect = document.getElementById("edit-existing-media");
                    editMediaSelect.value = mediaName;
                    editMediaSelect.remove(editMediaSelect.selectedIndex);
                }
                // delete the stop
                stopsRef.child(stop["tourID"]).remove();
                // remove from edit drop down
                editStopSelect = document.getElementById("edit-existing-stop");
                editStopSelect.value = stopName;
                editStopSelect.remove(editStopSelect.selectedIndex);
            }
            // delete the tour preview image from storage
            var fileLoc = 'images/' + tour['storage_name'];
            storageRef.child(fileLoc).delete().then(function() {
                // File deleted successfully
                console.log("deleted ", fileLoc)
            }).catch(function(error) {
                // Uh-oh, an error occurred!
                console.log("failed to delete ", fileLoc)
            });

            if (tour["isAdminOnly"] === "true") { // delete admin only tours {
                adminOnlyRef.child(tour["databaseID"]).remove();
                console.log("deleted an admin only tour");
            } else {
                // delete the tour
                toursRef.child(tour["databaseID"]).remove();
                console.log("deleted an all users tour");
            }


            // clear fields, uncheck checkbox, hide modal, hide delete button, return to home
            clearTourFields();
            checkbox.checked = false;
            $('#delete-tour-popup').modal('hide');
            document.getElementById("delete-tour").style.visibility = "hidden";
            $('#nav-pills a[href="#home-page"]').tab('show');
            hideCancelButton();
            showSignOutButton();
            currentTab = "home";
        }
    });

    // MARK: stop page event listeners

    // On the stop page, the "Create new media" button
    // takes us to the media page
    $('#create-media').click(function(e){
        e.preventDefault();
        $('#nav-pills a[href="#media-page"]').tab('show');
        currentTab = "media";
    });

    // clicking a row in the media table highlights it
    $('#media-table').on('click', '.clickable-row', function(e) {
        $(this).addClass('bg-info').siblings().removeClass('bg-info');
    });

    // On the stop page, the "Save stop" button returns us
    // to the tour page
    $('#save-stop').click(function(e) {
        e.preventDefault();
        var title = document.getElementById("stop-title");
        /*//var description = getHtmlFromEditor();//document.getElementById("stop-description"); // here max - preparing to save
        var titleValue = title.value;
        var descriptionValue = getHtmlFromEditor();//description.value;*/
        //var description = document.getElementById("stop-description"); // here max - preparing to save
        var idField = document.getElementById("stop-id");
        var titleValue = title.value;
        var descriptionValue = getHtmlFromEditor();
        var idValue = idField.value;


        if (!titleValue) { // there must be a title
            $("#stop-title").popover('dispose');
            $("#stop-title").popover({ title: 'Error', content: "Title required"});
            $("#stop-title").popover('show');
        } else if (!idValue) {
            $("#stop-id").popover('dispose');
            $("#stop-id").popover({ title: 'Error', content: "id required"});
            $("#stop-id").popover('show');
        } else if (Object.keys(existingStops).includes(idValue) && !editMode) { // title must be unique unless in edit mode
            $("#stop-id").popover('dispose');
            $("#stop-id").popover({ title: 'Error', content: "Id must be unique"});
            $("#stop-id").popover('show');
        } else if (!selectedLocation) { // there must be a location
            $("#stop-map").popover('dispose');
            $("#stop-map").popover({ title: 'Error',
                                    content: "A location must be selected",
                                    offset: "85"});
            $("#stop-map").popover('show');
        } else {
            // save the stop
            // check that it is a new stop
            if (existingStops[idValue] === undefined) {
                existingStops[idValue] = {
                    "description": descriptionValue,
                    "media": addedMedia,
                    "location": {
                        lat: selectedLocation.position.lat(),
                        lng: selectedLocation.position.lng()
                    },
                    "id": idValue,
                    "title": titleValue
                };
            } else { //we are editing an existing stop
                existingStops[idValue]["description"] = descriptionValue;
                existingStops[idValue]["media"] = addedMedia;
                existingStops[idValue]["location"]["lat"] = selectedLocation.position.lat();
                existingStops[idValue]["location"]["lng"] = selectedLocation.position.lng();
                existingStops[idValue]["id"] = idValue;
                existingStops[idValue]["title"] = titleValue;
            }

            if (startEdit === "stop") { // we were editing a stop, return to home page
                $('#nav-pills a[href="#home-page"]').tab('show');
                hideCancelButton();
                showSignOutButton();
                currentTab = "home";
                editMode = false;
                startEdit = undefined;

                //post to the DB
                if (existingStops[idValue].databaseID !== undefined) {
                    var stopRef = firebase.database().ref("stops");
                    stopRef.child(existingStops[idValue].tourID).child(existingStops[idValue].databaseID).set({
                        description: sanitizeForDatabase(descriptionValue),
                        id: idValue,
                        lat: existingStops[idValue]["location"]["lat"],
                        lng: existingStops[idValue]["location"]["lng"],
                        name: titleValue,
                        stop_order: existingStops[idValue].stop_order
                    });
                    for (mediaName of Object.keys(addedMedia)) {
                        media = existingMedia[mediaName];
                        // determine if this is a new media item for an edited tour
                        if (!media["stopID"]) {
                            var assetRef = firebase.database().ref().child("assets");
                            assetRef.child(existingStops[idValue]["databaseID"]).child(media["id"]).set({
                                description: media["caption"],
                                name: mediaName,
                                storage_name: media["storage_name"]
                            });
                            existingMedia[mediaName]["stopID"] = existingStops[idValue]["databaseID"];
                        }
                    }
                }

                // delete removed media from the database
                // references to be used to delete  from database
                var databaseRef = firebase.database().ref();
                var assetsRef = databaseRef.child("assets");
                var storageRef = firebase.storage().ref();

                for (mediaName of removedMedia) { // go though the media assets
                    media = existingMedia[mediaName];
                    // delete the image from storage
                    var fileLoc = 'images/' + media['storage_name'];
                    storageRef.child(fileLoc).delete().then(function() {
                        // File deleted successfully
                        console.log("deleted ", fileLoc)
                    }).catch(function(error) {
                        // Uh-oh, an error occurred!
                        console.log("failed to delete ", fileLoc)
                    });
                    // delete the asset
                    assetsRef.child(media["stopID"]).child(media["id"]).remove();
                    // remove from edit drop down
                    editMediaSelect = document.getElementById("edit-existing-media");
                    editMediaSelect.value = mediaName;
                    editMediaSelect.remove(editMediaSelect.selectedIndex);
                }
                removedMedia = [];

            } else { // new stop, add stop to table, navigate back to the tour page
                // make an option in the edit stop modal's dropdown
                var editStopSelect = document.getElementById("edit-existing-stop");
                var option = document.createElement('option');
                option.text = option.value = idValue;
                editStopSelect.add(option);

                $('#nav-pills a[href="#tour-page"]').tab('show');
                currentTab = "tour";
                updateStopTable(idValue);
                initTourMap();
            }
            clearStopFields();
        }
    });

    // Remove the warning next time the stop-title box is clicked
    $('#stop-title').on('input', function(e) {
        $("#stop-title").popover('dispose');
    });

    // Remove the warning next time the stop-id box is clicked
    $('#stop-id').on('input', function(e) {
        $("#stop-id").popover('dispose');
    });


    // remove a media item from the table
    $('#confirm-remove-media').click(function() {
        var tableBody = document.getElementById("stop-media");
        var selectedRow = document.querySelector('#stop-media > .bg-info');
        var name = selectedRow.cells[1].innerHTML;
        tableBody.removeChild(selectedRow);
        //remove media from description
        removeMediaFromDescription(name);
        //remove media from media for description selector
        removeMediaFromDescriptionSelector(name);
        delete addedMedia[name];
        // if we are editing a stop and the media has been uploaded to the database
        if (startEdit === "stop" && existingMedia[name]["stopID"] !== undefined) {
            removedMedia.push(name);
        }
    });

    // MARK: media page event listeners

    // On the media page, the "Upload Media" button
    $('#upload-media').click(function(e) {
        e.preventDefault();

        var title = document.getElementById("media-title");
        var caption = document.getElementById("media-caption");
        var preview = document.getElementById('media-preview');
        var titleValue = title.value;
        var captionValue = caption.value;
        var src = preview.src.substring(preview.src.length - 10);
        if (!titleValue) { // there must be a title
            $("#media-title").popover('dispose');
            $("#media-title").popover({ title: 'Error', content: "Title required"});
            $("#media-title").popover('show');
        } else if (Object.keys(existingMedia).includes(titleValue) && !editMode) { // title must be unique
            $("#media-title").popover('dispose');
            $("#media-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#media-title").popover('show');
        } else if (src ==="index.html") {
            $("#media-item").popover('dispose');
            $("#media-item").popover({ title: 'Error', content: "Image or Video required", placement: "bottom"});
            $("#media-item").popover('show');
        } else {
            if (startEdit === "media") { // we were editing the item
                var assetId = existingMedia[titleValue]["id"];
                var stopId = existingMedia[titleValue]["stopID"];
                var assetRef = firebase.database().ref().child("assets");

                var file = document.getElementById('media-item').files[0];
                if (file) { // if there is an image, upload it
                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot + 1);

                    // upload the image
                    // Create a root reference
                    var storageRef = firebase.storage().ref();
                    var fileName = titleValue + "." + extension;
                    existingMedia[titleValue]["storage_name"] = fileName;
                    var fileLoc = 'images/' + fileName;
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }

                assetRef.child(stopId).child(assetId).set({
                    description: captionValue,
                    name: titleValue,
                    storage_name: titleValue + "." + name.substring(lastDot + 1)
                });

                $('#nav-pills a[href="#home-page"]').tab('show');
                hideCancelButton();
                showSignOutButton();
                currentTab = "home";
                editMode = true;
                startEdit = undefined;
            } else { // we are creating a new item
                // save the media item
                let assetId = uuidv4();
                existingMedia[titleValue] = {"media-item": preview.src, "caption": captionValue, "id": assetId};
                var file = document.getElementById('media-item').files[0];
                if (file) { // if there is an image, upload it
                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot + 1);

                    // upload the image
                    // Create a root reference
                    var storageRef = firebase.storage().ref();
                    var fileName = titleValue + "." + extension;
                    existingMedia[titleValue]["storage_name"] = fileName;
                    console.log(fileName);
                    var fileLoc = 'images/' + fileName;
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }

                 // make an option in the edit media modal's dropdown
                 var editMediaSelect = document.getElementById("edit-existing-media");
                 var option = document.createElement('option');
                 option.text = option.value = titleValue;
                 editMediaSelect.add(option)

                 // navigate back to the stop page
                 $('#nav-pills a[href="#stop-page"]').tab('show');
                 currentTab = "stop";
                 initStopMap();
                 updateMediaTable(titleValue, true);

                 // make an option in the add media to stop description
                 var existingMediaForDescription = document.getElementById("existing-media-for-description");
                 var option = document.createElement('option');
                 option.text = option.value = titleValue;
                 existingMediaForDescription.add(option);
            }
            clearMediaFields();
        }
    });

    // Remove the warning next time the media-title box is clicked
    $('#media-title').on('input', function() {
        $("#media-title").popover('dispose');
    });

    $('#media-item').on('input', function() {
        $("#media-item").popover('dispose');
    });

    $('#confirm-add-media-to-description').click(function() {
        var existingMediaSelect = document.getElementById("existing-media-for-description");
        var selectedMedia = existingMediaSelect.value;
        if (selectedMedia in existingMedia) {
            let src = existingMedia[selectedMedia]['media-item'];
            let caption = existingMedia[selectedMedia]['caption'];
            let id = existingMedia[selectedMedia]['id'];

            //add the image at the cursor location
            if (quillEditor !== undefined) {
                //get cursor location
                var index = quillEditor.getLength() - 1;
                if (cursorLocation !== undefined) {
                    index = cursorLocation.index;
                }

                let initialLength = quillEditor.getLength();
                quillEditor.insertEmbed(index, 'image', {
                    src: src,
                    id: id,
                    class: 'quill-editor-img'
                });

                let curLength = quillEditor.getLength();
                let offset = curLength - initialLength;
                quillEditor.insertEmbed(index + offset, 'caption', {
                    id: 'caption_' + id,
                    text: caption,
                    class: 'quill-editor-caption'
                });
            }
        }
        $('#add-image-to-description-modal').modal('hide');
    });

    //initialize the quill rich text editor for the stop description
    initializeQuillEditor();
});


// MARK: functions to remove warnings
// when the user leaves that tab

function removeHomeWarnings() {
    $("#edit-existing-tour").popover('dispose');
    $("#edit-existing-stop").popover('dispose');
    $("#edit-existing-media").popover('dispose');
}

function removeTourWarnings() {
    $("#tour-title").popover('dispose');
    $("#tour-preview-image").popover('dispose');
}

function removeStopWarnings() {
    $("#existing-media").popover('dispose');
    $("#stop-id").popover('dispose');
    $("#stop-map").popover('dispose');

}

function removeMediaWarnings() {
    $("#media-title").popover('dispose');
    $("#media-item").popover('dispose');
}

// functions for changing sign-out and cancel visibility
function showCancelButton() {
    document.getElementById('cancel-back').style.visibility = "visible";
}

function hideCancelButton() {
    document.getElementById('cancel-back').style.visibility = "hidden";
}

function showSignOutButton() {
    document.getElementById('sign-out').style.visibility = "visible";
}

function hideSignOutButton() {
    document.getElementById('sign-out').style.visibility = "hidden";
}
// MARK: functions to sort table items

function moveTableRowDown(tableName) {
    table = document.getElementById(tableName);

    // get the selected table row
    var selectedRow = document.querySelector('#' + tableName + ' > .bg-info');
    var name = selectedRow.cells[1].innerHTML;
    var selectedRowIndex = selectedRow.rowIndex;
    var numRows = table.rows.length;


    if (selectedRowIndex <= numRows) { // make sure it isn't the last row (indexing starts at 1)
        // get the table row beneath it
        var rowBelow = table.rows[selectedRowIndex];

        // swap the two rows
        selectedRow.cells[1].innerHTML = rowBelow.cells[1].innerHTML;
        rowBelow.cells[1].innerHTML = name;

        // change order attributes in data model
        if (tableName === "tour-stops") {
            addedStops[name]["stop_order"] = selectedRowIndex + 1;
            addedStops[selectedRow.cells[1].innerHTML]["stop_order"] = selectedRowIndex;
        }

        // select the swapped row
        $(rowBelow).addClass('bg-info').siblings().removeClass('bg-info');
    }
}

function moveTableRowUp(tableName) {
    table = document.getElementById(tableName);

    // get the selected table row
    var selectedRow = document.querySelector('#' + tableName + ' > .bg-info');
    var name = selectedRow.cells[1].innerHTML;
    var selectedRowIndex = selectedRow.rowIndex; // indexing here starts at 1

    if (selectedRowIndex > 1) { // make sure it isn't the first row (indexing starts at 1)
        // get the table row beneath it
        var rowAbove = table.rows[selectedRowIndex-2]; // js array, indexing starts at 0 as normal

        // swap the two rows
        selectedRow.cells[1].innerHTML = rowAbove.cells[1].innerHTML;
        rowAbove.cells[1].innerHTML = name;

        if (tableName === "tour-stops") {
            addedStops[name]["stop_order"] = selectedRowIndex - 1;
            addedStops[selectedRow.cells[1].innerHTML]["stop_order"] = selectedRowIndex;
        }

        // select the swapped row
        $(rowAbove).addClass('bg-info').siblings().removeClass('bg-info');
    }
}


// MARK: functions to clear input fields

function clearMediaFields() {
    var title = document.getElementById("media-title");
    // var description = document.getElementById("media-description");
    var caption = document.getElementById("media-caption");
    // clear the fields
    title.value = "";
    // description.value = "";
    caption.value = ""
    document.getElementById("media-item").value = "";
    document.getElementById("media-preview").src = "";
}

function clearStopFields() {
    var title = document.getElementById("stop-title"); // here max
    var idField = document.getElementById("stop-id");
    // clear the fields
    if (quillEditor != undefined) {
        quillEditor.setText("");
    }
    title.value = "";
    idField.value = "";
    selectedLocation = undefined;
    // clear table
    mediaTableBody = document.getElementById("stop-media");
    mediaTableBody.innerHTML = "";
    addedMedia = {};
    //clear the image select from description
    var select = $('#existing-media-for-description');
    if (select !== null) {
        // select.empty();
        select.append($('<option>', {
            value: 1,
            text: 'Select a media item...'
        }));
    }
}

function clearTourFields() {
    // clear the fields
    document.getElementById("tour-title").value = "";
    document.getElementById("tour-description").value = "";

    // clear table
    document.getElementById("tour-stops").innerHTML = "";
    addedStops = {};

    //clear preview image
    document.getElementById("tour-preview-image").value = "";
    document.getElementById("preview-image-preview").src = "";
}

// triggered by onchange on the html element media-item
function loadMedia(e) {
    var preview = document.getElementById('media-preview');
    var imgURL = URL.createObjectURL(e.target.files[0]);
    preview.src = setImageOrientation(imgURL, preview);
}

// triggered by onchange on the html element tour-preview-image
function loadPreview(e) {
    var preview = document.getElementById('preview-image-preview');
    var imgURL = URL.createObjectURL(e.target.files[0]);
    preview.src = setImageOrientation(imgURL, preview);
}

function setImageOrientation(imgURL, preview) {
    var img = new Image();
    img.src = imgURL;
    // change orientation (simplified)
    // TODO: show images at a reasonable size proportional
    // to their original size
    img.onload = function() {
        if (img.height > img.width) { // portrait
            preview.width = "300";
            preview.height = "350";
        } else if (img.height < img.width) { // landscape
            preview.width = "400";
            preview.height = "250";
        } else { // square
            preview.width = "300";
            preview.height = "300";
        }
    };
    return imgURL;
}

// MARK: functions to update the tables when
//       an item is added
function updateStopTable(id) {
    var stopTable = document.getElementById("tour-stops");
    var row = stopTable.insertRow(-1); // put the new row at the bottom
    row.className = 'clickable-row';

    // add row number
    var numRows = stopTable.rows.length;
    var cellRowNumber = row.insertCell(0);
    var numberImageFile = "stopNumberImages/bwr" + numRows + ".jpg";
    cellRowNumber.innerHTML = "<img src=" + numberImageFile + " >"

    // add to added media, add stop_order
    addedStops[id] = existingStops[id];
    addedStops[id]["stop_order"] = numRows;

    // add media name
    var cell = row.insertCell(1);
    cell.innerHTML = id;

    // TODO: Add event listeners when a stop is double clicked
    // to display the tour's description and a list of
    // images and their descriptions in the popup

    // add event listeners when a stop is single clicked to show its
    // location on the map
    row.addEventListener('click', function () {
        var id = this.cells[1].innerHTML;
        var stop = existingStops[id];
        replaceMarkerAndPanTo(new google.maps.LatLng(stop.location, stop.location));
    });
}

function updateMediaTable(name, userAdded) {
    // name is the name of the media item
    // userAdded=true if the user manually created and confirmed
    // userAdded=false if updating to edit a stop
    var mediaTable = document.getElementById("stop-media");
    var row = mediaTable.insertRow(-1); // put the new row at the bottom
    row.className = 'clickable-row';

    var numRows = mediaTable.rows.length;
    var cellRowNumber = row.insertCell(0);

    // add media name
    var cell = row.insertCell(1);
    cell.innerHTML = name;

    if (userAdded) {
        addedMedia[name] = JSON.parse(JSON.stringify(existingMedia[name])); // avoid errors due to shallow copy
    }

    row.dataset.target = '#media-table-popup'; // set data-target

    // pull up the modal when double clicked
    row.addEventListener('dblclick', function () {
        $('#media-table-popup').modal('toggle');
        var selectedRow = document.querySelector('#stop-media > .bg-info');
        var name = selectedRow.cells[1].innerHTML;

        // title the modal
        var modalTitle = document.getElementById("media-table-modal-title");
        modalTitle.innerHTML = name;

        // show the original caption
        var modalCaption = document.getElementById("media-pop-up-caption");
        modalCaption.innerHTML = addedMedia[name]["caption"];

        // preview the image
        var modalImage = document.getElementById("media-pop-up-preview");
        modalImage.src = setImageOrientation(addedMedia[name]["media-item"], modalImage);

        var modalImage = document.getElementById("media-pop-up-preview");
        modalImage.src = setImageOrientation(addedMedia[name]["media-item"], modalImage);
        // }
    });
}

// MARK: map functions

function initTourMap() {
    map = new google.maps.Map(document.getElementById("tour-map"), {
        center: {
            lat: 47.667122,
            lng: -117.400617
        },
        zoom: 13
    });

    if (detectedLocation) { // use the current location we already have
        detectedLocation = new google.maps.Marker({
            position: detectedLocation["position"], // users current position
            map: map,
            icon: { // use a blue marker for current location
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
        });
        map.setCenter(detectedLocation["position"]);
    } else if (navigator.geolocation) { // Try HTML5 geolocation.
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos)
            detectedLocation = new google.maps.Marker({
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
    if (selectedLocation) { // readd a previous selected location
        selectedLocation.setMap(map);
        map.panTo(selectedLocation.getPosition()); // TODO: this line doesn't work??
    }
    if (detectedLocation) { // use the current location we already have
        console.log("using current location")
        detectedLocation = new google.maps.Marker({
            position: detectedLocation["position"], // users current position
            map: map,
            icon: { // use a blue marker for current location
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
        });
        map.setCenter(detectedLocation["position"]);
    } else if (navigator.geolocation) { // Try HTML5 geolocation.
        console.log("using html5 geolocation")
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            detectedLocation = new google.maps.Marker({
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
        console.log("something went wrong")
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }


    // on the stop map, place a marker where the user clicks
    map.addListener('click', function (e) {
        replaceMarkerAndPanTo(e.latLng);
        $("#stop-map").popover('dispose');
    });
}


function replaceMarkerAndPanTo(latLng) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map
    });
    if (selectedLocation) { // remove a previous selected location
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

function initializeQuillEditor() {
    let AlignStyle = Quill.import('attributors/style/align')
    let BackgroundStyle = Quill.import('attributors/style/background')
    let ColorStyle = Quill.import('attributors/style/color')
    let DirectionStyle = Quill.import('attributors/style/direction')
    let FontStyle = Quill.import('attributors/style/font')
    var SizeStyle = Quill.import('attributors/style/size');
    delete SizeStyle.whitelist;

    Quill.register(AlignStyle, true);
    Quill.register(BackgroundStyle, true);
    Quill.register(ColorStyle, true);
    Quill.register(DirectionStyle, true);
    Quill.register(FontStyle, true);
    Quill.register(SizeStyle, true);

    var toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons

        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent

        [{ 'size': ['12px', false, '30px', '40px'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'align': [] }],
        ['image']                                      // remove formatting button
    ];
    quillEditor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: toolbarOptions,
                handlers: {
                    'image': imageButtonHandler
                }
            },
            clipboard: {
                matchVisual: false
            }
        }
    });

    //dont require image addresses to be sanitized
    var Image = Quill.import('formats/image');
    Image.sanitize = function(url) {
        return url; // You can modify the URL here
    };

    var Delta = Quill.import('delta');
    /*quillEditor.clipboard.addMatcher('p', function(node, delta) {
        var classVal = node.classList.value;

        if (classVal.includes('quill-editor-caption')) {
            var embed = {};
            var val = {}
            val['id'] = node['id'];
            val['class'] = node['classList'].value;
            val['text'] = node['innerText']
            embed['caption'] = val;
            return new Delta().insert(embed);
        }
        return delta;
    });*/

    //create new image blot so that we can insert and id into the image html tag
    registerImageBlotToQuill();
    registerCaptionBlotToQuill();
}


function registerImageBlotToQuill() {
    var BlockEmbed = Quill.import('blots/block/embed');
    class ImageBlot extends BlockEmbed {
        static create(data) {
            const node = super.create(data);
            node.setAttribute('src', data.src);
            node.setAttribute('id', data.id);
            node.setAttribute('class', data.class)
            return node;
        }
        static value(node) {
            return {
                src: node.src,
                id: node.id,
                class: node.getAttribute('class')
            }
        }
    }
    ImageBlot.blotName = 'image';
    ImageBlot.tagName = 'img';
    Quill.register({ 'formats/image': ImageBlot });
}

function registerCaptionBlotToQuill() {
    var BlockEmbed = Quill.import('blots/block/embed');
    class CaptionBlot extends BlockEmbed {
        static create(value) {
            let node = super.create();
            node.setAttribute('id', value.id);
            node.setAttribute('class', value.class);
            node.innerText = value.text;
            return node;
        }
        static value(node) {
            return {
                id: node.id,
                class: node.classList.value,
                text: node.innerText
            };
        }
    }
    CaptionBlot.blotName = 'caption';
    CaptionBlot.tagName = 'p';
    CaptionBlot.className = 'quill-editor-caption';
    Quill.register({'formats/caption': CaptionBlot});
}

/*
    function called when the image icon button is pressed in the text editor
*/
function imageButtonHandler() {
    //set the current cursor location
    if (quillEditor !== undefined) {
        cursorLocation = quillEditor.getSelection();
    }
    //open the modal to pick the image
    $('#add-image-to-description-modal').modal({});
}

function getHtmlFromEditor() {
    let html = quillEditor.root.innerHTML;
    return html;
}

function sanitizeForDatabase(html) {
    //replace images and captions with just the image id
    html = removeImagesFromHtml(html);
    //replace tabs with 4 spaces so they actually show up
    html = html.replace(/\t/, "&nbsp;&nbsp;&nbsp;&nbsp;");
    //replace double quotes with single quotes
    html = html.replace(/"/g, "'");
    return html;
}

function removeImagesFromHtml(html) {
    if (existingMedia != undefined) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        for (var key in existingMedia) {
            var imgElem = doc.getElementById(existingMedia[key].id);
            var pElem = doc.getElementById("caption_" + existingMedia[key].id);
            if (imgElem !== null) {
                imgElem.removeAttribute('src');
                imgElem.removeAttribute('style');
            }
            var body = doc.querySelector('body');
            if (pElem !== null) {
                if (body !== null) {
                    body.removeChild(pElem);
                }
            }
        }
        if (body !== null) {
            return body.innerHTML;
        }
    }
    return html;
}

function removeMediaFromDescription(name) {
    //get the media
    let media = addedMedia[name];
    //get the html from description
    if (quillEditor != undefined) {
        var html = getHtmlFromEditor();
        var doc = new DOMParser().parseFromString(html, "text/html");
        //determine if the media being removed is in the description
        var imgElem = doc.getElementById(media.id);
        var pElem = doc.getElementById("caption_" + media.id);

        if (imgElem != null) {
            imgElem.remove();
        }
        if (pElem != null) {
            pElem.remove()
        }

        var body = doc.querySelector('body');
        if (body != null) {
            html = body.innerHTML;
            const delta = quillEditor.clipboard.convert(html);
            quillEditor.setContents(delta);
        }
    }
}

function removeMediaFromDescriptionSelector(name) {
    var select = document.getElementById('existing-media-for-description');
    if (select !== null) {
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === name) {
                select.remove(i);
            }
            else if (select.options[i].id === 'select-media-default') {
                select.options[i].selected = true;
            }
        }
    }
}

function getImageNamed(imageName, callback) {
  firebase.storage().ref("images/" + imageName).getDownloadURL().then(function(url) {
    callback(url);
  });
}

function reenterSavedDescription(selectedStop) {
    var CaptionBlot = Quill.import('formats/caption');
    let description = existingStops[selectedStop]["description"]
    var doc = new DOMParser().parseFromString(description, "text/html");
    for (var i = 0; i < doc.images.length; i++) {
        if (!doc.images[i].src.includes("blob")) {
            // this image has been fetched from the database. we need the replace the src
            for (media in addedMedia) {
                if (addedMedia[media].id === doc.images[i].id) {
                    doc.images[i].src = addedMedia[media]["media-item"]
                    //add captions
                    var captionNode = CaptionBlot.create({
                        id: 'caption_' + addedMedia[media].id,
                        text: addedMedia[media].caption,
                        class: 'quill-editor-caption'
                    });
                    //add this under the image
                    doc.images[i].insertAdjacentElement("afterend",captionNode);
                }
            }
        }
    }
    var body = doc.querySelector('body');
    if (body != null) {
        const delta = quillEditor.clipboard.convert(body.innerHTML);
        quillEditor.setContents(delta);
    }
    else {
        const delta = quillEditor.clipboard.convert(description);
        quillEditor.setContents(delta);
    }
}

//runs when login button is clicked
function login() {
    //gets email and password field
    var userEmail = document.getElementById("email_field").value;
    var userPass = document.getElementById("password_field").value;
    //clear password and username field
    document.getElementById("email_field").value = "";
    document.getElementById("password_field").value = "";
    //checks with firebase authentication service
    firebase.auth().signInWithEmailAndPassword(userEmail, userPass).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        //already has pre built error alerts through firebase
        window.alert("Error : " + errorMessage);
    });
}
function logout() {
    firebase.auth().signOut();
}

// let curLength = quillEditor.getLength();
//                 let offset = curLength - initialLength;
//                 quillEditor.insertEmbed(index + offset, 'caption', {
//                     id: 'caption_' + id,
//                     text: caption,
//                     class: 'quill-editor-caption'
//                 });

// function handler(event) {
//     let blot = Parchment.find(event.target);
//     let index = blot.offset(quill.scroll);
//   }
