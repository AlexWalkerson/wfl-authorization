'use strict';

class AuthorizationController{
  constructor(wflAuthorization){
    this.authorizationService = wflAuthorization;
  	this.authorizationData = wflAuthorization.data;    
  }
  signIn(){
    let authData = btoa(this.username + ":" + this.password);
    this.authorizationService.login({headers : {
     'X-PROXY-Authorization' : 'Basic '+ authData,
   }}).then(()=>{
    this.authorizationService.cookie = btoa(this.authorizationService.cookie);
   });
  }
  signOut(){
    this.authorizationService.logout();
  } 
}

AuthorizationController.$inject = ['wflAuthorization'];

// Example `wflAuthorization` component, along with its associated controller and template
angular.
module('wflAuthorization').
component('wflAuthorizationComponent', {
  controller: AuthorizationController,
  template: `
  <div class="navbar-form navbar-right">
  <form ng-submit="$ctrl.signIn()" ng-if="!$ctrl.authorizationData.isAuthorized">
  <div class="form-group">
  <input type="text" placeholder="username" class="form-control" ng-model="$ctrl.username" required="">
  </div>
  <div class="form-group">
  <input type="password" placeholder="Password" class="form-control" ng-model="$ctrl.password" required="">
  </div>
  <button type="submit" class="btn btn-success">Sign in</button>
  </form>
  <button type="submit" class="btn btn-success" ng-click="$ctrl.signOut()" ng-if="$ctrl.authorizationData.isAuthorized">Sign out</button>
  </div>
  `,
});
