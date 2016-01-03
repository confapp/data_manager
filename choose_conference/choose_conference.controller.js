app.controller('ChooseConferenceController', ChooseConferenceController);

ChooseConferenceController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', '$firebaseObject', 'APIServices', '$filter'];
function ChooseConferenceController($scope, $location, $rootScope, AuthenticationService, $firebaseObject, APIServices, $filter) {
	var ref = APIServices.getFirebaseRef();
	ref.onAuth(function() {
		var authInfo = AuthenticationService.getAuthInformation();
		if(authInfo) {
			var myConferencesRef = ref.child('admin_users').child(authInfo.uid).child('conferences');
			AuthenticationService.isRootUser().then(function(isRoot) {
				var conferencesRef = APIServices.getConferencesRef();

				if(isRoot) {
					$scope.myConferences = $firebaseObject(conferencesRef);
				} else {
					var authInfo = AuthenticationService.getAuthInformation();
					var conferences = $firebaseObject(ref.child('admin_users').child(authInfo.uid).child('conferences'));

					$scope.myConferences = {};
					conferences.$watch(function() {
						$scope.myConferences = {};
						conferences.$loaded().then(function(value) {
							angular.forEach(value, function(conf, key) {
								$scope.myConferences[key] = $firebaseObject(conferencesRef.child(key));
							});
						});
					});
				}
			});
		}
		/*

		var conferencesRef = APIServices.getConferencesRef();
		var conferences = $firebaseObject(conferencesRef);

		$scope.myConferences = {};
		conferences.$watch(function() {
			$scope.myConferences = {};
			conferences.$loaded().then(function(value) {
				angular.forEach(value, function(conf, key) {
					$scope.myConferences[key] = conf;
					console.log(conf);
				});
			});
		});
		*/
	});

	$scope.openConference = function(conference, conference_uid) {
		$location.search({
			conference: conference_uid
		});
	};
}