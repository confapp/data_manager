app.controller('AdminController', AdminController);

AdminController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', 'APIServices', '$firebaseObject', 'DatabaseCreator'];
function AdminController($scope, $location, $rootScope, AuthenticationService, APIServices, $firebaseObject, DatabaseCreator) {
	var ref = APIServices.getAuthRef();
	$scope.isRootUser = false;

	ref.onAuthStateChanged(function(adata) {
		if(adata) {
			$scope.user_email = adata.email;
			AuthenticationService.isRootUser().then(function(isRoot) {
				 $scope.isRootUser = isRoot;
			});
		} else {
			$scope.user_email = false;
		}
	});

	$scope.logout = function() {
		$scope.user_email = false;
		AuthenticationService.logout();
		$location.path('/login');
	};

	$scope.manageAccount = function() {
		$location.path('/manage_account');
	};

	$scope.chooseConference = function() {
		$location.search({
			conference: undefined
		}).path('/choose_conference');
	};
	$scope.manageAllAccounts = function() {
		$location.path('root_admin');
	};
}