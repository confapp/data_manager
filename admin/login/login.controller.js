app.controller('LoginController', LoginController);

LoginController.$inject = ['$scope', '$location', 'AuthenticationService'];

function LoginController($scope, $location, AuthenticationService) {
	var vm = this;
	$scope.login = function() {
		vm.dataLoading = true;
		AuthenticationService.login($scope.username, $scope.password)
								.then(function(authData) {
									var conference = $location.search().conference;

									if(conference) {
										$location.path('/');
									} else {
										$location.path('/choose_conference')
									}
								}, function(error) {
									console.error(error);
								}).then(function() {
									vm.dataLoading = false;
								});
	}
}