'use strict';

angular.
  module('app').
  config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'wflAuthorizationProvider',
   function($stateProvider, $urlRouterProvider, $locationProvider, wflAuthorizationProvider) {

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false,
    }).hashPrefix('*');

    $urlRouterProvider.otherwise('/');

    $stateProvider.state({
      name: 'otherwise',
      url: '/*path',
      views: {
        'qwe': {
          component: 'wflAuthorizationComponent',
        }, 	
      },
    });

    wflAuthorizationProvider.setConnectionOptions({
      url: 'server/proxy.php',
      data: {
        coID: 1,
        sku: 1,
      },
      headers: {          
        'X-PROXY-Content-type': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

  }]);