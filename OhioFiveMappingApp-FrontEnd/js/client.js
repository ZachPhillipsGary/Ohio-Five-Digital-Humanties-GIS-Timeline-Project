/// <reference path="../typings/jquery/jquery.d.ts"/>
var mapApp = angular.module('mapApp', ['ngVis', 'openlayers-directive', 'isteven-multi-select']);
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http','$location', function(VisDataSet, $scope, $http, $location, $timeout) {
    /* reportError () -- outputs error message to user when something fails */
    function reportError(msg) {

        $("body").prepend(msg);

    }
    /* toDate({}) converts object to js date */
    function toDate(obj) {
        if (obj)
            return Date(obj.year, obj.month, obj.day);
        else
            return Date();
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
    //update map center and zoom from URL
    var promise;
    $scope.$on("centerUrlHash", function(event, centerHash) {
        $location.search({
            c: centerHash
        });
    });
    //map markers
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
    //placeholder until dataLoader factory is ready
    $scope.visItems = [];
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
        var data;
        if (set < $scope.dataSet.length) {
            data = $scope.dataSet[set];
        } else {
            reportError("invalid dataSet, could not format");
        }
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            $scope.dataSet.push(data[i]);
            var rowGroups = data[i].groups;
            console.log(rowGroups);
            for (var k = 0; k < rowGroups.length; k++) {
                if ($scope.visGroups.length > 0) {
                    if (!($scope.visGroups.contains(rowGroups[k]))) {
                        var group = {
                            "id": $scope.visGroups.length + 1,
                            "content": rowGroups[k],
                            "value": rowGroups[k]
                        };
                        console.log(group);
                        $scope.visGroups.push(group);
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
            selectable: true,
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
              console.log(dataSetrow[k]);
              if (dataSetrow[k]) {
                var innerObj = {
                  //"id"
                };
              }
            }
        }

        console.log('visItems',$scope.visItems);


        //starting point for map
        var now = moment().minutes(0).seconds(0).milliseconds(0);
        $scope.data = {
            'groups': VisDataSet($scope.visGroups.unique()),
            'items': VisDataSet($scope.visItems)
        };
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
            editable: true
        })

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
            rangechanged: $scope.onRangeChanged,
            onload: $scope.onLoaded,
            select: $scope.onSelect,
            click: $scope.onClick,
            doubleClick: $scope.onDoubleClick,
            contextmenu: $scope.rightClick
        };
    };
    //startup functions
    $scope.loadTimeMap("myjson.json");
}]);
