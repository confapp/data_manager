app.controller('ConferenceModalController', ConferenceModalController);

ConferenceModalController.$inject = ['$scope',  '$firebaseArray', '$q', 'conference', 'conference_uid', 'UserManagementService', '$uibModalInstance', '$firebaseObject', 'APIServices', 'DownloadService'];

function ConferenceModalController($scope, $firebaseArray, $q, conference, conference_uid, UserManagementService, $uibModalInstance, $firebaseObject, APIServices, DownloadService) {
	var ref = APIServices.getFirebaseRef(),
		conferencesRef = APIServices.getConferencesRef();

	var authRef = APIServices.getAuthRef();
	authRef.onAuthStateChanged(function(user) {
		var adminsRef = conferencesRef.child(conference_uid).child('admins');

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
		//$scope.checkboxModel.$bindTo($scope, 'adminUsers');
	});

	$scope.updateConferenceUser = function(user) {
		var confUserRef = conferencesRef.child(conference.uid).child('admins').child(user.uid);
		var userConfRef = ref.child('admin_users').child(user.uid).child('conferences').child(conference.uid);

		if($scope.adminUsers[user.uid]) {
			confUserRef.set(true);
			userConfRef.set(true);
		} else {
			confUserRef.remove();
			userConfRef.remove();
		}
	};

	$scope.deleteConference = function() {
		return $q(function(resolve, reject) {
			ref.child('conferences').child(conference_uid).remove(function(err) {
				if(err) { reject(err); }
				else { resolve(); }
			});
		}).then(function() {
			return $q(function(resolve, reject) {
				ref.child('common_apps').child('main').child(conference_uid).remove(function(err) {
					if(err) { reject(err); }
					else { resolve(); }
				});
			});
		}).then(function() {
			return $q(function(resolve, reject) {
				ref.child('deployed_databases').child(conference_uid).remove(function(err) {
					if(err) { reject(err); }
					else { resolve(); }
				});
			});
		}).then(function() {
			$uibModalInstance.dismiss('cancel');
		}).catch(function(err) {
			console.error(err);
		});
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
			alert('You did not type "' + desiredResponse + '" so the conference was NOT deleted. Be sure you remember the period at the end.');
		}
	};
	$scope.getConferenceURL = function(conference) {
		if(window.location.host === 'localhost') {
			return 'http://localhost/~soney/admin_confapp_com?conference='+conference_uid;
		} else {
			return 'http://admin.conf-app.com?conference='+conference_uid;
		}
	};

	$scope.downloadConferenceDatabase = function(conference) {
		DownloadService.downloadDatabaseZip(conference.uid);
	};
}