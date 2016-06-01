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
	function changeEmail(fromEmail, toEmail, uid) {
		return $q(function(resolve, reject) {
			var authRef = APIServices.getAuthRef();
			if(authRef.currentUser.email === fromEmail) {
				authRef.currentUser.updateEmail(toEmail).then(resolve, reject);
			}
		}).then(function() {
			return new $q(function(resolve, reject) {
				var ref = APIServices.getFirebaseRef();
				ref.child('admin_users').child(uid).update({
					email: toEmail
				},
					function(err) {
						if(err) {
							reject(err);
						} else {
							//AuthenticationService.cacheChangedEmail(toEmail);
							resolve(toEmail);
						}
					}
				);
			});
		});
	};

	function removeUser(email, password, uid) {
		return new $q(function(resolve, reject) {
			var ref = APIServices.getFirebaseRef();
			ref.child('admin_users').child(uid).remove(
				function(err) {
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				}
			);
		}).then(function() {
			return $q(function(resolve, reject) {
				var authRef = APIServices.getAuthRef();
				authRef.currentUser.delete().then(resolve, reject);
			});
		});
	};

	function changePassword(email, new_password) {
		return $q(function(resolve, reject) {
			var authRef = APIServices.getAuthRef();
			if(authRef.currentUser) {
				authRef.currentUser.updatePassword(new_password).then(resolve, reject);
			} else {
				reject('Not logged in');
			}
		});
	}
	return service;
}