
config.$inject = ['$routeProvider','$locationProvider'];
function config($routeProvider, $locationProvider) {
	$routeProvider.when('/', {
		controller: 'HomeController',
		templateUrl: 'confapp_admin_home/admin.view.html',
		controllerAs: 'vm'
	}).when('/login', {
		controller: 'LoginController',
		templateUrl: 'login/login.view.html',
		controllerAs: 'vm'
	}).when('/choose_conference', {
		controller: 'ChooseConferenceController',
		templateUrl: 'choose_conference/choose_conference.view.html',
		controllerAs: 'vm'
	}).otherwise({ redirectTo: '/login' });
}

run.$inject = ['$rootScope', '$location', 'AuthenticationService', 'editableOptions'];
function run($rootScope, $location, AuthenticationService, editableOptions) {
	editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
	$rootScope.$on('$locationChangeStart', function (event, next, current) {
	// redirect to login page if not logged in and trying to access a restricted page
		var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;

		if(restrictedPage) {
			AuthenticationService.isLoggedIn().then(function(userInfo) {
				var conference = $location.search().conference;

				if(conference) {
					$location.path('/');
				} else {
					$location.path('/choose_conference');
				}
			}, function(err) {
				$location.path('/login');
			});
		}
	});
}

var app = angular.module('app', ['ngRoute', 'ngCookies', 'xeditable', 'firebase', 'ui.bootstrap', 'ngFileUpload', 'angularMoment'])
					.config(config)
					.run(run);

var ref = new Firebase('https://confapp-data-sync.firebaseio.com'),
	tz_api_key = "AIzaSyCh4eAVGTJRsv-dDKatS2acYi-P1N8tjpU",
	geocode_api_key = "AIzaSyCDbBLHTSIKqafSpdM-tp_cUYEPtyJ68kM";
