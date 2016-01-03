app.controller('ManageAccountController', ManageAccountController);

ManageAccountController.$inject = ['$scope', '$q', 'APIServices', 'UserManagementService', 'AuthenticationService'];

function ManageAccountController($scope, $q, APIServices, UserManagementService, AuthenticationService) {
	var ref = APIServices.getFirebaseRef();

	$scope.changeEmail = function(newEmail, newEmailRepeat, password) {
		var authInfo = AuthenticationService.getAuthInformation();
		$scope.changeEmailError = $scope.changeEmailInfo = false;
		if(newEmail === newEmailRepeat) {
			return UserManagementService.changeEmail($scope.user_email, newEmail, password, authInfo.uid)
						.then(function(newEmail) {
							$scope.changeEmailInfo = 'Address change request was successfully submitted. Please check your "' + newEmail + '" inbox for a confirmation request';
						}, function(error) {
							switch (error.code) {
								case "INVALID_PASSWORD":
									$scope.changeEmailError = "The specified user account password is incorrect.";
									break;
								case "INVALID_USER":
									$scope.changeEmailError = "The specified user account does not exist.";
									break;
								default:
									$scope.changeEmailError = "Error changing address: " + error;
							}
						});
		} else {
			$scope.changeEmailError = '"To" e-mail addresses did not match.'
		}
	};

	$scope.changePassword = function(fromPassword, newPassword, newPasswordRepeat) {
		$scope.changePasswordError = $scope.changePasswordInfo = false;
		if(newPassword === newPasswordRepeat) {
			return UserManagementService.changePassword($scope.user_email, fromPassword, newPassword)
						.then(function() {
							$scope.changePasswordInfo = 'Password successfully changed.';
						}, function(error) {
							switch (error.code) {
								case "INVALID_PASSWORD":
									$scope.changePasswordError = "The specified user account password is incorrect.";
									break;
								case "INVALID_USER":
									$scope.changePasswordError = "The specified user account does not exist.";
									break;
								default:
									$scope.changePasswordError ="Error changing password: " + error;
							}
						});
		} else {
			$scope.changePasswordError = '"To" passwords did not match.'
		}
	};

	$scope.requestRemoveUser = function(password) {
		$scope.removeUserError = false;
		if(password) {
			var desiredResponse = 'Yes, I want to delete my account.';
			var promptResponse = prompt('Are you sure you want to permanently delete your account? This cannot be undone.\n\nTo delete your account, please type "'+desiredResponse+'"');
			if(promptResponse === desiredResponse) {
				var authInfo = AuthenticationService.getAuthInformation();
				UserManagementService.removeUser($scope.user_email, password, authInfo.uid).then(function() {
					$scope.logout();
				}, function(error) {
					switch (error.code) {
						case "INVALID_PASSWORD":
							$scope.removeUserError = "The specified user account password is incorrect.";
							break;
						case "INVALID_USER":
							$scope.removeUserError = "The specified user account does not exist.";
							break;
						default:
							$scope.removeUserError = "Error removing user: " + error;
					}
				});
			} else {
				alert('You did not type "' + desiredResponse + '" so your account was NOT deleted. Be sure you remember the period at the end.');
			}
		} else {
			$scope.remove_pass = '';
			$scope.requestedRemoveUser = true;
			setTimeout(function() {
				angular.element('#remove_user_pass').focus();
			}, 20);
		}
	};

	$scope.resetPassword = function() {
		$scope.resetPasswordError = $scope.resetPasswordInfo = false;
		UserManagementService.resetPassword($scope.user_email)
								.then(function() {
									$scope.resetPasswordInfo = 'Password reset request submitted. Please check your "' + $scope.user_email + '" inbox for a confirmation request';
								}, function(errorMessage) {
									$scope.resetPasswordError = errorMessage;
								});
	};

	$scope.cancelRemoveUserRequest = function() {
		$scope.requestedRemoveUser = false;
		$scope.remove_pass = '';
	};
}