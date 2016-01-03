app.factory('UserManagementService', UserManagementService);

UserManagementService.$inject=['$q', '$rootScope', '$cookies', '$firebaseArray', '$firebaseAuth', 'APIServices', 'AuthenticationService'];
function UserManagementService($q, $rootScope, $cookies, $firebaseArray, $firebaseAuth, APIServices, AuthenticationService) {
	var ref = APIServices.getFirebaseRef();
	var service = {
		createUser: createUser,
		resetPassword: resetPassword,
		changeEmail: changeEmail,
		removeUser: removeUser,
		changePassword: changePassword
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
			var uid = userData.uid;
			var toSaveUserInfo = {
				uid: uid,
				email: email,
				conferences: {}
			};
			return new $q(function(resolve, reject) {
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
	function changeEmail(fromEmail, toEmail, password, uid) {
		return $q(function(resolve, reject) {
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
		var auth = $firebaseAuth(ref);
		return auth.$authWithPassword({
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