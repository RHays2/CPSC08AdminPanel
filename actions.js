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
            $("#edit-existing-tour").click(); // bring up the popover
        } else {
            clearTourFields();

            document.getElementById("tour-title").value = selectedTour;
            document.getElementById("tour-description").value = existingTours[selectedTour]["description"];
            document.getElementById("admin-only").value = existingTours[selectedTour]["visibility"];

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
            $("#edit-existing-stop").click(); // bring up the popover
        } else {
            clearStopFields();
            document.getElementById("stop-title").value = selectedStop;
            // here max  reenter saved description
            document.getElementById("stop-description").value = existingStops[selectedStop]["description"];
            // add media back to the table
            addedMedia = JSON.parse(JSON.stringify(existingStops[selectedStop]["media"]));
            var mediaItems = Object.keys(addedMedia);
            for (var i = 1; i <= mediaItems.length; i++) {
                for (var j = 0; j < mediaItems.length; j++) {
                    if (addedMedia[mediaItems[j]]["media_order"]===i) { // add items in order 1+
                        updateMediaTable(mediaItems[j], false);
                    }
                }
            }

            $('#edit-which-stop').modal('hide');
            $('#nav-pills a[href="#stop-page"]').tab('show');
            initStopMap();
            replaceMarkerAndPanTo(existingStops[selectedStop]["location"]);
            editMode = true;
            startEdit = "stop";
        }
    });

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
            $("#edit-existing-media").click(); // bring up the popover
        } else {
            clearMediaFields();
            document.getElementById("media-title").value = selectedMedia;
            console.log(document.getElementById("media-title").value);
            // document.getElementById("media-description").value = existingMedia[selectedMedia]["description"];
            document.getElementById("media-preview").src = existingMedia[selectedMedia]["media-item"];
            document.getElementById("media-caption").value = existingMedia[selectedMedia]["caption"];
            $('#edit-which-media').modal('hide');
            $('#nav-pills a[href="#media-page"]').tab('show');
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

        // TODO: when editing, this things there isn't a title
        // We could make the title unchangeable in editing and ignore this check
        // Or we need to figure out a way to make this check when the value is set in js
        if (!titleValue) { // there must be a title
            $("#tour-title").popover('dispose');
            $("#tour-title").popover({ title: 'Error', content: "Title required"});
            $("#tour-title").click();
        } else if (Object.keys(existingTours).includes(titleValue) && !editMode) { // title must be unique unless in editMode
            $("tour-title").popover('dispose');
            $("#tour-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#tour-title").click();
        } else {
            // save the tour
            var visibility = document.getElementById("admin-only").value;
            existingTours[titleValue] = {"description": descriptionValue, "stops": addedStops, "visibility" : visibility};

            if (editMode) {
                editMode = false;
                startEdit = undefined;
                document.getElementById("delete-tour").style.visibility = "hidden";
            } else {
                // make an option in the edit tour modal's dropdown
                var editTourSelect = document.getElementById("edit-existing-tour");
                var option = document.createElement('option');
                option.text = option.value = titleValue;
                editTourSelect.add(option);

                // TODO: require image
                var file = document.getElementById('tour-preview-image').files[0];
                if (file) { // if there is an image, upload it
                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot + 1);

                    // Create a root reference
                    var storageRef = firebase.storage().ref();
                    var fileName = titleValue + "." + extension;
                    console.log(fileName);
                    var fileLoc = 'images/' + fileName;
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }

                // TODO: upload entire tour
                var databaseRef = firebase.database().ref();
                var toursRef = databaseRef.child("tours");
                /*toursRef.push({

                });*/
                var id = toursRef.push({
                  description: descriptionValue,
                  length: numRows,
                  name: titleValue,
                  preview_image: fileName
                })


            }
            clearTourFields();

            // navigate back to the home page
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
            $("#existing-stops").popover('dispose');
            $("#existing-stops").popover({ title: 'Error', content: "This stop was already added to the tour"});
            $("#existing-stops").click(); // bring up the popover
        } else {
            updateStopTable(selectedStop);
            // restore default for the select existing media dropdown
            document.getElementById("select-stop-default").selected = true;
            $('#add-stop-popup').modal('hide');
        }
    });

    // Remove the warning next time the existing-stops dropdown box is changed
    $('#existing-stops').on('change', function() {
        $("#existing-stops").popover('dispose');
    });
    // Remove the warning next time when existing-media modal is closed
    $('#add-stop-popup').on('hide.bs.modal', function() {
        $("#existing-stops").popover('dispose');
    });

    // remove a stop item from the table
    $('#confirm-remove-stop').click(function() {
        var tableBody = document.getElementById("tour-stops");
        var selectedRow = document.querySelector('#tour-stops > .bg-info');
        var name = selectedRow.cells[1].innerHTML;
        tableBody.removeChild(selectedRow);
        delete addedStops[name];
    });

    // move an item up in the table
    $('#stop-up').click(function(){
        moveTableRowUp("tour-stops")
    });

    // move an item down in the table
    $('#stop-down').click(function(){
        moveTableRowDown("tour-stops")
    });

    $('#confirm-delete-stop').click(function() {
        // TODO: check if checkbox is clicked, close modal if so
        var checkbox = document.getElementById("checkbox-delete-stop");
        var checked = checkbox.checked;
        if (checked) {
            // TODO: delete tour from database

            // clear fields, uncheck checkbox, hide modal, hide delete button, return to home
            clearTourFields();
            checkbox.checked = false;
            $('#delete-tour-popup').modal('hide');
            document.getElementById("delete-tour").style.visibility = "hidden";
            $('#nav-pills a[href="#home-page"]').tab('show');
        }
    });

    // MARK: stop page event listeners

    // On the stop page, the "Create new media" button
    // takes us to the media page
    $('#create-media').click(function(e){
        e.preventDefault();
        // clearMediaFields(); // TODO: is this expected behavior?
        $('#nav-pills a[href="#media-page"]').tab('show');
    });



    // On the stop page, the "Save stop" button returns us
    // to the tour page
    $('#save-stop').click(function(e) {
        e.preventDefault();

        var title = document.getElementById("stop-title");
        var description = document.getElementById("stop-description"); // here max - preparing to save
        var titleValue = title.value;
        var descriptionValue = description.value;

        if (!titleValue) { // there must be a title
            $("#stop-title").popover('dispose');
            $("#stop-title").popover({ title: 'Error', content: "Title required"});
            $("#stop-title").click();
        } else if (Object.keys(existingStops).includes(titleValue) && !editMode) { // title must be unique unless in edit mode
            $("#stop-title").popover('dispose');
            $("#stop-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#stop-title").click();
        } else if (!selectedLocation) { // there must be a location
            $("#stop-map").popover('dispose');
            $("#stop-map").popover({ title: 'Error',
                                    content: "A location must be selected",
                                    offset: "85"});
            $("#stop-map").click();
        } else {
            // save the stop
            existingStops[titleValue] = { // here max  creating the object inc the description
                "description": descriptionValue,
                "media": addedMedia,
                "location": {
                    lat: selectedLocation.position.lat(),
                    lng: selectedLocation.position.lng()
                }
            };
            clearStopFields();

            if (startEdit == "stop") { // we were editing a stop, return to home page
                $('#nav-pills a[href="#home-page"]').tab('show');
                editMode = false;
                startEdit = undefined;
            } else { // make drop down options, navigate back to the tour page
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

                $('#nav-pills a[href="#tour-page"]').tab('show');
                initTourMap()
                $('#add-stop-popup').modal('show'); // bring back up the modal
            }

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
            $("#existing-media").popover('dispose');
            $("#existing-media").popover({ title: 'Error', content: "This media was already added to the stop"});
            $("#existing-media").click(); // bring up the popover
        } else {
            updateMediaTable(selectedMedia, true);
            // restore default for the select existing media dropdown
            document.getElementById("select-media-default").selected = true;
            $('#add-media-popup').modal('hide');
        }
    });

    // Remove the warning next time the existing-media dropdown box is changed
    $('#existing-media').on('change', function() {
        $("#existing-media").popover('dispose');
    });
    // Remove the warning next time when existing-media modal is closed
    $('#add-media-popup').on('hide.bs.modal', function() {
        $("#existing-media").popover('dispose');
    });

    // remove a media item from the table
    $('#confirm-remove-media').click(function() {
        var tableBody = document.getElementById("stop-media");
        var selectedRow = document.querySelector('#stop-media > .bg-info');
        var name = selectedRow.cells[1].innerHTML;
        tableBody.removeChild(selectedRow);
        delete addedMedia[name];
    });

    // move an item up in the table
    $('#media-up').click(function(){
       moveTableRowUp("stop-media")
    });

    // move an item down in the table
    $('#media-down').click(function(){
        moveTableRowDown("stop-media")
    });

    // MARK: media page event listeners

    // On the media page, the "Upload Media" button
    $('#upload-media').click(function(e) {
        e.preventDefault();

        var title = document.getElementById("media-title");
        // var description = document.getElementById("media-description");
        var caption = document.getElementById("media-caption");
        var titleValue = title.value;
        // var descriptionValue = description.value;
        var captionValue = caption.value;
        if (!titleValue) { // there must be a title
            $("#media-title").popover('dispose');
            $("#media-title").popover({ title: 'Error', content: "Title required"});
            $("#media-title").click();
        } else if (Object.keys(existingMedia).includes(titleValue) && !editMode) { // title must be unique
            $("#media-title").popover('dispose');
            $("#media-title").popover({ title: 'Error', content: "Title must be unique"});
            $("#media-title").click();
        } else {
            // save the media item
            var preview = document.getElementById('media-preview');
            // existingMedia[titleValue] = {"description": descriptionValue, "media-item": preview.src, "caption":captionValue}; // TODO: add image
            existingMedia[titleValue] = {"media-item": preview.src, "caption": captionValue};
            if (startEdit == "media") { // we were editing the item
                $('#nav-pills a[href="#home-page"]').tab('show');
                editMode = true;
                startEdit = undefined;
            } else { // we are creating a new item
                var file = document.getElementById('media-item').files[0];
                if (file) { // if there is an image, upload it

                    var name = file.name;
                    var lastDot = name.lastIndexOf('.');
                    var extension = name.substring(lastDot + 1);

                    // Create a root reference
                    var storageRef = firebase.storage().ref();
                    var fileName = titleValue + "." + extension;
                    console.log(fileName);
                    var fileLoc = 'images/' + fileName;
                    // create a child for the new file
                    var spaceRef = storageRef.child(fileLoc);
                    spaceRef.put(file).then(function(snapshot) {
                        console.log('Uploaded!');
                    });
                }
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

                 // navigate back to the stop page
                 $('#nav-pills a[href="#stop-page"]').tab('show');
                 initStopMap();
                 $('#add-media-popup').modal('show'); // bring back up the modal
                 $("#existing-media").popover('dispose'); // hide the warning about repeat media
                                                     // if it exists
            }
            clearMediaFields();
        }
    });

    // Remove the warning next time the media-title box is clicked
    $('#media-title').on('input', function() {
        $("#media-title").popover('dispose');
    });
});


