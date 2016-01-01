app.controller('UserModalController', UserModalController);

UserModalController.$inject = ['$scope',  '$firebaseArray', '$q', 'user', 'UserManagementService', '$uibModalInstance', '$firebaseObject'];

function UserModalController($scope, $firebaseArray, $q, user, UserManagementService, $uibModalInstance, $firebaseObject) {
	var conferencesRef = ref.child('conferences');
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

	$scope.updateUserConference = function(conference) {
		var userConfRef = ref.child('conferences').child(conference.uid).child('admins').child(user.uid);
		if($scope.userConferences[conference.uid]) {
			userConfRef.set(true);
		} else {
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