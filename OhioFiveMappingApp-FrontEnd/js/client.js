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
        $scope.customLayers = false; //set to false until we find a layer element
        var exportList = []; //return a copy of the date for tag generation
        if (rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                //insert row data into dataSet
                var currentRow = rows[i];
                if (currentRow.gsx$type.$t === 'marker') {
                  console.log('marker:',currentRow);
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
                    console.log('marker system:',dataItem);
                    exportList.push(dataItem);
                    $scope.olLayers.push(dataItem);
                    console.log('marker system:',$scope.olLayers);

                } else if (currentRow.gsx$type.$t === 'layer') {
                    //turn on custom layers if we have any
                    console.log(currentRow.gsx$type.$t);
                    $scope.customLayers = true;
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
                  console.log(currentRow.gsx$type.$t);
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
        //    var markers =
            //  $scope.olMarkers.push(markers);
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

    $scope.format_dataSet = function(set) {
        //console.log(returnFilelist());
        var data; //dataset to format
        if (set <= $scope.dataSet.length) {
            data = $scope.dataSet[set];
        } else {
            reportError("invalid dataSet, could not format");
        }

        $scope.initTimeline();
    };

/*
loadGoogleMapsData()
preconditions: url {string} = Google Sheet Key
post: $scope.olMarkers and $scope.olLayers populated with data
map init invoked
*/
    $scope.loadGoogleMapsData = function(url) {
        var urlString = "https://jsonp.afeld.me/?url=http://spreadsheets.google.com/feeds/list/" + url + "/od6/public/values?alt=json";
        $http.get(urlString).success(function(data) {
            console.log(data);
            var rows = data.feed.entry; //rows from dataset
            $scope.dataSet = insertData(rows);
            console.log('Data',$scope.dataSet);
            $scope.initTimeline();

        }).error(function(data) {
            console.log(data);
            reportError('Could not load data from source:' + String(data));
        });
    };
    $scope.addLayer = function(gmapItem) {
        console.log('input:', gmapItem);
        $scope.loadGoogleMapsData(gmapItem.id);
    };


    $scope.graphEvents = {
        rangechange: $scope.onRangeChange,
        rangechanged: $scope.onRangeChange,
        onload: $scope.onLoaded
    };

$scope.initTimeline = function() {


      $scope.logs = {};

      $scope.customLayer = 'false';

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
          selectable: [true, false],
          editable: [true, false]
      };

      var options = {
          align: 'center', // left | right (String)
          autoResize: true, // false (Boolean)
          editable: true,
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
          showCustomTime: true,
          showMajorLabels: true,
          showMinorLabels: true
          // type: 'box', // dot | point
          // zoomMin: 1000,
          // zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 10,
          // groupOrder: 'content'
      };

      var now = moment().minutes(0).seconds(0).milliseconds(0);

      var sampleData = function () {
          return VisDataSet([
              {
                  id: 1,
                  content: '<i class="fi-flag"></i> item 1',
                  start: moment().add('days', 1),
                  className: 'magenta'
              },
              {
                  id: 2,
                  content: '<a href="http://visjs.org" target="_blank">visjs.org</a>',
                  start: moment().add('days', 2)
              },
              {
                  id: 3,
                  content: 'item 3',
                  start: moment().add('days', -2)
              },
              {
                  id: 4,
                  content: 'item 4',
                  start: moment().add('days', 1),
                  end: moment().add('days', 3),
                  type: 'range'
              },
              {
                  id: 7,
                  content: '<i class="fi-anchor"></i> item 7',
                  start: moment().add('days', -3),
                  end: moment().add('days', -2),
                  type: 'range',
                  className: 'orange'
              },
              {
                  id: 5,
                  content: 'item 5',
                  start: moment().add('days', -1),
                  type: 'point'
              },
              {
                  id: 6,
                  content: 'item 6',
                  start: moment().add('days', 4),
                  type: 'point'
              }
          ]);
      };

      var groups = VisDataSet([
              {id: 0, content: 'First', value: 1},
              {id: 1, content: 'Third', value: 3},
              {id: 2, content: 'Second', value: 2}
          ]);
      var items = VisDataSet([
              {id: 0, group: 0, content: 'item 0', start: new Date(2014, 3, 17), end: new Date(2014, 3, 21)},
              {id: 1, group: 0, content: 'item 1', start: new Date(2014, 3, 19), end: new Date(2014, 3, 20)},
              {id: 2, group: 1, content: 'item 2', start: new Date(2014, 3, 16), end: new Date(2014, 3, 24)},
              {id: 3, group: 1, content: 'item 3', start: new Date(2014, 3, 23), end: new Date(2014, 3, 24)},
              {id: 4, group: 1, content: 'item 4', start: new Date(2014, 3, 22), end: new Date(2014, 3, 26)},
              {id: 5, group: 2, content: 'item 5', start: new Date(2014, 3, 24), end: new Date(2014, 3, 27)}
          ]);

      $scope.data = {groups: groups, items: items};
      var orderedContent = 'content';
      var orderedSorting = function (a, b) {
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

      $scope.onSelect = function (items) {
          // debugger;
          alert('select');
      };

      $scope.onClick = function (props) {
          //debugger;
          alert('Click');
      };

      $scope.onDoubleClick = function (props) {
          // debugger;
          alert('DoubleClick');
      };

      $scope.rightClick = function (props) {
          alert('Right click!');
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
    $selectedData = [];
  //  $scope.loadTimeMap("myjson.json");
   $scope.loadGoogleMapsData('1j9Z3bmaoCNd3DC1Vju2xCLsyYJW_SPiSOWBrYgt0F6o');
}]);
