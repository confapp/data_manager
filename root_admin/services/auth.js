app.factory('AuthenticationService', AuthenticationService);

AuthenticationService.$inject=['$q', '$rootScope', '$cookies', '$firebaseAuth'];
function AuthenticationService($q, $rootScope, $cookies, $firebaseAuth) {
	var service = {
		login: login,
		isLoggedIn: isLoggedIn,
		logout: logout
	};

	function logout() {
		ref.unauth();
		clearAuthData();
	}

	function login(email, password) {
		return $q(function(resolve, reject) {
			ref.authWithPassword({
				email    : email,
				password : password
			}, function(error, authData) {
				if (error) {
					reject(error);
				} else {
					var userInfo = {
						email: email
					};

					setAuthData(authData, userInfo);
					resolve(userInfo);
				}
			});
		});
	}

	function isLoggedIn() {
		return $q(function(resolve, reject) {
			var authData = $rootScope.currentAuthData || $cookies.getObject('currentAuthData');
			var userInfo = $rootScope.currentUserInfo || $cookies.getObject('currentUserInfo');
			if(authData) {
				ref.authWithCustomToken(authData.token, function(error, authData) {
					if (error) {
						reject(error);
					} else {
						setAuthData(authData, userInfo);
						resolve(userInfo);
					}
				});
			} else {
				reject();
			}
		});
		return false;
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