           // Developer Console, https://console.developers.google.com
           var CLIENT_ID = "447842114622-6mlv0teo6gs76dqmon49q36kr40gm08c.apps.googleusercontent.com";

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
               scope.$apply(function(){
                   scope.folderId = newFolderId;
               })
               var permissionRequest = gapi.client.drive.permissions.insert({
                 'fileId': resp.id,
                 'resource': permissionBody
               });
               permissionRequest.execute(function(resp) { });
               return newFolderId;

             });
           }

                   /**
                    * Check if current user has authorized this application.
                    */
                   function checkAuth() {
                     gapi.auth.authorize(
                       {
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
                     gapi.auth.authorize(
                       {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
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
                               "fileName":String(file.title),
                               "id": file.id,
                               "type": String(file.mimeType),
                               "export":file.exportLinks,
                               "use": false,
                               "link": file.alternateLink
                             };
                             fileSet.push(fileObject);
                             appendPre(file.title + ' (' + file.id + ')');
                           }
                           console.log('adding data to angular',fileSet.length);
                           var scope = angular.element($("#mainCtrl")).scope();
                              scope.$apply(function(){
                                  scope.googleData = fileSet;
                              });
                              $('#loaderAnimation').hide('slow');
                              $('#adminCtrlbox').show('slow');
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
                     var pre = document.getElementById('output');
                     var textContent = document.createTextNode(message + '\n');
                     pre.appendChild(textContent);
                   }



                   mapApp.service('getGoogleData', function () {
                       this.getData = function () { return returnFilelist();};

                   });
