/// <reference path="../typings/jquery/jquery.d.ts"/>
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http', '$location', 'getGoogleData', function(VisDataSet, $scope, $http, $location, $timeout, getGoogleData) {
    function invalidRow(num, col) {
        var row = num;
        $("body").prepend("Row " + row + ", Column " + col + ": contains errors. Please correct and try again.");

    }
    /* reportError () -- outputs error message to user when something fails */
    function reportError(msg) {

        $("body").prepend(msg);

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
        console.log('data', rows);
        var exportList = [];
        if (rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                //insert row data into dataSet
                var currentRow = rows[i];
                console.log(currentRow);
                if (currentRow.gsx$type.$t === 'marker') {
                    var dataItem = {
                        kind: String(currentRow.gsx$type.$t),
                        lat: currentRow.gsx$latitude.$t || invalidRow(i, 'gsx$latitude'),
                        lng: currentRow.gsx$longitude.$t || invalidRow(i, 'gsx$latitude'),
                        tags: toTags(currentRow.gsx$tags.$t) || invalidRow(i, 'tags'),
                        content: String(currentRow.gsx$datasource.$t) || invalidRow(i, 'datasource'),
                        start: Date(currentRow.gsx$startdate.$t) || invalidRow(i, 'startDate'),
                        end: Date(currentRow.gsx$enddate.$t) || invalidRow(i, 'endDate'),
                        polyGroup: currentRow.gsx$format.$t || 'none' // not in a polygon, do not group

                    };
                    exportList.push(dataItem);
                } else if (currentRow.gsx$type.$t === 'layer') {

                    var dataItem = {
                        kind: String(currentRow.gsx$type.$t),
                        lat: currentRow.gsx$latitude.$t || invalidRow(i, 'gsx$latitude'),
                        lng: currentRow.gsx$longitude.$t || invalidRow(i, 'gsx$latitude'),
                        tags: toTags(currentRow.gsx$tags.$t) || invalidRow(i, 'tags'),
                        url: String(currentRow.gsx$datasource.$t) || invalidRow(i, 'datasource'),
                        start: Date(currentRow.gsx$startdate.$t) || invalidRow(i, 'startDate'),
                        end: Date(currentRow.gsx$enddate.$t) || invalidRow(i, 'endDate'),
                        format: currentRow.gsx$format.$t || invalidRow(i, 'gsx$format')

                    };
                    exportList.push(dataItem);

                } else if (currentRow.gsx$type.$t === 'basemap') {

                } else {
                    invalidRow(i, 'Could not find data type');
                }


            }
        } else {
            reportError('The requested dataset does not contain any valid rows. Please check that you are loading the correct file and try and again.');
        }
        console.log('EXPORT:', exportList);
        return exportList;
    }
    /*
    createOlObject ()
    - k: int value for assigning ids
    - object: map row object
    */
    function createOlObject(k, object) {
      for (var k = 0; k < $scope.dataSet.length; k++) {
        //add markers to ol map
        if (k === 0) {
            var markerId = 0;
        } else {
            var markerId = k + 1;
        }
        var Olobject;
        //verify item is a marker and create ol3 marker object
        if (object.kind === "marker") {
            Olobject = {
                "id": markerId,
                "lat": $scope.dataSet[k].lat,
                "log": $scope.dataSet[k].lng,
                "name": $scope.dataSet[k].content
            };
        } else if (object.kind === "basemap") {

        }

    }
}
    function uniqueVisObjects(array) {

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
            zoom: 4,
            centerUrlHash: true
        }
    });
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

    //update map center and zoom from URL
    var promise;
    $scope.$on("centerUrlHash", function(event, centerHash) {
        $location.search({
            c: centerHash
        });
    });
    $scope.$on('visTimelineChange', function(event, args) {
        console.log($scope.googleData);
        var visibleItems = args.objects; // get visible items from directive broadcast
        //reload all data if we've previously removed something, this al
        if (visibleItems.length > $scope.olMarkers.length) {
            $scope.olMarkers = []; //reset markers

              $scope.olMarkers.push(marker);
                $scope.format_dataSet[k];
                console.log($scope.olMarkers.length);
                $scope.$apply(); //update map

            }

        for (var i = 0; i < $scope.olMarkers.length; i++) {
            //  $scope.ol
            if (!(visibleItems.contains($scope.olMarkers[i].id))) {
                console.log(i, ':', $scope.olMarkers[i].id);
                $scope.olMarkers.splice(i, 1);
                $scope.$apply(); //update map
            }

        }
    });


    $scope.loadGoogleMapsData = function(url) {
        var urlString = "https://jsonp.afeld.me/?url=http://spreadsheets.google.com/feeds/list/" + url + "/od6/public/values?alt=json";
        $http.get(urlString).success(function(data) {
            console.log(data);
            var rows = data.feed.entry; //rows from dataset
            insertData(rows);
        }).error(function(data) {
            console.log(data);
            reportError('Could not load data from source:' + String(data));
        });
    };
    $scope.addLayer = function(gmapItem) {
        console.log('input:', gmapItem);
        $scope.loadGoogleMapsData(gmapItem.id);
    };

    $scope.loadSheet = function(url) {
        //https://spreadsheets.google.com/feeds/list/{KEY }/od6/public/values?alt=json
        $http.get(url).success(function(data) {
            if (data) {
                $scope.dataSet.push(data); //allows for more than one dataset
                //format and load the lastest element in dataSet
                $scope.format_dataSet($scope.dataSet.length - 1);
            }
        }).error(function(data) {
            reportError('Could not load data from source:' + String(url));
        });
    };
    //placeholder until dataLoader factory is ready
    /* load TimeMap, loads the .json file containing references to map layers and markers */
    $scope.loadTimeMap = function(url) {
        $http.get(url).success(function(data) {
            if (data) {
                $scope.dataSet.push(data); //allows for more than one dataset
                //format and load the lastest element in dataSet
                $scope.format_dataSet($scope.dataSet.length - 1);
            }
        }).error(function(data) {
            reportError('Could not load data from source:' + String(url));
        });
    };
    $scope.format_dataSet = function(set) {
        //console.log(returnFilelist());
        var data; //dataset to format
        if (set <= $scope.dataSet.length) {
            data = $scope.dataSet[set];
        } else {
            reportError("invalid dataSet, could not format");
        }
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            $scope.dataSet.push(data[i]);
            var groupNames = []
            var rowGroups = data[i].groups;
            console.log(rowGroups);
            for (var k = 0; k < rowGroups.length; k++) {
                if ($scope.visGroups.length > 0) {
                    if (!($scope.visGroups.contains(rowGroups[k]))) {
                        if (!(groupNames.contains(rowGroups[k]))) {
                            var group = {
                                "id": $scope.visGroups.length + 1,
                                "content": rowGroups[k],
                                "value": rowGroups[k]
                            };
                            console.log(group);
                            $scope.visGroups.push(group);
                        }
                    }
                } else {
                    var group = {
                        "id": $scope.visGroups.length + 1,
                        "content": rowGroups[k],
                        "value": rowGroups[k]
                    };
                    console.log(group);
                    $scope.visGroups.push(group);
                }
            }
            //add markers to ol map
            if (i === 0) {
                var markerId = 0;
            } else {
                var markerId = i + 1;
            }
            //verify item is a marker and create ol3 marker object
            if (data[i].kind === "marker") {
                var marker = {
                    "id": markerId,
                    "lat": data[i].lat,
                    "log": data[i].lng,
                    "name": data[i].content
                };
                $scope.olMarkers.push(marker);
            }
        }
        //TODO: move to end of load loop when we bring google data
        $scope.initTimeline();
    };


    $scope.initTimeline = function() {
        $scope.logs = {};
        $scope.defaults = {
            orientation: ['top', 'bottom'],
            autoResize: [false, false],
            showCurrentTime: [true, false],
            showCustomTime: [true, false],
            showMajorLabels: [true, false],
            showMinorLabels: [true, false],
            align: ['left', 'center', 'right'],
            stack: [true, false],
            moveable: [true, false],
            zoomable: [true, false],
            selectable: [false, false],
            editable: [false, false]
        };

        var options = {
            align: 'center', // left | right (String)
            autoResize: false, // false (Boolean)
            editable: false,
            selectable: false,
            // start: null,
            // end: null,
            height: '100px',
            // width: '100%',
            margin: {
                axis: 2,
                item: 2
            },
            // min: null,
            // max: null,
            // maxHeight: null,
            orientation: 'bottom',
            // padding: 5,
            showCurrentTime: true,
            showMajorLabels: true,
            showMinorLabels: true,
            // type: 'box', // dot | point
            // zoomMin: 1000,
            // zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 10,
            groupOrder: 'content'
        };
        //create visItems
        for (var i = 0; i < $scope.dataSet.length; i++) {

            var dataSetrow = $scope.dataSet[i];
            for (var k = 0; k < dataSetrow.length; k++) {
                if (dataSetrow[k]) {
                    var idVal = 1;
                    if (k > 0) {
                        idVal = k + 1;
                    }
                    var visDatRow = [];
                    var visObj = {
                        id: idVal,
                        olId: $scope.dataSet[k].id,
                        content: dataSetrow[k].content,
                        type: "range",
                        group: i + 1,
                        start: String(toDate(dataSetrow[k].start)),
                        end: String(toDate(dataSetrow[k].end))
                    };
                    console.log(visObj["start"])
                    visDatRow.push(visObj);
                    $scope.visItems.add(visDatRow);
                }
            }
        }

        console.log('visItems', $scope.visItems);

        console.log('visGroups', $scope.visGroups);

        //starting point for map
        //if
        $scope.data = {
            'groups': VisDataSet($scope.visGroups),
            'items': $scope.visItems
        };
        var startTime = getURLparams(location.search, 't');
        if (startTime.length === 0) {
            now = moment().minutes(0).seconds(0).milliseconds(0);
        } else {
            var now = moment(startTime, "MM-DD-YYYY");
        }

        var orderedContent = 'content';
        var orderedSorting = function(a, b) {
            // option groupOrder can be a property name or a sort function
            // the sort function must compare two groups and return a value
            //     > 0 when a > b
            //     < 0 when a < b
            //       0 when a == b
            return a.value - b.value;
        };

        $scope.options = angular.extend(options, {
            groupOrder: orderedContent,
            editable: false
        })

        $scope.onRangeChange = function(period) {
            console.log('rng:', period);
        }
        $scope.onSelect = function(items) {
            // debugger;
            console.log(items);
        };

        $scope.onClick = function(props) {
            //debugger;
            console.log(items);
        };

        $scope.onDoubleClick = function(props) {
            // debugger;
            console.log('DoubleClick');
        };

        $scope.rightClick = function(props) {
            //alert('Right click!');
            props.event.preventDefault();
        };

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
    $scope.loadTimeMap("myjson.json");
    $scope.loadGoogleMapsData('1j9Z3bmaoCNd3DC1Vju2xCLsyYJW_SPiSOWBrYgt0F6o');
}]);
