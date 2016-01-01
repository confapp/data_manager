app.controller('ConferenceModalController', ConferenceModalController);

ConferenceModalController.$inject = ['$scope',  '$firebaseArray', '$q', 'conference', 'conference_uid', 'UserManagementService', '$uibModalInstance', '$firebaseObject'];

function ConferenceModalController($scope, $firebaseArray, $q, conference, conference_uid, UserManagementService, $uibModalInstance, $firebaseObject) {
	var adminsRef = ref.child('conferences').child(conference_uid).child('admins');

	adminsRef.once('value', function(snapshot) {
		var adminUsers = snapshot.val();
		if(!adminUsers) {
			adminUsers = {};
		}

		$scope.adminUsers = adminUsers;
	});

	$scope.checkboxModel = $firebaseObject(adminsRef);

	$scope.conference = conference;
	$scope.allUsers = $firebaseArray(ref.child('admin_users'));
	$scope.checkboxModel.$bindTo($scope, 'adminUsers');
	$scope.deleteConference = function() {
		ref.child('conferences').child(conference_uid).remove();
		$uibModalInstance.dismiss('cancel');
	};
	$scope.dismiss = function() {
		$uibModalInstance.dismiss('cancel');
	};
	$scope.requestDeleteConference = function() {
		var desiredResponse = 'Yes, I want to delete conference ' + conference_uid+ '.';
		var promptResponse = prompt('Are you sure you want to permanently delete this conference? This cannot be undone.\n\nTo delete this conference, please type "'+desiredResponse+'"');
		if(promptResponse === desiredResponse) {
			$scope.deleteConference();
		} else {
			alert ('You did not type "' + desiredResponse + '" so the conference was NOT deleted.')
		}
	};
	$scope.getConferenceURL = function(conference) {
		if(window.location.host === 'localhost') {
			return 'http://localhost/~soney/admin_confapp_com?conference='+conference_uid;
		} else {
			return 'http://admin.conf-app.com?conference='+conference_uid;
		}
	};
}