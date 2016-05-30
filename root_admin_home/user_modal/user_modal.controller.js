app.controller('UserModalController', UserModalController);

UserModalController.$inject = ['$scope',  '$firebaseArray', '$q', 'user', 'UserManagementService', '$uibModalInstance', '$firebaseObject', 'APIServices'];

function UserModalController($scope, $firebaseArray, $q, user, UserManagementService, $uibModalInstance, $firebaseObject, APIServices) {
	var ref = APIServices.getFirebaseRef();
	var conferencesRef = APIServices.getConferencesRef();

	var authRef = APIServices.getAuthRef();
	authRef.onAuthStateChanged(function(user) {
		$scope.user = user;

		$scope.userConferences = {};
		$scope.allConferences = $firebaseArray(conferencesRef);

		conferencesRef.once('value', function(snapshot) {
			var conferences = snapshot.val();
			if(!conferences) { conferences = {}; }
			angular.forEach(conferences, function(conference, conference_uid) {
				var admins = conference.admins || {};

				if(admins[user.uid] === true) {
					$scope.userConferences[conference_uid] = true;
				}
			});
		});
	});

	$scope.updateUserConference = function(conference) {
		var confUserRef = conferencesRef.child(conference.uid).child('admins').child(user.uid);
		var userConfRef = ref.child('admin_users').child(user.uid).child('conferences').child(conference.uid);
		if($scope.userConferences[conference.uid]) {
			confUserRef.set(true);
			userConfRef.set(true);
		} else {
			confUserRef.remove();
			userConfRef.remove();
		}
	};

	$scope.resetPassword = function(email) {
		return UserManagementService.resetPassword(email);
	};
	$scope.dismiss = function() {
		$uibModalInstance.dismiss('cancel');
	};
}