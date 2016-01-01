app.controller('ChooseConferenceController', ChooseConferenceController);

ChooseConferenceController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', '$firebaseObject'];
function ChooseConferenceController($scope, $location, $rootScope, AuthenticationService, $firebaseObject) {
	var userInformation = AuthenticationService.getUserInformation();
	$scope.user_email = userInformation ? userInformation.email : false;

	var conferencesRef = ref.child('conferences');
	$scope.conferences = $firebaseObject(conferencesRef);

	$scope.logout = function() {
		AuthenticationService.logout();
		$location.path('/login');
	};
	$scope.openConference = function(conference, conference_uid) {
		$location.search({
			conference: conference_uid
		});
	};
}