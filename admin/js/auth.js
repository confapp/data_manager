app.factory('AuthenticationService', AuthenticationService);

AuthenticationService.$inject=['$q', '$rootScope', '$cookies', '$firebaseAuth'];
function AuthenticationService($q, $rootScope, $cookies, $firebaseAuth) {
	var service = {
		login: login,
		isLoggedIn: isLoggedIn,
		logout: logout,
		getUserInformation: getUserInformation,
		getAuthInformation: getAuthInformation
	};

	function logout() {
		var auth = $firebaseAuth(ref);
		auth.$unauth();
		clearAuthData();
	}

	function login(email, password) {
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
	}

	function getUserInformation() {
		return $rootScope.currentUserInfo || $cookies.getObject('currentUserInfo');
	}

	function getAuthInformation() {
		return $rootScope.currentAuthData || $cookies.getObject('currentAuthData');
	}

	function isLoggedIn() {
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

	return service;
}