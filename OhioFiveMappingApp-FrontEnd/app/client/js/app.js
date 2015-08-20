var mapApp = angular.module('mapApp', ['ngVis','openlayers-directive', 'ngRoute', 'isteven-multi-select','ngCookies']);
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
