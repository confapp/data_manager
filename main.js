config.$inject = ['$routeProvider','$locationProvider'];
function config($routeProvider, $locationProvider) {
	$routeProvider.when('/', {
		controller: 'HomeController',
		templateUrl: 'conference_admin/conference_admin.view.html',
		controllerAs: 'vm'
	}).when('/login', {
		controller: 'LoginController',
		templateUrl: 'login/login.view.html',
		controllerAs: 'vm'
	}).when('/choose_conference', {
		controller: 'ChooseConferenceController',
		templateUrl: 'choose_conference/choose_conference.view.html',
		controllerAs: 'vm'
	}).when('/manage_account', {
		controller: 'ManageAccountController',
		templateUrl: 'manage_account/manage_account.view.html',
		controllerAs: 'vm'
	}).when('/root_admin', {
		controller: 'ManageAccountController',
		templateUrl: 'root_admin_home/root_admin_home.view.html',
		controllerAs: 'vm'
	}).otherwise({ redirectTo: '/login' });
}

run.$inject = ['$rootScope', '$location', 'AuthenticationService', 'editableOptions', 'APIServices'];
function run($rootScope, $location, AuthenticationService, editableOptions, APIServices) {
	editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

	var path = $location.path();
	var authRef = APIServices.getAuthRef();

	authRef.onAuthStateChanged(function(adata) {
		if(adata) {
			if(path.indexOf('/login') >= 0) {
				$location.path('/');
			} else {
				$location.path(path);
			}
		} else {
			$location.path('/login');
		}
	});

	$rootScope.$on('$locationChangeStart', function (event, next, current) {
	// redirect to login page if not logged in and trying to access a restricted page
		//var restrictedPage = $.inArray($location.path(), ['/login']) < 0;

		//if(restrictedPage) {
		path = $location.path();

		AuthenticationService.isLoggedIn().then(function(userInfo) {
			if(userInfo) {
				if($.inArray(path, ['/manage_account', '/root_admin']) < 0) {
					var conference = $location.search().conference;
					if(conference) {
						$location.path('/');
					} else {
						$location.path('/choose_conference');
					}
				}
			} else {
				$location.path('/login');
			}
		}, function(err) {
			console.error(err);
		});

		//}
	});
}

var app = angular.module('app', ['ngRoute', 'ngCookies', 'xeditable', 'firebase', 'ui.bootstrap', 'ngFileUpload', 'angularMoment'])
					.config(config)
					.run(run);