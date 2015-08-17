var mapApp = angular.module('mapApp', ['ngVis', 'openlayers-directive', 'ngCookies', 'ngRoute', 'isteven-multi-select']);
mapApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/help', {

    templateUrl: './help.html',
    controller: 'helpCtrl'
  }).otherwise({
    templateUrl: './index.html',
    controller: 'mainCtrl'
      });
}]);
