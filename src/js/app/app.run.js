'use strict';

angular.
  module('app').
	  run(['wflAuthorization', 
	  	function(wflAuthorization) {

	  		if(wflAuthorization.cookie){
	  			let user = angular.isString(wflAuthorization.cookie) ? angular.fromJson( atob(wflAuthorization.cookie) ) : wflAuthorization.cookie;
	  			wflAuthorization.login( user ).then(()=>{
	  				wflAuthorization.cookie = btoa(wflAuthorization.cookie);
	  			});
	  		}

	  }]);