app.factory('UserManagementService', UserManagementService);

UserManagementService.$inject=['$q', '$rootScope', '$cookies', '$firebaseArray'];
function UserManagementService($q, $rootScope, $cookies, $firebaseArray) {
	var service = {
		createUser: createUser,
		resetPassword: resetPassword
	};
	function createUser(email, password) {
		return $q(function(resolve, reject) {
			ref.createUser({
				email: email,
				password: password
			}, function(error, userData) {
				if (error) {
					reject(error);
				} else {
					resolve(userData);
				}
			});
		}).then(function(userData) {
			var toSaveUserInfo = {
				uid: userData.uid,
				email: email
			};
			return new $q(function(resolve, reject) {
				ref.child('admin_users').push(toSaveUserInfo,
					function(err) {
						if(err) {
							reject(err);
						} else {
							resolve(toSaveUserInfo);
						}
					}
				);
			});
		});
	}

	function resetPassword(email) {
		return $q(function(resolve, reject) {
			ref.resetPassword({
				email: email
			}, function(error) {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}
	return service;
}