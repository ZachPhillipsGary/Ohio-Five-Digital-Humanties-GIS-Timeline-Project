/// <reference path="../typings/jquery/jquery.d.ts"/>
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http', '$location', '$cookieStore', function(VisDataSet, $scope, $http, $location, $cookieStore) {
    function invalidRow(num, col) {
        var row = num;
        $scope.alertBox.msg = "           Row " + row + ", Column " + col + ": contains errors. Please correct and try again.";
        $scope.alertBox.view = true;
    }
    $scope.timeBoxValue = ''; // set time on click
    $scope.currentMap;
    $scope.urlDates = {};
    $scope.alertBox = {};
    $scope.hiddenVisObj = {
        layers: [],
        markers: []
    };
    $scope.currentlyLoadingKey = {
        url: '',
        key: ''
    }; //for error reporting
    /* reportError () -- outputs error message to user when something fails */
    function reportError(msg) {
        $scope.alertBox.view = true;
        $scope.alertBox.msg = msg
    }
    $scope.iframeStr = ''; // stores map title for addFolder
    /*
    Creates folder to store map layers and masterSheet

    */
    $scope.addFolder = function() {
        createPublicFolder($scope.mapName);
    };

    function isObject(val) {
        if (val === null) {
            return false;
        }
        return ((typeof val === 'function') || (typeof val === 'object'));
    }

    function getURLparams(name, url) {
        if (!url) url = location.href
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);
        return results == null ? null : results[1];
    }
    //date validator
    function isValidDate(s) {
        var bits = s.split('/');
        var d = new Date(bits[2], bits[1] - 1, bits[0]);
        return d && (d.getMonth() + 1) == bits[1] && d.getDate() == Number(bits[0]);
    }
    //converts comma seperated string of tags in to array
    function toTags(tags) {
        tags = tags.split(',');
        var tagsList = [];
        for (var i = 0; i < tags.length; i++) {
            tagsList.push(tags[i]);
        }
        return tagsList;
    }

    /*
  insertData()
  pre:
  rows -- google sheets row objects,
  location -- where to push data

  post: returns formatted data into list
     */
    function insertData(rows, location) {
        var tags = [];
        var exportList = [];
        if (rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                //insert row data into dataSet
                var currentRow = rows[i];
                console.log(currentRow);
                if (currentRow.gsx$type.$t === 'marker') {
                    var dataItem = {
                        visible: true,
                        group: currentRow.gsx$category.$t || invalidRow(i, 'gsx$category'),
                        kind: String(currentRow.gsx$type.$t),
                        lat: currentRow.gsx$latitude.$t || invalidRow(i, 'gsx$latitude'),
                        lng: currentRow.gsx$longitude.$t || invalidRow(i, 'gsx$latitude'),
                        tags: toTags(currentRow.gsx$tags.$t) || invalidRow(i, 'tags'),
                        content: String(currentRow.gsx$datasource.$t) || invalidRow(i, 'datasource'),
                        start: new Date(currentRow.gsx$startdate.$t) || invalidRow(i, 'startDate'),
                        end: new Date(currentRow.gsx$enddate.$t) || invalidRow(i, 'endDate'),
                        polyGroup: currentRow.gsx$format.$t || 'none' // not in a polygon, do not group

                    };
                    //push tags to set
                    for (var l = 0; l < dataItem.tags.length; l++) {
                        tags.push(dataItem.tags[l]);
                    }
                    exportList.push(dataItem);
                } else if (currentRow.gsx$type.$t === 'layer') {

                    var dataItem = {
                        visible: true,
                        content: "layer",
                        kind: String(currentRow.gsx$type.$t),
                        group: currentRow.gsx$category.$t || invalidRow(i, 'Could not find required column: category'),
                        lat: currentRow.gsx$latitude.$t || invalidRow(i, 'Could not find required field: latitude'),
                        lng: currentRow.gsx$longitude.$t || invalidRow(i, 'Could not find required field: longitude'),
                        tags: toTags(currentRow.gsx$tags.$t) || invalidRow(i, 'Could not find required field: tags'),
                        url: String(currentRow.gsx$datasource.$t) || invalidRow(i, 'Could not find required field: datasource'),
                        start: new Date(currentRow.gsx$startdate.$t) || invalidRow(i, 'Could not find required field: startDate'),
                        end: new Date(currentRow.gsx$enddate.$t) || invalidRow(i, 'Could not find required field: endDate'),
                        format: currentRow.gsx$format.$t || invalidRow(i, 'Could not find required field: format')

                    };
                    console.log(dataItem);
                    for (var l = 0; l < dataItem.tags.length; l++) {
                        tags.push(dataItem.tags[l]);
                    }
                    exportList.push(dataItem);
                } else if (currentRow.gsx$type.$t === 'map') {

                } else {
                    invalidRow(i, 'Could not find data type');
                }


            }
        } else {
            reportError('The requested dataset does not contain any valid rows. Please check that you are loading the correct file and try and again.');
        }
        console.log('EXPORT:', exportList);
        var exportData = {
            items: exportList,
            tagset: tags.unique()
        };
        return exportData;
    }


    function uniqueVisObjects(array) {

    }
    $scope.selectGeoCodeItem = function(item) {
            console.log(item);
            $scope.addMarker.lat = item.geometry.lat;
            $scope.addMarker.lon = item.geometry.lng;
            $scope.addMarker.latlon = true;
        }
        //POST marker data and authentication keys to server
    $scope.saveMarker = function() {
        $http.post('/add', {
            marker: $scope.addMarker,
            authentication: $scope.authorize.creds || {}
        }).
        then(function(response) {
            console.log(response);
            $scope.addMarker.create = false;
            alert('Success!');
            // this callback will be called asynchronously
            // when the response is available
        }, function(response) {
            console.log(response);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }
    $scope.resetMarkermodel = function() {
        var check = confirm('Reset ' + $scope.addMarker.kind + '?');
        if (check)
            $scope.addMarker = {
                url: '',
                kind: '',
                geoCode: false,
                latlon: false,
                geoCodekey: 'd766bef0eb2632769bfcff5d5b93c5b7',
                lat: 40.8092,
                lon: 81.9372,
                geoCoderesults: [],
                group: '',
                startDate: '',
                showField: false,
                endDate: '',
                format: 'select file format',
                getAddressby: '',
                create: false, //do not show ui unless adding item
                label: {
                    message: 'Test label',
                    show: true,
                    showOnMouseOver: true
                },
                tags: [],
                group: ''
            };

    }
    $scope.filterData = function() {
            //unfilter everything within view
            for (var i = 0; i < $scope.hiddenVisObj.markers.length; i++) {
                if (!($scope.hiddenVisObj.markers[i].hiddenbyTimeline === true)) {
                    $scope.olMarkers.push($scope.hiddenVisObj.markers[i]);
                    $scope.hiddenVisObj.markers.splice(i, 1);
                }
            }
            //now apply selected filters
            for (var i = 0; i < $scope.selectedFilters.length; i++) {
                for (var k = 0; k < $scope.olMarkers.length; k++) {
                    for (var l = 0; l < $scope.olMarkers[k].tags.length; l++) {
                        //we use val for filter since 'name' contains formatting
                        if ($scope.selectedFilters[i].val == $scope.olMarkers[k].tags[l]) {
                            console.log('match');
                            $scope.hiddenVisObj.markers.push($scope.olMarkers[k]);
                            $scope.olMarkers.splice(k, 1);
                        }
                    }
                }
            }
            $scope.$apply(); //update map
        }
        /* toDate({}) converts object to js date */
    function toDate(obj) {
        console.log(obj.year, obj.month, obj.day);
        console.log('Date', new Date(obj.year, obj.month, obj.aday));
        return String(new Date(obj.year, obj.month, obj.day));
    }
    //center map on wooster if nothing else is selected
    angular.extend($scope, {
        wooster: {
            lat: 40.8092,
            lon: 81.9372,
            projection: "EPSG:4326",
            zoom: 4,
            centerUrlHash: true
        },
        //dummy object for new row creation
        addMarker: {
            url: '', // location of layer file
            kind: '', // map, marker or layer?
            geoCode: false, // geocoded address
            latlon: false, // latitude and longitude stored in object?
            geoCodekey: 'd766bef0eb2632769bfcff5d5b93c5b7', //geocoding api access key
            lat: 40.8092,
            lon: 81.9372,
            geoCoderesults: [], //top results from geocoding query
            group: '', //row group
            startDate: '',
            showField: false, // for debgging
            endDate: '',
            format: 'select file format',
            getAddressby: '',
            create: false, //do not show ui unless adding item
            label: {
                message: 'Test label',
                show: true,
                showOnMouseOver: true
            },
            tags: [],
            group: ''
        },
        defaults: {
            events: {
                map: ['singleclick', 'pointermove']
            }
        },
        mouseposition: {},
        mouseclickposition: {},
        projection: 'EPSG:4326'
    });
    //for marker maker
    $scope.addTag = function() {
        var str = String($scope.addMarker.newTag);
        $scope.addMarker.tags.push(str);
    };
    $scope.timelineOpasity = 0.4;
    //markers
    $scope.olMarkers = [];
    //map layers
    $scope.olLayers = [];
    //.json datafile for map
    $scope.dataSet = [];
    //list of filters for timemap
    $scope.filters = [];
    //selected filters from filter dropdown
    $scope.selectedFilters = [];
    //groups are a many (items) to one (group) relationship
    $scope.visGroups = [];
    $scope.visItems = new vis.DataSet({});
    //object to hold google drive file metadata objects.
    //
    $scope.googleData = {
        sheets: [],
        files: []
    }; //all file's in a user's drive
    var promise;
    console.log($scope.googleData.appFolder);
    $scope.$on("centerUrlHash", function(event, centerHash) {
        $location.search({
            c: centerHash,
            m: $scope.currentMap.urlKey || 'nokey',
            o: $scope.tmOpacity || 0.4
        });
        //update Add Point coords
        if ($scope.addMarker.latlon == true) {
            var latlon = centerHash.split(':');
            $scope.addMarker.lat = Number(latlon[0]);
            $scope.addMarker.lon = Number(latlon[1]);
        }
    });
    /*
     * visTimelineChange
    * This event is called by angular-visjs directive whenever the timeline state changes (a user zooms in or out or goes forward or back in time)
    * @param {event} (the event object)
    * @param {args} javascript object containg event particulars
    args: {
      objects:[]
    }
    */
    $scope.$on('visTimelineChange', function(event, args) {
        var visibleItems = args.objects;
        console.log('visibleItems', visibleItems, '$scope.olMarkers', $scope.olMarkers, '$scope.olLayers', $scope.olLayers, 'hiddenVisObj', $scope.hiddenVisObj);
        //filter markers by visibility
        for (var i = 0; i < $scope.olMarkers.length; i++) {
            if (!(visibleItems.contains($scope.olMarkers[i].id))) {
                $scope.olMarkers[i].hiddenbyTimeline = true;
                $scope.hiddenVisObj.markers.push($scope.olMarkers[i]);
                $scope.olMarkers.splice(i, 1);
            } else {
                $scope.olMarkers[i].hiddenbyTimeline = false;
            }
        }
        for (var i = 0; i < $scope.olLayers.length; i++) {
            if (!(visibleItems.contains($scope.olLayers[i].id))) {
                $scope.olLayers[i].hiddenbyTimeline = true;
                $scope.hiddenVisObj.layers.push($scope.olLayers[i]);
                $scope.olLayers.splice(i, 1);
            } else {
                $scope.olLayers[i].hiddenbyTimeline = false;
            }
        }
        //done removing
        for (var i = 0; i < $scope.hiddenVisObj.markers.length; i++) {
            if (visibleItems.contains($scope.hiddenVisObj.markers[i].id)) {
                $scope.olMarkers.push($scope.hiddenVisObj.markers[i]);
                $scope.hiddenVisObj.markers.splice(i, 1);
            }
        }
        for (var i = 0; i < $scope.hiddenVisObj.layers.length; i++) {
            if (visibleItems.contains($scope.hiddenVisObj.layers[i].id)) {
                $scope.olLayers.push($scope.hiddenVisObj.layers[i]);
                $scope.hiddenVisObj.layers.splice(i, 1);
            }
        }
        $scope.$apply(); //update map

    });
    //set timeline properties based on changes from GUI. put in URL on screen change
    $scope.updateTimeline = function() {
            console.log($scope.newLayer);
            var value = $scope.tmOpacity / 10;
            $("#timelineContainer").css('background-color', 'rgba(255,255,255,' + value + ')');
        }
        // object to hold our auth keys for Google drive changes
    $scope.authorize = {
        url: '',
        msg: ''
    };
    //generate authentication keys for saving markers to Google Drive & store as cookie for future use
    $scope.authorizeUser = function() {
        $scope.authorize.msg = '';
        if ($scope.authorize.hasOwnProperty('key')) {
            $http.post('/auth', {
                key: $scope.authorize.key
            }).
            then(function(response) {
                if (response.hasOwnProperty('data')) {
                    $scope.authorize.creds = response.data || {};
                    console.log($scope.authorize.creds);
                    $cookieStore.put('ohioFiveAppCreds', angular.toJson($scope.authorize.creds));
                    $scope.addMarker.authorize = false;
                    $scope.addMarker.showField = false;
                    $scope.addMarker.authorize = true;
                } else {
                    $scope.authorize.msg = 'Error: invalid reply from server. Please try again.';
                }
            }, function(response) {
                console.log(response);
                alert(response);
            });
        } else {
            $scope.authorize.msg = 'Error: invalid key.';
        }
    }
    $scope.toggleMapQuestLayer = function() {
        if ($scope.addMarker.format == 'OSM') {
            angular.extend($scope, {
                mapquest: {
                    source: {
                        type: 'MapQuest',
                        layer: 'sat'
                    }
                }
            });
        } else {
            $scope.mapquest = {};
        }
        console.log('test');
    };
    $scope.loadGoogleMapsData = function(url) {
        //get authorize url for adding or remving data
        $http.get('/auth').success(function(data) {
            $scope.authorize.url = data;
        }).error(function(data) {
            alert('Unable to connect to server.');
            console.log(data);
        });
        //now get content. Use afeld as proxy for cross domain issues on some browsers
        var urlString = "https://jsonp.afeld.me/?url=http://spreadsheets.google.com/feeds/list/" + url + "/od6/public/values?alt=json";
        $http.get(urlString).success(function(data) {
            var rows = data.feed.entry; //rows from dataset
            /*
            Take dataset, format the resuslts
            */
            var output = insertData(rows);
            for (var i = 0; i < output.items.length; i++) {
                $scope.dataSet.push(output.items[i]);
            }
            //create filters
            for (var i = 0; i < output.tagset.length; i++) {
                var filterObj = {
                    ticked: false,
                    name: " " + output.tagset[i],
                    val: output.tagset[i]
                };
                $scope.filters.push(filterObj);
            }
            console.log($scope.dataSet);
            $scope.format_dataSet(output);
            $scope.currentMap = output;
            $scope.currentMap.urlKey = url;
        }).error(function(data) {
            console.log(data);
            //display a help box if access denied
            if (typeof data !== "undefined") {

                $('#help').modal('show');

            }
            reportError('Could not load data from source:' + String(data));
        });
    };
    $scope.onuploadComplete = function(reply) {
        console.log(reply);
    }
    $scope.uploadFile = function() {
            var file = document.getElementById("uploaderField");
            insertFile(file.files[0] || NULL, $scope.$scope.onuploadComplete());
            console.log('saving');
        }
        /*
        Loads selected google drive file onto Map
        */
    $scope.addLayer = function(gmapItem) {
        console.log('input:', gmapItem);
        //are we getting a dropdown object or key string?
        if (isObject(gmapItem)) {
            gmapItem = gmapItem.id; // if object, set gmapItem equal to url key
        }
        var u = $location.search();
        if (!(u.m === gmapItem))
            $location.search('m', gmapItem);
        //for errors

        $scope.currentlyLoadingKey.url = '';
        $scope.currentlyLoadingKey.key = gmapItem;
        $scope.frameName = '';
        //iframe hack fix.
        $scope.currentlyLoadingKey.url = $scope.currentlyLoadingKey.url.replace("https", "http");
        console.log($scope.currentlyLoadingKey.url);
        //make it Jacob proof
        $scope.addMarker.mapKey = gmapItem;
        $scope.loadGoogleMapsData(gmapItem);
    };

    $scope.geoCode = function() {
        var urlString;
        if ($scope.addMarker.hasOwnProperty('address')) {
            urlString = "http://api.opencagedata.com/geocode/v1/json?query=" + $scope.addMarker.address + "&key=" + $scope.addMarker.geoCodekey;

            $http.get(urlString).success(function(data) {
                console.log(data);
                $scope.addMarker.result = true; // we have something to show
                $scope.addMarker.geoCoderesults = data.results;

            }).error(function(data) {
                reportError('Could not connect to geoCoding service!');
            });
        } else {
            reportError('Invalid Address!');
        }
    };

    //placeholder until dataLoader factory is ready
    /* load TimeMap, loads the google sheet file containing references to map layers and markers */
    $scope.loadTimeMap = function(url) {
        var urlString = "http://jsonp.afeld.me/?url=http://spreadsheets.google.com/feeds/list/" + url + "/od6/public/values?alt=json";
        $http.get(urlString).success(function(data) {
            console.log(data.feed.entry);
            if (data.feed.entry.length > 0) {
                $location.path(String(url));
                $location.replace();
                for (var i = 0; i < data.feed.entry.length; i++) {
                    var key = String(data.feed.entry[i].gsx$layers.$t);
                    $scope.loadGoogleMapsData(key);
                }
            }
        }).error(function(data) {
            console.log(data);
            reportError('Could not load data from source:' + String(url));
        });
    };
    $scope.format_dataSet = function(set) {
        var tags = set.tagset || [];
        console.log(set.items);
        var markers = set.items || [];
        for (var i = 0; i < tags.length; i++) {
            var group = {
                "id": i + 1,
                "content": tags[i],
                "value": tags[i]
            };
            //$scope.visGroups.push(group);
        }
        //create vis && ol3 markers
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].kind === 'marker') {
                var marker = {
                    "id": i + 1,
                    style: {},
                    "hiddenbyTimeline": false,
                    "tags": markers[i].tags || [],
                    "lat": parseFloat(markers[i].lat),
                    "lon": parseFloat(markers[i].lng),
                    "name": markers[i].content
                };
                $scope.olMarkers.push(marker);
            } else if (markers[i].kind === 'layer') {
                var layer = {
                    "id": i + 1,
                    "hiddenbyTimeline": false,
                    "tags": markers[i].tags || [],
                    "dataType": markers[i].format,
                    "lat": markers[i].lat,
                    "lon": markers[i].lng,
                    "name": markers[i].url,
                    "dataURL": markers[i].url
                };
                console.log('layer:', layer);
                $scope.olLayers.push(layer);
            }
        }
        var groupSet = []
        for (var i = 0; i < $scope.dataSet.length; i++) {
            var visDatRow = [];
            var visObj = {
                id: i + 1,
                type: "range",
                group: $scope.dataSet[i].group,
                start: String($scope.dataSet[i].start),
                end: String($scope.dataSet[i].end)
            };
            //add layer or marker icon
            if ($scope.dataSet[i].content != 'layer')
                visObj.content = '<i class="fa fa-map-marker"></i> ' + $scope.dataSet[i].content;
            else
                visObj.content = '<i class="fa fa-map"></i> ' + $scope.dataSet[i].content;
            groupSet.push($scope.dataSet[i].group);
            console.log(visObj);
            visDatRow.push(visObj);
            $scope.visItems.add(visDatRow);
        }
        groupSet = groupSet.unique();
        for (var i = 0; i < groupSet.length; i++) {
            var group = {
                "id": groupSet[i],
                "content": groupSet[i],
                "value": groupSet[i]
            };
            $scope.visGroups.push(group);
        }

        $scope.initTimeline();
    };

    $scope.initTimeline = function() {
        angular.extend($scope, {
            olDefaults: {
                layer: {
                    url: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png"
                },
                map: {
                    scrollWheelZoom: false
                },
                controls: {
                    zoom: {
                        position: 'topright'
                    }
                }
            }
        });
        $scope.logs = {};
        $scope.defaults = {
            orientation: ['top', 'bottom'],
            autoResize: [true, true],
            showCurrentTime: [true, false],
            showCustomTime: [true, false],
            showMajorLabels: [true, true],
            showMinorLabels: [true, true],
            align: ['left', 'center', 'right'],
            stack: [true, true],
            moveable: [true, false],
            zoomable: [true, false],
            selectable: [false, false],
            editable: [false, false]
        };
        var options = {
            align: 'center', // left | right (String)
            autoResize: true, // false (Boolean)
            editable: false,
            selectable: false,
            start: $scope.urlDates.start || null,
            end: $scope.urlDates.end || null,
            height: '100%',
            width: '100%',
            margin: {
                axis: 2,
                item: 2
            },
            // min: null,
            // max: null,
            // maxHeight: null,
            orientation: 'bottom',
            //padding: 1,
            showCurrentTime: true,
            showMajorLabels: true,
            showMinorLabels: true,
            // type: 'box', // dot | point
            // zoomMin: 1000,
            // zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 10,
            groupOrder: 'content'
        };

        console.log('visItems', $scope.visItems);

        console.log('visGroups', $scope.visGroups);

        //starting point for map
        //if
        $scope.data = {
            'groups': VisDataSet($scope.visGroups),
            'items': $scope.visItems
        };
        //  var now = moment().minutes(0).seconds(0).milliseconds(0);

        /*  var startTime = getURLparams(location.search, 't');
        if (startTime.length === 0) {
        } else {
            var now = moment(startTime, "MM-DD-YYYY");
        }
*/
        var orderedContent = 'content';
        var orderedSorting = function(a, b) {
            // option groupOrder can be a property name or a sort function
            // the sort function must compare two groups and return a value
            //     > 0 when a > b
            //     < 0 when a < b
            //       0 when a == b
            return a.value - b.value;
        };
        $scope.tmOpacity = 4; // 40%
        $scope.options = angular.extend(options, {
            groupOrder: orderedContent,
            editable: false
        })
        $scope.dateRange = '';
        $scope.onRangeChange = function(period) {
            $scope.dateRange = String(period.start) + ' to ' + String(period.end);
        }
        $scope.onSelect = function(items) {
            // debugger;
            console.log(props);
        };

        $scope.onClick = function(props) {
            //debugger;
            $scope.timeBoxValue = props.time;
            console.log(props);
        };

        $scope.onDoubleClick = function(props) {
            // debugger;
            console.log('DoubleClick');
        };

        $scope.rightClick = function(props) {
            //alert('Right click!');
            props.event.preventDefault();
        };
        $scope.deleteCookie = function() {
            $cookieStore.remove('ohioFiveAppCreds');
            //reset authorization state
            $scope.addMarker.authorize = false;
            console.log('erased cookie');
        }
        $scope.events = {
            rangechange: $scope.onRangeChange,
            rangechanged: $scope.onRangeChange,
            onload: $scope.onLoaded,
            select: $scope.onSelect,
            click: $scope.onClick,
            doubleClick: $scope.onDoubleClick,
            contextmenu: $scope.rightClick
        };
    };
    $scope.graphEvents = {
        rangechange: $scope.onRangeChange,
        rangechanged: $scope.onRangeChange,
        onload: $scope.onLoaded
    };
    //startup functions
    $selectedData = [];
    //  console.log($routeParams.type, $routeParams.id);
    var mapPaths = $location.search();
    if ((mapPaths.hasOwnProperty('m')) && (mapPaths.m != 'nokey')) {
        console.log('LOADING', mapPaths.m);
        //set intital date range
        if (mapPaths.hasOwnProperty('st')) {
            $scope.urlDates.start = new Date(mapPaths.st);
        }
        if (mapPaths.hasOwnProperty('et')) {
            $scope.urlDates.end = new Date(mapPaths.et);
        }
        if (mapPaths.m.length > 1) {
            $scope.addLayer(mapPaths.m);
        }
    } else {
        $('#adminCtrl').modal('show');
    }
    //check for stored Credentials
    $scope.authorize.creds = angular.fromJson($cookieStore.get('ohioFiveAppCreds')) || {};
    if ($scope.authorize.creds.hasOwnProperty('client_id')) {
        console.log($cookieStore.get('ohioFiveAppCreds'));
        $scope.addMarker.authorize = true; //hide authentication field
        $scope.addMarker.showField = false;
    }
}]);
