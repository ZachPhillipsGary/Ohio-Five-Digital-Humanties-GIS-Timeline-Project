/// <reference path="../typings/jquery/jquery.d.ts"/>
var mapApp = angular.module('mapApp', ['ngVis', 'openlayers-directive', 'isteven-multi-select']);
mapApp.controller('mainCtrl', ['VisDataSet', '$scope', '$http', function(VisDataSet, $scope, $http, $location, $timeout) {
    /* reportError () -- outputs error message to user when something fails */
    function reportError(msg) {

      $( "body" ).prepend( msg );

    }

    //dataSet -- stores all results from ajax request
    $scope.dataSet = [];
    /*
    dataSet object Template
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

    $scope.loadMarkers = function(url) {
    $http.get(url).success(function(data) {
        if (data) {
          console.log(data);
          for (var i = 0; i < data.length; i++) {
              $scope.dataSet.push(data[i]);
              var rowGroups = data[i].groups;
              for (var k = 0; k < rowGroups.length; k++) {
                if ($scope.visGroups.length > 0) {
                    if (!($scope.visGroups.contains(rowGroups[k]))) {
                      var group = {
                        "id": $scope.visGroups.length+1,
                        "content": rowGroups[k],
                        "value": rowGroups[k]
                      };
                      console.log(group);
                      $scope.visGroups.push(group);
                    }
                } else {
                  var group = {
                    "id": $scope.visGroups.length+1,
                    "content": rowGroups[k],
                    "value": rowGroups[k]
                  };
                  console.log(group);
                  $scope.visGroups.push(group);
                }
                }

              }
          }
        $scope.initTimeline($scope.visGroups, $scope.visItems);
    }).error(function(data){ reportError('Could not load data from source:'); });


    $scope.initTimeline = function(Groups, Items) {
        //vis datasets for groups and marker items
        var groups = VisDataSet(Groups);
        console.log(Groups);
        var items = VisDataSet(Items);

        //markers from googleSheets
        $scope.markers = [];
        //static layers
        $scope.layers = [];
        //set map height dynamically
        $scope.mapHeight = '500px';

        //list of filters for timemap
        $scope.filters = [];
        //selected filters from filter dropdown
        $scope.selectedFilters = [];


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
            selectable: [true, false],
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
      };
        //starting point for map
        var now = moment().minutes(0).seconds(0).milliseconds(0);
        $scope.data = {
            groups: groups,
            items: items
        };
        var sampleData = function() {
            return VisDataSet([{
                id: 1,
                content: '<i class="fi-flag"></i> item 1',
                start: moment().add('days', 1),
                className: 'magenta'
            }, {
                id: 2,
                content: '<a href="http://visjs.org" target="_blank">visjs.org</a>',
                start: moment().add('days', 2)
            }, {
                id: 3,
                content: 'item 3',
                start: moment().add('days', -2)
            }, {
                id: 4,
                content: 'item 4',
                start: moment().add('days', 1),
                end: moment().add('days', 3),
                type: 'range'
            }, {
                id: 7,
                content: '<i class="fi-anchor"></i> item 7',
                start: moment().add('days', -3),
                end: moment().add('days', -2),
                type: 'range',
                className: 'orange'
            }, {
                id: 5,
                content: 'item 5',
                start: moment().add('days', -1),
                type: 'point'
            }, {
                id: 6,
                content: 'item 6',
                start: moment().add('days', 4),
                type: 'point'
            }]);
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
    $scope.loadMarkers('myjson.json');

}]);
