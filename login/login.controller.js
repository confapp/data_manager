app.controller('LoginController', LoginController);

LoginController.$inject = ['$scope', '$location', 'AuthenticationService', 'UserManagementService'];

function LoginController($scope, $location, AuthenticationService, UserManagementService) {
	$scope.login = function() {
		$scope.loginInfo = false;
		$scope.loginError = false;
		$scope.dataLoading = true;
		AuthenticationService.login($scope.username, $scope.password)
								.then(function(authData) {
									var conference = $location.search().conference;

									if(conference) {
										$location.path('/');
									} else {
										$location.path('/choose_conference')
									}
								}, function(error) {
									if(error && error.code === 'auth/wrong-password') {
										$scope.loginError = 'Incorrect password';
									} else if(error && error.code === 'auth/user-not-found') {
								        $scope.loginError = "The specified user account does not exist.";
									} else {
										$scope.loginError = error.message;
									}
								}).then(function() {
									$scope.dataLoading = false;
								});
	};

	$scope.resetPassword = function(email) {
		if(!email) {
			form.username.$dirty = true;
		}
		$scope.loginError = false;
		UserManagementService.resetPassword(email).then(function() {
			$scope.loginInfo = 'Sent a password reset request for ' + email + '. Please check your inbox.'
		}, function(error) {
		    switch (error.code) {
		      case "auth/user-not-found":
		        $scope.loginError = "The specified user account does not exist.";
		        break;
		      default:
		        $scope.loginError = "Error resetting password: " + error;
		    }
		})
	};
}