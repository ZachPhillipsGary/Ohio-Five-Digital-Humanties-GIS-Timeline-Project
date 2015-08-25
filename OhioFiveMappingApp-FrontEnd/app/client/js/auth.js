// Developer Console, https://console.developers.google.com
var CLIENT_ID = "158993334098-frmgia8rfgb5e5dgcidea9hk85ggvgtd.apps.googleusercontent.com";

var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/drive'];


function createPublicFolder(folderName) {
    var newFolderId = '';
    var body = {
        'title': folderName,
        'mimeType': "application/vnd.google-apps.folder"
    };

    var request = gapi.client.drive.files.insert({
        'resource': body
    });

    request.execute(function(resp) {

        var permissionBody = {
            'value': '',
            'type': 'anyone',
            'role': 'reader'
        };
        newFolderId = resp.id;
        var scope = angular.element($("#mainCtrl")).scope();
        scope.$apply(function() {
            scope.folderId = newFolderId;
        })
        var permissionRequest = gapi.client.drive.permissions.insert({
            'fileId': resp.id,
            'resource': permissionBody
        });
        permissionRequest.execute(function(resp) {});
        return newFolderId;

    });
}

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES,
        'immediate': true
    }, handleAuthResult);
}


/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
        loadDriveApi();
    } else {
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        authorizeDiv.style.display = 'inline';
    }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
    gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPES,
            immediate: false
        },
        handleAuthResult);
    return false;
}

/**
 * Load Drive API client library.
 */
function loadDriveApi() {
    gapi.client.load('drive', 'v2', listFiles);
}

/**
 * Print files.
 */
function listFiles() {
    var request = gapi.client.drive.files.list({
        'q': "mimeType = 'application/vnd.google-apps.spreadsheet'",
        'maxResults': 999
    });

    request.execute(function(resp) {
        appendPre('Files:');
        var files = resp.items;
        var fileSet = [];
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                //   console.log(file);
                var fileObject = {
                    "fileName": String(file.title),
                    "id": file.id,
                    "type": String(file.mimeType),
                    "export": file.exportLinks,
                    "use": false,
                    "link": file.alternateLink
                };
                fileSet.push(fileObject);
                appendPre(file.title + ' (' + file.id + ')');
            }
            console.log('adding data to angular', fileSet.length);
            //add to angular scope
            var scope = angular.element($("#mainCtrl")).scope();
            scope.$apply(function() {
                scope.googleData.sheets = fileSet;
            });
            findDatafile();
            $('#loaderAnimation').hide('slow');
            $('#adminCtrlbox').show('slow');
        } else {
            appendPre('No files found.');
        }
    });
}

/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {string} folder
 * @param {Function} callback Function to call when the request is complete.
 */
function insertFile(fileData, folder, callback) {
    console.log('filedata',fileData);
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': fileData.fileName || 'OhioFiveApp_Layer_'+String(Math.random()*33),
            'mimeType': contentType,
            "parents": [{
            "kind": "drive#fileLink",
            "id":  folder || ''
            }]
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {
                'uploadType': 'multipart'
            },
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        if (!callback) {
            callback = function(file) {
                //create the publicly accessible url for the uploaded document
                var ghosturl = 'http://googledrive.com/host/';
                ghosturl += folder; //the current user's OhioFiveApp folder
                ghosturl += '/';
                ghosturl += file.title; // name of the file.
                var scope = angular.element($("#mainCtrl")).scope(); // add to angular
                scope.$apply(function() {
                scope.addMarker.url = ghosturl || file.error;
                //bad authentication key, reset cookie
                if (!file.webContentLink) {
                  scope.deleteCookie();
                }
                });
            };
        }
        request.execute(callback);
        console.log('complete');
    }
}
/*

*/
function saveisComplete(Googlereply) {
  console.log(Googlereply);


  //document.getElementById("saveBtn").setAttribute("class", "democlass");
  //sdocument.getElementById("saveBtn").disabled = true;
}
function saveLayerFile() {
    var file = document.getElementById("uploaderField");
    var scope = angular.element($("#mainCtrl")).scope(); // add to angular
    insertFile(file.files[0],scope.googleData.appFolder.id,saveisComplete());
}
/**
 * Loads metadata for all files from the folder OhioFiveApp into $scope.googleData.appFolder. If
 * OhioFiveApp does not exist, calls function createPublicFolder to make folder
 */
function findDatafile() {
    var request = gapi.client.drive.files.list({
        'maxResults': 999
    });

    request.execute(function(resp) {
        appendPre('Files:');
        var files = resp.items;
        var fileSet = [];
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                //   console.log(file);
                var fileObject = {
                    "fileName": String(file.title),
                    "id": file.id,
                    "type": String(file.mimeType),
                    "export": file.exportLinks,
                    "use": false,
                    "link": file.alternateLink
                };
                var scope = angular.element($("#mainCtrl")).scope(); // add to angular
                var appFolderobj;
                //check for OhioFiveApp folder,  make one if it doesn't export yet
                if ((fileObject.fileName === 'OhioFiveApp') && (fileObject.type === 'application/vnd.google-apps.folder')){
                   appFolderobj = fileObject;
                }
                fileSet.push(fileObject);
                appendPre(file.title + ' (' + file.id + ')');
            }
            scope.$apply(function() {
                scope.googleData.files = fileSet;
                  if (typeof appFolderobj === 'object') {
                    scope.googleData.appFolder = appFolderobj || {};
                    console.log(scope.googleData.appFolder);
                  } else {
                    console.log('no OhioFiveApp folder. Creating...');
                    var newFolder = createPublicFolder('OhioFiveApp');
                    console.log(newFolder);
                  }

            });
        } else {
            appendPre('No files found.');
        }
    });
}


/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  //  var pre = document.getElementById('output');
  //  var textContent = document.createTextNode(message + '\n');
  //  pre.appendChild(textContent);
}
