/// <reference path="../typings/jquery/jquery.d.ts"/>
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http', '$location', function(VisDataSet, $scope, $http, $location, $timeout, $routeParams,$log) {
    function invalidRow(num, col) {
        var row = num;
        $("body").prepend("Row " + row + ", Column " + col + ": contains errors. Please correct and try again.");

    }
    $scope.timeBoxValue = ''; // set time on click
    $scope.currentMap;
    $scope.hiddenVisObj = [];
    $scope.currentlyLoadingKey = { url: '', key: ''}; //for error reporting
    /* reportError () -- outputs error message to user when something fails */
    function reportError(msg) {

        $("body").prepend(msg);

    }
    $scope.iframeStr = ''; // stores map title for addFolder
    /*
    Creates folder to store map layers and masterSheet

    */
    $scope.addFolder = function () {
    createPublicFolder($scope.mapName);
    };
    $scope.onFoldercreate = function(id) {


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
                        kind: String(currentRow.gsx$type.$t),
                        lat: currentRow.gsx$latitude.$t || invalidRow(i, 'gsx$latitude'),
                        lng: currentRow.gsx$longitude.$t || invalidRow(i, 'gsx$latitude'),
                        tags: toTags(currentRow.gsx$tags.$t) || invalidRow(i, 'tags'),
                        url: String(currentRow.gsx$datasource.$t) || invalidRow(i, 'datasource'),
                        start: new Date(currentRow.gsx$startdate.$t) || invalidRow(i, 'startDate'),
                        end: new Date(currentRow.gsx$enddate.$t) || invalidRow(i, 'endDate'),
                        format: currentRow.gsx$format.$t || invalidRow(i, 'gsx$format')

                    };
                    console.log(dataItem);
                    for (var l = 0; l < dataItem.tags.length; l++) {
                        tags.push(dataItem.tags[l]);
                    }
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
        var exportData = {
            items: exportList,
            tagset: tags.unique()
        };
        return exportData;
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
            projection: "EPSG:4326",
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
    //$scope.googleData = googleDataLoader.getData();
    //update map center and zoom from URL
    var promise;
    $scope.$on("centerUrlHash", function(event, centerHash) {
        $location.search({
            c: centerHash
        });
    });
    $scope.$on('visTimelineChange', function(event, args) {
     console.log($scope.olMarkers);
        var visibleItems = args.objects;
        console.log('visibleItems',visibleItems,'$scope.olMarkers',$scope.olMarkers,'hiddenVisObj',$scope.hiddenVisObj);
        //filter markers by visibility
        for (var i = 0; i < $scope.olMarkers.length; i++) {
          if (!(visibleItems.contains($scope.olMarkers[i].id))) {
            $scope.hiddenVisObj.push($scope.olMarkers[i]);
            $scope.olMarkers.splice(i, 1);
          }
        }
        for (var i = 0; i <  $scope.hiddenVisObj.length; i++) {
          if (visibleItems.contains($scope.hiddenVisObj[i].id)) {
            $scope.olMarkers.push($scope.hiddenVisObj[i]);
            $scope.hiddenVisObj.splice(i, 1);
          }
        }
        $scope.$apply(); //update map

    });


    $scope.loadGoogleMapsData = function(url) {
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
                name: "Hide "+output.tagset[i],
                val:  output.tagset[i]
              };
              $scope.filters.push(filterObj);
            }

            console.log($scope.dataSet);
            $scope.format_dataSet(output);
            $scope.currentMap = output;
        }).error(function(data) {
            console.log(data);
            //display a help box if access denied
            if (typeof data !== "undefined") {

              $('#help').modal('show');

            }
            reportError('Could not load data from source:' + String(data));
        });
    };
    /*
    Loads selected google drive file onto Map
    */
    $scope.addLayer = function(gmapItem) {
        console.log('input:', gmapItem);
        //for errors
        $scope.currentlyLoadingKey.url = String(gmapItem.link);
        $scope.currentlyLoadingKey.key = gmapItem.id;
        $scope.frameName = '';
        console.log($scope.currentlyLoadingKey.url);
        //it's 1:21 AM and I don't wanna figure out why ng-src isn't working right
        $("#publishbox").attr("src",gmapItem.link);
        //make it Jacob proof
        $scope.loadGoogleMapsData(gmapItem.id);
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
        var tags = set.tagset;
        var markers = set.items;
        for (var i = 0; i < tags.length; i++) {
            var group = {
                "id": i + 1,
                "content": tags[i],
                "value": tags[i]
            };
          $scope.visGroups.push(group);
        }
        //create vis markers
        for (var i = 0; i < markers.length; i++) {
          if (markers[i].kind === 'marker') {
            var marker = {
                "id": i + 1,
                "lat": markers[i].lat,
                "log": markers[i].lng,
                "name": markers[i].content
            };
            $scope.olMarkers.push(marker);
          } else if (markers[i].kind === 'layer') {
            var layer = {
                "id": i + 1,
                "dataType": markers[i].format,
                "lat": markers[i].lat,
                "log": markers[i].lng,
                "dataURL": markers[i].url
            };
            console.log('layer:',layer);
            $scope.olLayers.push(layer);
            $scope.$apply(); //update map
          }
        }
      for (var i = 0; i < $scope.dataSet.length; i++) {
        var visDatRow = [];
        var visObj = {
            id: i+1,
            content: $scope.dataSet[i].content,
            type: "range",
            group: 1,
            start: String($scope.dataSet[i].start),
            end: String($scope.dataSet[i].end)
        };
        console.log(visObj);
        visDatRow.push(visObj);
        $scope.visItems.add(visDatRow);
      }
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
            // start: null,
            // end: null,
            height: '200px',
            // width: '100%',
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

        $scope.options = angular.extend(options, {
            groupOrder: orderedContent,
            editable: false
        })

        $scope.onRangeChange = function(period) {
            //console.log('rng:', period);
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

    //1j3DbdVxCrlBpl4ZDWVuAZEgJSVcB7Tswj65fAnT4zF0
  //  $scope.loadTimeMap('1j3DbdVxCrlBpl4ZDWVuAZEgJSVcB7Tswj65fAnT4zF0');
}]);