// MARK: functions to remove warnings
// when the user leaves that tab

function removeHomeWarnings() {
    $("#edit-existing-tour").popover('dispose');
    $("#edit-existing-stop").popover('dispose');
    $("#edit-existing-media").popover('dispose');
}

function removeTourWarnings() {
    $("#existing-stops").popover('dispose');
    $("#tour-title").popover('dispose');
}

function removeStopWarnings() {
    $("#existing-media").popover('dispose');
    $("#stop-title").popover('dispose');
    $("#stop-map").popover('dispose');

}

function removeMediaWarnings() {
    $("#media-title").popover('dispose');
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
        if (tableName === "stop-media") {
            addedMedia[name]["media_order"] = selectedRowIndex + 1;
            addedMedia[selectedRow.cells[1].innerHTML]["media_order"] = selectedRowIndex;
        } else if (tableName === "tour-stops") {
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

        if (tableName === "stop-media") {
            addedMedia[name]["media_order"] = selectedRowIndex - 1;
            addedMedia[selectedRow.cells[1].innerHTML]["media_order"] = selectedRowIndex;
        } else if (tableName === "tour-stops") {
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
    var title = document.getElementById("stop-title");
    var description = document.getElementById("stop-description") // here max
    // clear the fields
    title.value = "";
    description.value = "";
    selectedLocation = undefined;
    // clear table
    mediaTableBody = document.getElementById("stop-media");
    mediaTableBody.innerHTML = "";
    addedMedia = {};
}

function clearTourFields() {
    // clear the fields
    var title = document.getElementById("tour-title");
    var description = document.getElementById("tour-description");
    title.value = "";
    description.value = "";
    // clear table
    stopsTableBody = document.getElementById("tour-stops");
    stopsTableBody.innerHTML = "";
    addedStops = {};
}

// trigger by onchange on the html element media-item
function loadFile(e) {
    var preview = document.getElementById('media-preview');
    var imgURL = URL.createObjectURL(e.target.files[0]);
    var img = new Image();
    img.src = imgURL
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
    preview.src = imgURL;
}

// MARK: functions to update the tables when
//       an item is added
function updateStopTable(name) {
    var stopTable = document.getElementById("tour-stops");
    var row = stopTable.insertRow(-1); // put the new row at the bottom
    row.className = 'clickable-row';

    // add row number
    var numRows = stopTable.rows.length;
    var cellRowNumber = row.insertCell(0);
    var numberImageFile = "stopNumberImages/bwr" + numRows + ".jpg";
    cellRowNumber.innerHTML = "<img src=" + numberImageFile + " >"

    // add to added media, add stop_order
    addedStops[name] = existingStops[name];
    addedStops[name]["stop_order"] = numRows;

    // add media name
    var cell = row.insertCell(1);
    cell.innerHTML = name;

    // TODO: Add event listeners when a stop is double clicked
    // to display the tour's description and a list of
    // images and their descriptions in the popup

    // add event listeners when a stop is single clicked to show its
    // location on the map
    row.addEventListener('click', function () {
        var name = this.cells[1].innerHTML;
        var stop = existingStops[name];
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

    // add row number
    var numRows = mediaTable.rows.length;
    var cellRowNumber = row.insertCell(0);
    var numberImageFile = "stopNumberImages/bwr" + numRows + ".jpg";
    cellRowNumber.innerHTML = "<img src=" + numberImageFile + " >"

    // add media name
    var cell = row.insertCell(1);
    cell.innerHTML = name;

    if (userAdded) {
        addedMedia[name] = JSON.parse(JSON.stringify(existingMedia[name]));
    }
    addedMedia[name]["media_order"] = numRows;
    // row.dataset.target = '#media-table-popup'; // set data-target

    // pull up the modal when double clicked
    row.addEventListener('dblclick', function () {
        $('#media-table-popup').modal('toggle');
        var selectedRow = document.querySelector('#stop-media > .bg-info');
        var name = selectedRow.cells[1].innerHTML;

        // title the modal
        var modalTitle = document.getElementById("media-table-modal-title");
        modalTitle.innerHTML = "For this stop only, change the caption of " + name;

        // show the original caption
        var modalCaption = document.getElementById("media-pop-up-caption");
        modalCaption.value = addedMedia[name]["caption"];

        // preview the image
        var modalImage = document.getElementById("media-pop-up-preview");
        var img = new Image();
        img.src = addedMedia[name]["media-item"];
        // change orientation (simplified)
        // TODO: show images at a reasonable size proportional
        // to their original size
        img.onload = function() {
            if (img.height > img.width) { // portrait
                modalImage.width = "300";
                modalImage.height = "350";
            } else if (img.height < img.width) { // landscape
                modalImage.width = "400";
                modalImage.height = "250";
            } else { // square
                modalImage.width = "300";
                modalImage.height = "300";
            }
        };
        modalImage.src = img.src;

        // when the confirm button is clicked, update the caption for the stop
        var confirmButton = document.getElementById("confirm-edit-caption");
        confirmButton.addEventListener("click", function() {
            var selectedRow = document.querySelector('#stop-media > .bg-info');
            var name = selectedRow.cells[1].innerHTML;

            addedMedia[name]["caption"] = modalCaption.value;
            console.log(existingMedia[name]["caption"]);
        });
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
