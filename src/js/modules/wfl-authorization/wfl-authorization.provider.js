'use strict';

angular.
module('wflAuthorization').
provider('wflAuthorization', AuthorizationProvider);

/**
 * @ngdoc provider
 * @name wflAuthorizationProvider
 */
function AuthorizationProvider() {
  
  let self = this;

  const MILI_SEC_IN_DAY = 86400000;
  const MILI_SEC_IN_WEEK = 604800000;
  const COOKIE_KEY = '_authorizationUserData';

  let defaults = this.defaults = {
    connection: {
      url: '',
      method: 'POST',
    },
    cookie: {
      key: COOKIE_KEY,
      expiresShort: new Date( Date.now() + MILI_SEC_IN_DAY),
      expiresLong: new Date( Date.now() + MILI_SEC_IN_WEEK),
      options: {}, 
    },
  };

  this.setOptions = (options) => {
    return angular.isObject(options) && angular.merge(defaults, options);
  };

  this.setCookieOptions = (options) => {
    return angular.isObject(options) && this.setOptions({cookie: options});
  };
  this.setConnectionOptions = (options) => {
    return angular.isObject(options) && this.setOptions({connection: options});
  };

  /**
   * @ngdoc service
   * @name wflAuthorization
   */
  this.$get = ['$cookies', '$q', '$http', '$httpParamSerializerJQLike', '$rootScope',
    function($cookies, $q, $http, $httpParamSerializerJQLike, $rootScope){
      let data = {
        cookie: null,
        isAuthorized: false,
        user: null,
      };

      function removeCookie(){
        $cookies.remove(defaults.cookie.key);
        data.cookie = null;
      }

      function setCookie(value, options = defaults.cookie.options){
          data.cookie = angular.toJson(value);
          $cookies.put(defaults.cookie.key, data.cookie, options);
      }

      function getCookie(){
        if(!data.cookie && typeof $cookies.get(defaults.cookie.key) !== 'undefined') data.cookie = $cookies.getObject(defaults.cookie.key);
        return data.cookie;
      }      

      function connect(connection){
        var deferred = $q.defer();
        connection.data = connection.data ? $httpParamSerializerJQLike(connection.data) : null;

        $http(connection).then ( 
        (response) => deferred.resolve(response), 
        (response) => deferred.reject(response)
        );                     
        return deferred.promise;
      }

      function authorize(user){
        data.user = user;        
        data.isAuthorized = true;   
        setCookie(user);
        return user;    
      }

      function clearUser() {
        removeCookie();
        data.user = null;
        data.isAuthorized = false;
        return data.user;
      }

      function registerLoginEvent(){
        $rootScope.$emit("wflAuthorization:login", data);
      }
      function registerLogoutEvent(){
        $rootScope.$emit("wflAuthorization:logout", data);
      }


      return {
        /**
         * @param  {Object} user
         * Tries to log user, if it happened fired the login event 
         * @return {Promise}
         *
         * @example:
         *  Service.login({data : {
         *    username : username,
         *    password : password,
         *  }});
         * 
         *  Service.login({headers : {
         *    'Authorization' : 'Basic '+ btoa(username + ":" + password),
         *  }});
         * 
         */
        login(user, remember = false){
          defaults.cookie.options.expires = remember ? defaults.cookie.expiresLong : defaults.cookie.expiresShort;
          let connection = angular.merge({}, defaults.connection, user);

          return connect(connection).then(
            (response)=>{
              authorize(user);
              registerLoginEvent();
              return response;
            },
            (response)=>{
              if(response.status == 401) clearUser();
              return response;
            }
          );
        },

        /**
         * Removes the cookie, purifies the user Object, set isAuthorized to false 
         * then fires logout event
         * @return {Promise}
         */
        logout(){
          let deferred = $q.defer();
          if( clearUser() === null ){
            deferred.resolve(data);   
            registerLogoutEvent();            
          } else {
            deferred.reject(data);
          }
          return deferred.promise;
        },

        /**
         * Login event handler 
         * @param  {Object}   scope    $scope
         * @param  {Function} callback 
         */
        onLogin: function(scope, callback) {
          var handler = $rootScope.$on('wflAuthorization:login', callback);
          scope.$on('$destroy', handler);
        },
        /**
         * Logout event handler
         * @param  {Object}   scope    $scope
         * @param  {Function} callback 
         */
        onLogout: function(scope, callback) {
          var handler = $rootScope.$on('wflAuthorization:logout', callback);
          scope.$on('$destroy', handler);
        },

        /**
         * Public method for manually removing the cookie 
         */
        removeCookie(){
          removeCookie();
        }, 

        /**
         * @return {Object} Data than contain user, cookie, isAuthorized status
         */
        get data(){
          return data;
        },

        /**
         * @return {Object} Deserialized cookie value, null if the cookie does not exist.
         */
        get cookie(){
         return getCookie();
        },

        /**
         * You can manually overwrite the cookie value
         * @param  {Object | String} value New cookie value
         */
        set cookie(value){
          setCookie(value);
        },

        /**
         * @return {Object} User value, null if the user does not logged on.
         */
        get user(){
          return data.user;
        },
      };
  }];
}