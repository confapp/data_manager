app.factory('AuthenticationService', AuthenticationService);

AuthenticationService.$inject=['$q', '$rootScope', '$cookies', 'APIServices'];
function AuthenticationService($q, $rootScope, $cookies, APIServices) {
	var service = {
		login: function(email, password) {
			var auth = APIServices.getAuthRef();
			return $q(function(resolve, reject) {
				auth.signInWithEmailAndPassword(email, password).then(resolve, reject);
				/*
			}).then(function(authData) {
				var userInfo = {
					email: email
				};

				//setAuthData(authData, userInfo);
				return userInfo;
				*/
			});
		},
		isLoggedIn: function() {
			var auth = APIServices.getAuthRef();

			var deferred = $q.defer();
			deferred.resolve(auth.currentUser);
			return deferred.promise;
			/*
			var authInfo = getAuthInformation();
			if(authInfo) {
				var auth = APIServices.getAuthRef();

				return auth.signInWithCustomToken(authInfo.token).then(function(authData) {
					var storedUserInfo = getUserInformation();
					setAuthData(authData, storedUserInfo);
					return storedUserInfo;
				}, function(error) {
					console.error(error.message);
					return false;
				});
			} else {
				var deferred = $q.defer();
				deferred.resolve(false);
				return deferred.promise;
			}
			*/
		},
		logout: function() {
			var auth = APIServices.getAuthRef();
			//clearAuthData();
			return $q(function(resolve, reject) {
				auth.signOut().then(resolve, reject);
			});
		},
		isRootUser: function() {
			return $q(function(resolve, reject) {
				var auth = APIServices.getAuthRef();
				var ref = APIServices.getFirebaseRef();

				//var userInformation = getUserInformation(),
					//authInformation = getAuthInformation();
				try {
					if(auth.currentUser) {
						ref.child('root_admins').child(auth.currentUser.uid).once('value', function(da) {
							if(da.val()) {
								resolve(true);
							} else {
								resolve(false);
							}
						}, function() {
							resolve(false);
						});
					} else {
						resolve(false);
					}
				} catch(e) {
					resolve(false);
				}
			});
		},
		//getUserInformation: getUserInformation,
		//getAuthInformation: getAuthInformation,
		//cacheChangedEmail: cacheChangedEmail
	};
	/*

	function getUserInformation() {
		return $rootScope.currentUserInfo || $cookies.getObject('currentUserInfo');
	}

	function getAuthInformation() {
		return $rootScope.currentAuthData || $cookies.getObject('currentAuthData');
	}

	function setAuthData(authData, userInfo) {
		return authData.getToken().then(function(token) {
			$rootScope.currentAuthData = {
				email: authData.email,
				uid: authData.uid,
				token: token
			};
			$rootScope.currentUserInfo = userInfo;

			$cookies.putObject('currentAuthData', $rootScope.currentAuthData);
			$cookies.putObject('currentUserInfo', $rootScope.currentUserInfo);
		})
	}

	function clearAuthData() {
		$rootScope.currentAuthData = false;
		$rootScope.currentUserInfo = false;
		$cookies.remove('currentAuthData');
		$cookies.remove('currentUserInfo');
	}

	function cacheChangedEmail(toEmail) {
		$rootScope.currentUserInfo.email = toEmail;
		$cookies.putObject('currentUserInfo', $rootScope.currentUserInfo);
	}
	*/

	return service;
}