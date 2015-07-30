var mapApp = angular.module('mapApp', ['ngVis', 'openlayers-directive', 'ngRoute', 'isteven-multi-select']);
mapApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/m/:mapid', {

    templateUrl: './index.html',
    controller: 'mainCtrl'
  }).otherwise({
    templateUrl: './index.html',
    controller: 'mainCtrl'
      });
}]);
