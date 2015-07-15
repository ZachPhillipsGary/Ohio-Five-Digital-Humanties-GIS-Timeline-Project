/// <reference path="../typings/jquery/jquery.d.ts"/>
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http', '$location', 'getGoogleData', function(VisDataSet, $scope, $http, $location, $timeout, getGoogleData) {

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
    //arkers
    $scope.olMarkers = [];
    //map layers
    $scope.olLayers = [];
    //.json datafile for map
    $scope.dataSet = [];
    //list of filters for timemap
    $scope.filters = [];
    //selected filters from filter dropdown
    $scope.selectedFilters = [];
    //global data array
    /*
    marker object Template
    defines a single point on the map
    {
    id: 42,
    lat: 40.8092,
    lng: 81.9372,
    groups: ['groupA','groupB','groupC'],
    content "<p>awesome text here</p>"
    start: new Date(2014, 3, 17),
    end: new Date(2014, 3, 17)
    }

    */
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
        //reload all data if we've previously removed something
        if (visibleItems.length > $scope.olMarkers.length) {
            $scope.olMarkers = [];
            for (var k = 0; k < $scope.dataSet.length; k++) {
                //add markers to ol map
                if (k === 0) {
                    var markerId = 0;
                } else {
                    var markerId = k + 1;
                }
                //verify item is a marker and create ol3 marker object
                if ($scope.dataSet[k].kind === "marker") {
                    var marker = {
                        "id": markerId,
                        "lat": $scope.dataSet[k].lat,
                        "log": $scope.dataSet[k].lng,
                        "name": $scope.dataSet[k].content
                    };
                    $scope.olMarkers.push(marker);
                }
                $scope.format_dataSet[k];
                console.log($scope.olMarkers.length);
                $scope.$apply(); //update map

            }
        }
        console.log($scope.olMarkers);
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
            console.log('test loadGoogleMapsData');
              console.log('sheetinfo:',data);

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
            autoResize: [true, false],
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
            // height: null,
            // width: '100%',
            // margin: {
            //   axis: 20,
            //   item: 10
            // },
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
