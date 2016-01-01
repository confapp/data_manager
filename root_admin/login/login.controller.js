app.controller('LoginController', LoginController);

LoginController.$inject = ['$scope', '$location', 'AuthenticationService'];

function LoginController($scope, $location, AuthenticationService) {
	$scope.login_error = false;
	var vm = this;
	$scope.login = function() {
		vm.dataLoading = true;
		$scope.login_error = false;
		AuthenticationService.login($scope.username, $scope.password)
								.then(function(authData) {
									$location.path('/');
									$scope.login_error = false;
								}, function(error) {
									$scope.login_error = error.toString();
								}).then(function() {
									vm.dataLoading = false;
								});
	}
}