app.factory('AuthenticationService', AuthenticationService);

AuthenticationService.$inject=['$q', '$rootScope', '$cookies', '$firebaseAuth', 'APIServices'];
function AuthenticationService($q, $rootScope, $cookies, $firebaseAuth, APIServices) {
	var ref = APIServices.getFirebaseRef();
	var service = {
		login: function(email, password) {
			var auth = $firebaseAuth(ref);

			return auth.$authWithPassword({
				email    : email,
				password : password
			}).then(function(authData) {
				var userInfo = {
					email: email
				};

				setAuthData(authData, userInfo);
				return userInfo;
			});
		},
		isLoggedIn: function() {
			var authInfo = getAuthInformation();
			if(authInfo) {
				var auth = $firebaseAuth(ref);

				return auth.$authWithCustomToken(authInfo.token).then(function(authData) {
					var storedUserInfo = getUserInformation();
					setAuthData(authData, storedUserInfo);
					return storedUserInfo;
				});
			} else {
				var deferred = $q.defer();
				deferred.resolve(false);
				return deferred.promise;
			}
		},
		logout: function() {
			var auth = $firebaseAuth(ref);
			clearAuthData();
			auth.$unauth();
		},
		isRootUser: function() {
			return $q(function(resolve, reject) {
				var userInformation = getUserInformation(),
					authInformation = getAuthInformation();
				try {
					if(authInformation) {
						ref.child('root_admins').child(authInformation.uid).once('value', function(da) {
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
		getUserInformation: getUserInformation,
		getAuthInformation: getAuthInformation,
		cacheChangedEmail: cacheChangedEmail
	};

	function getUserInformation() {
		return $rootScope.currentUserInfo || $cookies.getObject('currentUserInfo');
	}

	function getAuthInformation() {
		return $rootScope.currentAuthData || $cookies.getObject('currentAuthData');
	}

	function setAuthData(authData, userInfo) {
		$rootScope.currentAuthData = authData;
		$rootScope.currentUserInfo = userInfo;
		$cookies.putObject('currentAuthData', authData);
		$cookies.putObject('currentUserInfo', userInfo);
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

	return service;
}