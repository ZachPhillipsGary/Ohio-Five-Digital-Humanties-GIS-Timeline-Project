
  // DOM element where the Timeline will be attached
angular.module('ohFivetimemap',)
.controller('Controller', ['$scope','$location', '$timeout', function($scope,$location,$timeout) {
 /*
  $scope.data -- js object containing dataset + map location
    data -- vis Dataset variable for storing map data, populalated on init
    container -- id of container div for vis.js Timeleine
 */
  $scope.data = {
    items: new vis.DataSet([
    {id: 1, content: 'item 1', start: '2014-04-20'},
    {id: 2, content: 'item 2', start: '2014-04-14'},
    {id: 3, content: 'item 3', start: '2014-04-18'},
    {id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19'},
    {id: 5, content: 'item 5', start: '2014-04-25'},
    {id: 6, content: 'item 6', start: '2014-04-27', type: 'point'}
  ]),
//hardcoding ID for now, need to change to URL param
    container: document.getElementById('visualization')
  };
  
    // Create a DataSet (allows two way data-binding)
  var items = $scope.data.items;

  // Configuration for the Timeline
  var options = {};
 
  // Create a Timeline
  var timeline = new vis.Timeline($scope.data.container, items, options);

      var map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.MapQuest({layer: 'sat'})
          })
        ],
        view: new ol.View({
          center: ol.proj.transform([37.41, 8.82], 'EPSG:4326', 'EPSG:3857'),
          zoom: 4
        })
      });
      
      //update date and timeeline
    timeline.on('rangechange', function (event, properties) {
      $('#timeDate').html(timeline.getCurrentTime());
    });
//setTimeline to a particular position
function setTimeline(id) {
    $('#timeDate').html(timeline.getCurrentTime());
    setCurrentTime(time)	
    var visibleItems = timeline.getVisibleItems();
    timeline.redraw();
}

      var data = [{ id: 0, text: 'enhancement' }, { id: 1, text: 'bug' }, { id: 2, text: 'duplicate' }, { id: 3, text: 'invalid' }, { id: 4, text: 'wontfix' }];

  
}]);
/*

.directive('map', function() {
  return {
    template: 'Name: {{customer.name}} Address: {{customer.address}}'
  };
});


*/




