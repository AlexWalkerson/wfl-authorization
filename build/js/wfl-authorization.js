'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (window, angular) {
  'use strict';

  // Define the `wflAuthorization` module

  angular.module('wflAuthorization', ['ngCookies']);
  'use strict';

  angular.module('wflAuthorization').provider('wflAuthorization', AuthorizationProvider);

  /**
   * @ngdoc provider
   * @name wflAuthorizationProvider
   */
  function AuthorizationProvider() {
    var _this = this;

    var self = this;

    var MILI_SEC_IN_DAY = 86400000;
    var MILI_SEC_IN_WEEK = 604800000;
    var COOKIE_KEY = '_authorizationUserData';

    var defaults = this.defaults = {
      connection: {
        url: '',
        method: 'POST'
      },
      cookie: {
        key: COOKIE_KEY,
        expiresShort: new Date(Date.now() + MILI_SEC_IN_DAY),
        expiresLong: new Date(Date.now() + MILI_SEC_IN_WEEK),
        options: {}
      }
    };

    this.setOptions = function (options) {
      return angular.isObject(options) && angular.merge(defaults, options);
    };

    this.setCookieOptions = function (options) {
      return angular.isObject(options) && _this.setOptions({ cookie: options });
    };
    this.setConnectionOptions = function (options) {
      return angular.isObject(options) && _this.setOptions({ connection: options });
    };

    /**
     * @ngdoc service
     * @name wflAuthorization
     */
    this.$get = ['$cookies', '$q', '$http', '$httpParamSerializerJQLike', '$rootScope', function ($cookies, $q, $http, $httpParamSerializerJQLike, $rootScope) {
      var data = {
        cookie: null,
        isAuthorized: false,
        user: null
      };

      function _removeCookie() {
        $cookies.remove(defaults.cookie.key);
        data.cookie = null;
      }

      function setCookie(value) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaults.cookie.options;

        data.cookie = angular.toJson(value);
        $cookies.put(defaults.cookie.key, data.cookie, options);
      }

      function getCookie() {
        if (!data.cookie && typeof $cookies.get(defaults.cookie.key) !== 'undefined') data.cookie = $cookies.getObject(defaults.cookie.key);
        return data.cookie;
      }

      function connect(connection) {
        var deferred = $q.defer();
        connection.data = connection.data ? $httpParamSerializerJQLike(connection.data) : null;

        $http(connection).then(function (response) {
          return deferred.resolve(response);
        }, function (response) {
          return deferred.reject(response);
        });
        return deferred.promise;
      }

      function authorize(user) {
        data.user = user;
        data.isAuthorized = true;
        setCookie(user);
        return user;
      }

      function clearUser() {
        _removeCookie();
        data.user = null;
        data.isAuthorized = false;
        return data.user;
      }

      function registerLoginEvent() {
        $rootScope.$emit("wflAuthorization:login", data);
      }
      function registerLogoutEvent() {
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
        login: function login(user) {
          var remember = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          defaults.cookie.options.expires = remember ? defaults.cookie.expiresLong : defaults.cookie.expiresShort;
          var connection = angular.merge({}, defaults.connection, user);

          return connect(connection).then(function (response) {
            authorize(user);
            registerLoginEvent();
            return response;
          }, function (response) {
            if (response.status == 401) clearUser();
            return response;
          });
        },


        /**
         * Removes the cookie, purifies the user Object, set isAuthorized to false 
         * then fires logout event
         * @return {Promise}
         */
        logout: function logout() {
          var deferred = $q.defer();
          if (clearUser() === null) {
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
        onLogin: function onLogin(scope, callback) {
          var handler = $rootScope.$on('wflAuthorization:login', callback);
          scope.$on('$destroy', handler);
        },
        /**
         * Logout event handler
         * @param  {Object}   scope    $scope
         * @param  {Function} callback 
         */
        onLogout: function onLogout(scope, callback) {
          var handler = $rootScope.$on('wflAuthorization:logout', callback);
          scope.$on('$destroy', handler);
        },

        /**
         * Public method for manually removing the cookie 
         */
        removeCookie: function removeCookie() {
          _removeCookie();
        },


        /**
         * @return {Object} Data than contain user, cookie, isAuthorized status
         */
        get data() {
          return data;
        },

        /**
         * @return {Object} Deserialized cookie value, null if the cookie does not exist.
         */
        get cookie() {
          return getCookie();
        },

        /**
         * You can manually overwrite the cookie value
         * @param  {Object | String} value New cookie value
         */
        set cookie(value) {
          setCookie(value);
        },

        /**
         * @return {Object} User value, null if the user does not logged on.
         */
        get user() {
          return data.user;
        }
      };
    }];
  }
  'use strict';

  var AuthorizationController = function () {
    function AuthorizationController(wflAuthorization) {
      _classCallCheck(this, AuthorizationController);

      this.authorizationService = wflAuthorization;
      this.authorizationData = wflAuthorization.data;
    }

    _createClass(AuthorizationController, [{
      key: 'signIn',
      value: function signIn() {
        var _this2 = this;

        var authData = btoa(this.username + ":" + this.password);
        this.authorizationService.login({ headers: {
            'X-PROXY-Authorization': 'Basic ' + authData
          } }).then(function () {
          _this2.authorizationService.cookie = btoa(_this2.authorizationService.cookie);
        });
      }
    }, {
      key: 'signOut',
      value: function signOut() {
        this.authorizationService.logout();
      }
    }]);

    return AuthorizationController;
  }();

  AuthorizationController.$inject = ['wflAuthorization'];

  // Example `wflAuthorization` component, along with its associated controller and template
  angular.module('wflAuthorization').component('wflAuthorizationComponent', {
    controller: AuthorizationController,
    template: '\n  <div class="navbar-form navbar-right">\n  <form ng-submit="$ctrl.signIn()" ng-if="!$ctrl.authorizationData.isAuthorized">\n  <div class="form-group">\n  <input type="text" placeholder="username" class="form-control" ng-model="$ctrl.username" required="">\n  </div>\n  <div class="form-group">\n  <input type="password" placeholder="Password" class="form-control" ng-model="$ctrl.password" required="">\n  </div>\n  <button type="submit" class="btn btn-success">Sign in</button>\n  </form>\n  <button type="submit" class="btn btn-success" ng-click="$ctrl.signOut()" ng-if="$ctrl.authorizationData.isAuthorized">Sign out</button>\n  </div>\n  '
  });
})(window, window.angular);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndmbC1hdXRob3JpemF0aW9uLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFuZ3VsYXIiLCJtb2R1bGUiLCJwcm92aWRlciIsIkF1dGhvcml6YXRpb25Qcm92aWRlciIsInNlbGYiLCJNSUxJX1NFQ19JTl9EQVkiLCJNSUxJX1NFQ19JTl9XRUVLIiwiQ09PS0lFX0tFWSIsImRlZmF1bHRzIiwiY29ubmVjdGlvbiIsInVybCIsIm1ldGhvZCIsImNvb2tpZSIsImtleSIsImV4cGlyZXNTaG9ydCIsIkRhdGUiLCJub3ciLCJleHBpcmVzTG9uZyIsIm9wdGlvbnMiLCJzZXRPcHRpb25zIiwiaXNPYmplY3QiLCJtZXJnZSIsInNldENvb2tpZU9wdGlvbnMiLCJzZXRDb25uZWN0aW9uT3B0aW9ucyIsIiRnZXQiLCIkY29va2llcyIsIiRxIiwiJGh0dHAiLCIkaHR0cFBhcmFtU2VyaWFsaXplckpRTGlrZSIsIiRyb290U2NvcGUiLCJkYXRhIiwiaXNBdXRob3JpemVkIiwidXNlciIsInJlbW92ZUNvb2tpZSIsInJlbW92ZSIsInNldENvb2tpZSIsInZhbHVlIiwidG9Kc29uIiwicHV0IiwiZ2V0Q29va2llIiwiZ2V0IiwiZ2V0T2JqZWN0IiwiY29ubmVjdCIsImRlZmVycmVkIiwiZGVmZXIiLCJ0aGVuIiwicmVzcG9uc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicHJvbWlzZSIsImF1dGhvcml6ZSIsImNsZWFyVXNlciIsInJlZ2lzdGVyTG9naW5FdmVudCIsIiRlbWl0IiwicmVnaXN0ZXJMb2dvdXRFdmVudCIsImxvZ2luIiwicmVtZW1iZXIiLCJleHBpcmVzIiwic3RhdHVzIiwibG9nb3V0Iiwib25Mb2dpbiIsInNjb3BlIiwiY2FsbGJhY2siLCJoYW5kbGVyIiwiJG9uIiwib25Mb2dvdXQiLCJBdXRob3JpemF0aW9uQ29udHJvbGxlciIsIndmbEF1dGhvcml6YXRpb24iLCJhdXRob3JpemF0aW9uU2VydmljZSIsImF1dGhvcml6YXRpb25EYXRhIiwiYXV0aERhdGEiLCJidG9hIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImhlYWRlcnMiLCIkaW5qZWN0IiwiY29tcG9uZW50IiwiY29udHJvbGxlciIsInRlbXBsYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxDQUFDLFVBQVVBLE1BQVYsRUFBaUJDLE9BQWpCLEVBQTBCO0FBQzNCOztBQUVBOztBQUNBQSxVQUFRQyxNQUFSLENBQWUsa0JBQWYsRUFBbUMsQ0FDbEMsV0FEa0MsQ0FBbkM7QUFHQTs7QUFFQUQsVUFDQUMsTUFEQSxDQUNPLGtCQURQLEVBRUFDLFFBRkEsQ0FFUyxrQkFGVCxFQUU2QkMscUJBRjdCOztBQUlBOzs7O0FBSUEsV0FBU0EscUJBQVQsR0FBaUM7QUFBQTs7QUFFL0IsUUFBSUMsT0FBTyxJQUFYOztBQUVBLFFBQU1DLGtCQUFrQixRQUF4QjtBQUNBLFFBQU1DLG1CQUFtQixTQUF6QjtBQUNBLFFBQU1DLGFBQWEsd0JBQW5COztBQUVBLFFBQUlDLFdBQVcsS0FBS0EsUUFBTCxHQUFnQjtBQUM3QkMsa0JBQVk7QUFDVkMsYUFBSyxFQURLO0FBRVZDLGdCQUFRO0FBRkUsT0FEaUI7QUFLN0JDLGNBQVE7QUFDTkMsYUFBS04sVUFEQztBQUVOTyxzQkFBYyxJQUFJQyxJQUFKLENBQVVBLEtBQUtDLEdBQUwsS0FBYVgsZUFBdkIsQ0FGUjtBQUdOWSxxQkFBYSxJQUFJRixJQUFKLENBQVVBLEtBQUtDLEdBQUwsS0FBYVYsZ0JBQXZCLENBSFA7QUFJTlksaUJBQVM7QUFKSDtBQUxxQixLQUEvQjs7QUFhQSxTQUFLQyxVQUFMLEdBQWtCLFVBQUNELE9BQUQsRUFBYTtBQUM3QixhQUFPbEIsUUFBUW9CLFFBQVIsQ0FBaUJGLE9BQWpCLEtBQTZCbEIsUUFBUXFCLEtBQVIsQ0FBY2IsUUFBZCxFQUF3QlUsT0FBeEIsQ0FBcEM7QUFDRCxLQUZEOztBQUlBLFNBQUtJLGdCQUFMLEdBQXdCLFVBQUNKLE9BQUQsRUFBYTtBQUNuQyxhQUFPbEIsUUFBUW9CLFFBQVIsQ0FBaUJGLE9BQWpCLEtBQTZCLE1BQUtDLFVB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QUFBLGdDQXVPaEI7QUFDUCxhQUFLd0Qsb0JBQUwsQ0FBMEJULE1BQTFCO0FBQ0Q7QUF6T3dCOztBQUFBO0FBQUE7O0FBNE8zQk8sMEJBQXdCUyxPQUF4QixHQUFrQyxDQUFDLGtCQUFELENBQWxDOztBQUVBO0FBQ0EzRSxVQUNBQyxNQURBLENBQ08sa0JBRFAsRUFFQTJFLFNBRkEsQ0FFVSwyQkFGVixFQUV1QztBQUNyQ0MsZ0JBQVlYLHVCQUR5QjtBQUVyQ1k7QUFGcUMsR0FGdkM7QUFtQkMsQ0FsUUQsRUFrUUcvRSxNQWxRSCxFQWtRV0EsT0FBT0MsT0FsUWxCIiwiZmlsZSI6IndmbC1hdXRob3JpemF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICh3aW5kb3csYW5ndWxhcikge1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZWZpbmUgdGhlIGB3ZmxBdXRob3JpemF0aW9uYCBtb2R1bGVcclxuYW5ndWxhci5tb2R1bGUoJ3dmbEF1dGhvcml6YXRpb24nLCBbXHJcblx0J25nQ29va2llcycsXHJcblx0XSk7XHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIuXHJcbm1vZHVsZSgnd2ZsQXV0aG9yaXphdGlvbicpLlxyXG5wcm92aWRlcignd2ZsQXV0aG9yaXphdGlvbicsIEF1dGhvcml6YXRpb25Qcm92aWRlcik7XHJcblxyXG4vKipcclxuICogQG5nZG9jIHByb3ZpZGVyXHJcbiAqIEBuYW1lIHdmbEF1dGhvcml6YXRpb25Qcm92aWRlclxyXG4gKi9cclxuZnVuY3Rpb24gQXV0aG9yaXphdGlvblByb3ZpZGVyKCkge1xyXG4gIFxyXG4gIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgY29uc3QgTUlMSV9TRUNfSU5fREFZID0gODY0MDAwMDA7XHJcbiAgY29uc3QgTUlMSV9TRUNfSU5fV0VFSyA9IDYwNDgwMDAwMDtcclxuICBjb25zdCBDT09LSUVfS0VZID0gJ19hdXRob3JpemF0aW9uVXNlckRhdGEnO1xyXG5cclxuICBsZXQgZGVmYXVsdHMgPSB0aGlzLmRlZmF1bHRzID0ge1xyXG4gICAgY29ubmVjdGlvbjoge1xyXG4gICAgICB1cmw6ICcnLFxyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgIH0sXHJcbiAgICBjb29raWU6IHtcclxuICAgICAga2V5OiBDT09LSUVfS0VZLFxyXG4gICAgICBleHBpcmVzU2hvcnQ6IG5ldyBEYXRlKCBEYXRlLm5vdygpICsgTUlMSV9TRUNfSU5fREFZKSxcclxuICAgICAgZXhwaXJlc0xvbmc6IG5ldyBEYXRlKCBEYXRlLm5vdygpICsgTUlMSV9TRUNfSU5fV0VFSyksXHJcbiAgICAgIG9wdGlvbnM6IHt9LCBcclxuICAgIH0sXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zZXRPcHRpb25zID0gKG9wdGlvbnMpID0+IHtcclxuICAgIHJldHVybiBhbmd1bGFyLmlzT2JqZWN0KG9wdGlvbnMpICYmIGFuZ3VsYXIubWVyZ2UoZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gIH07XHJcblxyXG4gIHRoaXMuc2V0Q29va2llT3B0aW9ucyA9IChvcHRpb25zKSA9PiB7XHJcbiAgICByZXR1cm4gYW5ndWxhci5pc09iamVjdChvcHRpb25zKSAmJiB0aGlzLnNldE9wdGlvbnMoe2Nvb2tpZTogb3B0aW9uc30pO1xyXG4gIH07XHJcbiAgdGhpcy5zZXRDb25uZWN0aW9uT3B0aW9ucyA9IChvcHRpb25zKSA9PiB7XHJcbiAgICByZXR1cm4gYW5ndWxhci5pc09iamVjdChvcHRpb25zKSAmJiB0aGlzLnNldE9wdGlvbnMoe2Nvbm5lY3Rpb246IG9wdGlvbnN9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmdkb2Mgc2VydmljZVxyXG4gICAqIEBuYW1lIHdmbEF1dGhvcml6YXRpb25cclxuICAgKi9cclxuICB0aGlzLiRnZXQgPSBbJyRjb29raWVzJywgJyRxJywgJyRodHRwJywgJyRodHRwUGFyYW1TZXJpYWxpemVySlFMaWtlJywgJyRyb290U2NvcGUnLFxyXG4gICAgZnVuY3Rpb24oJGNvb2tpZXMsICRxLCAkaHR0cCwgJGh0dHBQYXJhbVNlcmlhbGl6ZXJKUUxpa2UsICRyb290U2NvcGUpe1xyXG4gICAgICBsZXQgZGF0YSA9IHtcclxuICAgICAgICBjb29raWU6IG51bGwsXHJcbiAgICAgICAgaXNBdXRob3JpemVkOiBmYWxzZSxcclxuICAgICAgICB1c2VyOiBudWxsLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmVtb3ZlQ29va2llKCl7XHJcbiAgICAgICAgJGNvb2tpZXMucmVtb3ZlKGRlZmF1bHRzLmNvb2tpZS5rZXkpO1xyXG4gICAgICAgIGRhdGEuY29va2llID0gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gc2V0Q29va2llKHZhbHVlLCBvcHRpb25zID0gZGVmYXVsdHMuY29va2llLm9wdGlvbnMpe1xyXG4gICAgICAgICAgZGF0YS5jb29raWUgPSBhbmd1bGFyLnRvSnNvbih2YWx1ZSk7XHJcbiAgICAgICAgICAkY29va2llcy5wdXQoZGVmYXVsdHMuY29va2llLmtleSwgZGF0YS5jb29raWUsIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRDb29raWUoKXtcclxuICAgICAgICBpZighZGF0YS5jb29raWUgJiYgdHlwZW9mICRjb29raWVzLmdldChkZWZhdWx0cy5jb29raWUua2V5KSAhPT0gJ3VuZGVmaW5lZCcpIGRhdGEuY29va2llID0gJGNvb2tpZXMuZ2V0T2JqZWN0KGRlZmF1bHRzLmNvb2tpZS5rZXkpO1xyXG4gICAgICAgIHJldHVybiBkYXRhLmNvb2tpZTtcclxuICAgICAgfSAgICAgIFxyXG5cclxuICAgICAgZnVuY3Rpb24gY29ubmVjdChjb25uZWN0aW9uKXtcclxuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgIGNvbm5lY3Rpb24uZGF0YSA9IGNvbm5lY3Rpb24uZGF0YSA/ICRodHRwUGFyYW1TZXJpYWxpemVySlFMaWtlKGNvbm5lY3Rpb24uZGF0YSkgOiBudWxsO1xyXG5cclxuICAgICAgICAkaHR0cChjb25uZWN0aW9uKS50aGVuICggXHJcbiAgICAgICAgKHJlc3BvbnNlKSA9PiBkZWZlcnJlZC5yZXNvbHZlKHJlc3BvbnNlKSwgXHJcbiAgICAgICAgKHJlc3BvbnNlKSA9PiBkZWZlcnJlZC5yZWplY3QocmVzcG9uc2UpXHJcbiAgICAgICAgKTsgICAgICAgIMKgwqDCoMKgwqDCoMKgwqDCoMKgwqDCoMKgXHJcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGF1dGhvcml6ZSh1c2VyKXtcclxuICAgICAgICBkYXRhLnVzZXIgPSB1c2VyOyAgICAgICAgXHJcbiAgICAgICAgZGF0YS5pc0F1dGhvcml6ZWQgPSB0cnVlOyAgIFxyXG4gICAgICAgIHNldENvb2tpZSh1c2VyKTtcclxuICAgICAgICByZXR1cm4gdXNlcjsgICAgXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNsZWFyVXNlcigpIHtcclxuICAgICAgICByZW1vdmVDb29raWUoKTtcclxuICAgICAgICBkYXRhLnVzZXIgPSBudWxsO1xyXG4gICAgICAgIGRhdGEuaXNBdXRob3JpemVkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gcmVnaXN0ZXJMb2dpbkV2ZW50KCl7XHJcbiAgICAgICAgJHJvb3RTY29wZS4kZW1pdChcIndmbEF1dGhvcml6YXRpb246bG9naW5cIiwgZGF0YSk7XHJcbiAgICAgIH1cclxuICAgICAgZnVuY3Rpb24gcmVnaXN0ZXJMb2dvdXRFdmVudCgpe1xyXG4gICAgICAgICRyb290U2NvcGUuJGVtaXQoXCJ3ZmxBdXRob3JpemF0aW9uOmxvZ291dFwiLCBkYXRhKTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSB1c2VyXHJcbiAgICAgICAgICogVHJpZXMgdG8gbG9nIHVzZXIsIGlmIGl0IGhhcHBlbmVkIGZpcmVkIHRoZSBsb2dpbiBldmVudCBcclxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQGV4YW1wbGU6XHJcbiAgICAgICAgICogIFNlcnZpY2UubG9naW4oe2RhdGEgOiB7XHJcbiAgICAgICAgICogICAgdXNlcm5hbWUgOiB1c2VybmFtZSxcclxuICAgICAgICAgKiAgICBwYXNzd29yZCA6IHBhc3N3b3JkLFxyXG4gICAgICAgICAqICB9fSk7XHJcbiAgICAgICAgICogXHJcbiAgICAgICAgICogIFNlcnZpY2UubG9naW4oe2hlYWRlcnMgOiB7XHJcbiAgICAgICAgICogICAgJ0F1dGhvcml6YXRpb24nIDogJ0Jhc2ljICcrIGJ0b2EodXNlcm5hbWUgKyBcIjpcIiArIHBhc3N3b3JkKSxcclxuICAgICAgICAgKiAgfX0pO1xyXG4gICAgICAgICAqIFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxvZ2luKHVzZXIsIHJlbWVtYmVyID0gZmFsc2Upe1xyXG4gICAgICAgICAgZGVmYXVsdHMuY29va2llLm9wdGlvbnMuZXhwaXJlcyA9IHJlbWVtYmVyID8gZGVmYXVsdHMuY29va2llLmV4cGlyZXNMb25nIDogZGVmYXVsdHMuY29va2llLmV4cGlyZXNTaG9ydDtcclxuICAgICAgICAgIGxldCBjb25uZWN0aW9uID0gYW5ndWxhci5tZXJnZSh7fSwgZGVmYXVsdHMuY29ubmVjdGlvbiwgdXNlcik7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGNvbm5lY3QoY29ubmVjdGlvbikudGhlbihcclxuICAgICAgICAgICAgKHJlc3BvbnNlKT0+e1xyXG4gICAgICAgICAgICAgIGF1dGhvcml6ZSh1c2VyKTtcclxuICAgICAgICAgICAgICByZWdpc3RlckxvZ2luRXZlbnQoKTtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChyZXNwb25zZSk9PntcclxuICAgICAgICAgICAgICBpZihyZXNwb25zZS5zdGF0dXMgPT0gNDAxKSBjbGVhclVzZXIoKTtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmVtb3ZlcyB0aGUgY29va2llLCBwdXJpZmllcyB0aGUgdXNlciBPYmplY3QsIHNldCBpc0F1dGhvcml6ZWQgdG8gZmFsc2UgXHJcbiAgICAgICAgICogdGhlbiBmaXJlcyBsb2dvdXQgZXZlbnRcclxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxvZ291dCgpe1xyXG4gICAgICAgICAgbGV0IGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICAgICAgIGlmKCBjbGVhclVzZXIoKSA9PT0gbnVsbCApe1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpOyAgIFxyXG4gICAgICAgICAgICByZWdpc3RlckxvZ291dEV2ZW50KCk7ICAgICAgICAgICAgXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBMb2dpbiBldmVudCBoYW5kbGVyIFxyXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gICBzY29wZSAgICAkc2NvcGVcclxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgb25Mb2dpbjogZnVuY3Rpb24oc2NvcGUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB2YXIgaGFuZGxlciA9ICRyb290U2NvcGUuJG9uKCd3ZmxBdXRob3JpemF0aW9uOmxvZ2luJywgY2FsbGJhY2spO1xyXG4gICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGhhbmRsZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTG9nb3V0IGV2ZW50IGhhbmRsZXJcclxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgc2NvcGUgICAgJHNjb3BlXHJcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIG9uTG9nb3V0OiBmdW5jdGlvbihzY29wZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgIHZhciBoYW5kbGVyID0gJHJvb3RTY29wZS4kb24oJ3dmbEF1dGhvcml6YXRpb246bG9nb3V0JywgY2FsbGJhY2spO1xyXG4gICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGhhbmRsZXIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFB1YmxpYyBtZXRob2QgZm9yIG1hbnVhbGx5IHJlbW92aW5nIHRoZSBjb29raWUgXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmVtb3ZlQ29va2llKCl7XHJcbiAgICAgICAgICByZW1vdmVDb29raWUoKTtcclxuICAgICAgICB9LCBcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybiB7T2JqZWN0fSBEYXRhIHRoYW4gY29udGFpbiB1c2VyLCBjb29raWUsIGlzQXV0aG9yaXplZCBzdGF0dXNcclxuICAgICAgICAgKi9cclxuICAgICAgICBnZXQgZGF0YSgpe1xyXG4gICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybiB7T2JqZWN0fSBEZXNlcmlhbGl6ZWQgY29va2llIHZhbHVlLCBudWxsIGlmIHRoZSBjb29raWUgZG9lcyBub3QgZXhpc3QuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0IGNvb2tpZSgpe1xyXG4gICAgICAgICByZXR1cm4gZ2V0Q29va2llKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogWW91IGNhbiBtYW51YWxseSBvdmVyd3JpdGUgdGhlIGNvb2tpZSB2YWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdCB8IFN0cmluZ30gdmFsdWUgTmV3IGNvb2tpZSB2YWx1ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNldCBjb29raWUodmFsdWUpe1xyXG4gICAgICAgICAgc2V0Q29va2llKHZhbHVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFVzZXIgdmFsdWUsIG51bGwgaWYgdGhlIHVzZXIgZG9lcyBub3QgbG9nZ2VkIG9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldCB1c2VyKCl7XHJcbiAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgfV07XHJcbn1cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuY2xhc3MgQXV0aG9yaXphdGlvbkNvbnRyb2xsZXJ7XHJcbiAgY29uc3RydWN0b3Iod2ZsQXV0aG9yaXphdGlvbil7XHJcbiAgICB0aGlzLmF1dGhvcml6YXRpb25TZXJ2aWNlID0gd2ZsQXV0aG9yaXphdGlvbjtcclxuICBcdHRoaXMuYXV0aG9yaXphdGlvbkRhdGEgPSB3ZmxBdXRob3JpemF0aW9uLmRhdGE7ICAgIFxyXG4gIH1cclxuICBzaWduSW4oKXtcclxuICAgIGxldCBhdXRoRGF0YSA9IGJ0b2EodGhpcy51c2VybmFtZSArIFwiOlwiICsgdGhpcy5wYXNzd29yZCk7XHJcbiAgICB0aGlzLmF1dGhvcml6YXRpb25TZXJ2aWNlLmxvZ2luKHtoZWFkZXJzIDoge1xyXG4gICAgICdYLVBST1hZLUF1dGhvcml6YXRpb24nIDogJ0Jhc2ljICcrIGF1dGhEYXRhLFxyXG4gICB9fSkudGhlbigoKT0+e1xyXG4gICAgdGhpcy5hdXRob3JpemF0aW9uU2VydmljZS5jb29raWUgPSBidG9hKHRoaXMuYXV0aG9yaXphdGlvblNlcnZpY2UuY29va2llKTtcclxuICAgfSk7XHJcbiAgfVxyXG4gIHNpZ25PdXQoKXtcclxuICAgIHRoaXMuYXV0aG9yaXphdGlvblNlcnZpY2UubG9nb3V0KCk7XHJcbiAgfSBcclxufVxyXG5cclxuQXV0aG9yaXphdGlvbkNvbnRyb2xsZXIuJGluamVjdCA9IFsnd2ZsQXV0aG9yaXphdGlvbiddO1xyXG5cclxuLy8gRXhhbXBsZSBgd2ZsQXV0aG9yaXphdGlvbmAgY29tcG9uZW50LCBhbG9uZyB3aXRoIGl0cyBhc3NvY2lhdGVkIGNvbnRyb2xsZXIgYW5kIHRlbXBsYXRlXHJcbmFuZ3VsYXIuXHJcbm1vZHVsZSgnd2ZsQXV0aG9yaXphdGlvbicpLlxyXG5jb21wb25lbnQoJ3dmbEF1dGhvcml6YXRpb25Db21wb25lbnQnLCB7XHJcbiAgY29udHJvbGxlcjogQXV0aG9yaXphdGlvbkNvbnRyb2xsZXIsXHJcbiAgdGVtcGxhdGU6IGBcclxuICA8ZGl2IGNsYXNzPVwibmF2YmFyLWZvcm0gbmF2YmFyLXJpZ2h0XCI+XHJcbiAgPGZvcm0gbmctc3VibWl0PVwiJGN0cmwuc2lnbkluKClcIiBuZy1pZj1cIiEkY3RybC5hdXRob3JpemF0aW9uRGF0YS5pc0F1dGhvcml6ZWRcIj5cclxuICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPlxyXG4gIDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwidXNlcm5hbWVcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIG5nLW1vZGVsPVwiJGN0cmwudXNlcm5hbWVcIiByZXF1aXJlZD1cIlwiPlxyXG4gIDwvZGl2PlxyXG4gIDxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+XHJcbiAgPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIG5nLW1vZGVsPVwiJGN0cmwucGFzc3dvcmRcIiByZXF1aXJlZD1cIlwiPlxyXG4gIDwvZGl2PlxyXG4gIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCI+U2lnbiBpbjwvYnV0dG9uPlxyXG4gIDwvZm9ybT5cclxuICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIG5nLWNsaWNrPVwiJGN0cmwuc2lnbk91dCgpXCIgbmctaWY9XCIkY3RybC5hdXRob3JpemF0aW9uRGF0YS5pc0F1dGhvcml6ZWRcIj5TaWduIG91dDwvYnV0dG9uPlxyXG4gIDwvZGl2PlxyXG4gIGAsXHJcbn0pO1xyXG59KSh3aW5kb3csIHdpbmRvdy5hbmd1bGFyKTsiXX0=
