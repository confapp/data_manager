app.controller('RootAdminController', RootAdminController);

RootAdminController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', 'UserManagementService', '$firebaseArray', '$firebaseObject', '$q', '$uibModal'];

function RootAdminController($scope, $location, $rootScope, AuthenticationService, UserManagementService, $firebaseArray, $firebaseObject, $q, $uibModal) {
	$scope.users = $firebaseArray(ref.child('admin_users'));
	$scope.conferences = $firebaseObject(ref.child('conferences'));
	AuthenticationService.isLoggedIn().then(function(userInfo) {
		$scope.user_email = userInfo.email;
	});
	$scope.userModal = function(user) {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'root_admin_home/user_modal.view.html',
			controller: 'UserModalController',
			resolve: {
				user: user
			}
		});
	};
	$scope.conferenceModal = function(conference, conference_uid) {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'root_admin_home/conference_modal.view.html',
			controller: 'ConferenceModalController',
			resolve: {
				conference: conference,
				conference_uid: function() {
					return conference_uid;
				}
			}
		});
	};
	$scope.logout = function() {
		AuthenticationService.logout();
		$location.path('/login');
	};
	$scope.createUser = function(email, pass) {
		return UserManagementService.createUser(email, pass)
									.then(function(userInfo) {
										$scope.create_user_error = false;
										$scope.new_email = '';
										$scope.new_pass = '';
									}, function(errorInfo) {
										$scope.create_user_error = errorInfo.toString();
									});
	};

	$scope.createConference = function(conference_uid, conference_name) {
		return $q(function(resolve, reject) {
			ref.child('conferences').child('default').once('value', function(dataSnapshot) {
				resolve(dataSnapshot.val());
			});
		}).then(function(defaultData) {
			return $q(function(resolve, reject) {
				if(conference_uid.match(/[a-zA-Z0-9_\-]+/)) {
					ref.child('conferences').child(conference_uid).transaction(function(currentData) {
						if(currentData) {
							reject('"'+conference_uid+'" is not unique');
						} else {
							return _.extend({}, defaultData, {
								uid: conference_uid,
								name: conference_name||'',
								currentDatabaseVersion: 1,
								webBaseURL: 'http://confapp.github.io/web_guide/?conference='+conference_uid,
								admins: {}
							});
						}
					}, function(err, committed, dataSnapshot) {
						if(err) {
							reject(err);
						} else {
							resolve(dataSnapshot.val());
						}
					});
				} else {
					reject(new Error('Only characters, numbers, underscores, and dashes in a conference id'));
				}
			});
		}).then(function() {
			$scope.create_conference_error = false;
			$scope.new_conf_id = '';
			$scope.new_conf_name = '';
		}, function(err) {
			$scope.create_conference_error = err.toString();
		});
	};
	$scope.deleteConference = function(conference_uid) {
		return $q(function(resolve, reject) {
			ref.child('conferences').child(conference_uid).remove(function(err) {
				if(err) { reject(err); }
				else { resolve(); }
			});
		});
	};
}