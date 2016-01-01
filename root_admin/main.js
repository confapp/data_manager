
config.$inject = ['$routeProvider','$locationProvider'];
function config($routeProvider, $locationProvider) {
	$routeProvider.when('/', {
		controller: 'RootAdminController',
		templateUrl: 'root_admin_home/root_admin_home.view.html',
		controllerAs: 'vm'
	}).when('/login', {
		controller: 'LoginController',
		templateUrl: 'login/login.view.html',
		controllerAs: 'vm'
	}).otherwise({ redirectTo: '/login' });
}

run.$inject = ['$rootScope', '$location', 'AuthenticationService'];
function run($rootScope, $location, AuthenticationService) {
	$rootScope.$on('$locationChangeStart', function (event, next, current) {
	// redirect to login page if not logged in and trying to access a restricted page
		var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
		if(restrictedPage) {
			AuthenticationService.isLoggedIn().then(function(userInfo) {
			}, function(err) {
				$location.path('/login');
			});
		}
	});
}

var app = angular.module('app', ['ngRoute', 'ngCookies', 'firebase', 'ui.bootstrap'])
					.config(config)
					.run(run);

var ref = new Firebase('https://confapp-data-sync.firebaseio.com');