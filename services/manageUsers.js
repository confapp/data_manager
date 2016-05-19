app.factory('UserManagementService', UserManagementService);

UserManagementService.$inject=['$q', '$rootScope', '$cookies', '$firebaseArray', '$firebaseAuth', 'APIServices', 'AuthenticationService'];
function UserManagementService($q, $rootScope, $cookies, $firebaseArray, $firebaseAuth, APIServices, AuthenticationService) {
	var service = {
		createUser: createUser,
		resetPassword: resetPassword,
		changeEmail: changeEmail,
		removeUser: removeUser,
		changePassword: changePassword
	};
	function createUser(email, password) {
		var authRef = APIServices.getAuthRef();

		return $q(function(resolve, reject) {
			authRef.createUserWithEmailAndPassword(email, password).then(resolve, reject);
		}).then(function(userData) {
			var uid = userData.uid;
			var toSaveUserInfo = {
				uid: uid,
				email: email,
				conferences: {}
			};
			return new $q(function(resolve, reject) {
				var ref = APIServices.getFirebaseRef();
				ref.child('admin_users').child(uid).set(toSaveUserInfo,
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
		var authRef = APIServices.getAuthRef();

		return $q(function(resolve, reject) {
			authRef.sendPasswordResetEmail(email).then(resolve, reject);
		});
	}
	function changeEmail(fromEmail, toEmail, password, uid) {
		return $q(function(resolve, reject) {
			var authRef = APIServices.getAuthRef();
			ref.changeEmail({
				oldEmail : fromEmail,
				newEmail : toEmail,
				password : password
			}, function(error) {
				if(error) {
					reject(error);
				} else {
					resolve(toEmail);
				}
			})
		}).then(function() {
			return new $q(function(resolve, reject) {
				ref.child('admin_users').child(uid).update({
					email: toEmail
				},
					function(err) {
						if(err) {
							reject(err);
						} else {
							AuthenticationService.cacheChangedEmail(toEmail);
							resolve(toEmail);
						}
					}
				);
			});
		});
	};

	function removeUser(email, password, uid) {
		var authRef = APIServices.getAuthRef();
		return authRef.$authWithPassword({
			email    : email,
			password : password
		}).then(function() {
			return new $q(function(resolve, reject) {
				ref.child('admin_users').child(uid).remove(
					function(err) {
						if(err) {
							reject(err);
						} else {
							resolve();
						}
					}
				);
			});
		}).then(function() {
			return $q(function(resolve, reject) {
				ref.removeUser({
					email : email,
					password : password
				}, function(error) {
					if(error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});
		});
	};

	function changePassword(email, old_password, new_password) {
		return $q(function(resolve, reject) {
			var authRef = APIServices.getAuthRef();
			ref.changePassword({
				email: email,
				oldPassword: old_password,
				newPassword: new_password
			}, function(error) {
				if(error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}
	return service;
}