app.controller('RootAdminController', RootAdminController);

RootAdminController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', 'UserManagementService', '$firebaseArray', '$firebaseObject', '$q', '$uibModal', 'APIServices'];

function RootAdminController($scope, $location, $rootScope, AuthenticationService, UserManagementService, $firebaseArray, $firebaseObject, $q, $uibModal, APIServices) {
	var ref = APIServices.getFirebaseRef();
	ref.onAuth(function() {
		$scope.users = $firebaseArray(ref.child('admin_users'));
		$scope.conferences = $firebaseObject(ref.child('conferences'));
	});

	$scope.userModal = function(user) {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'root_admin_home/user_modal/user_modal.view.html',
			controller: 'UserModalController',
			resolve: {
				user: user
			}
		});
	};
	$scope.conferenceModal = function(conference, conference_uid) {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'root_admin_home/conference_modal/conference_modal.view.html',
			controller: 'ConferenceModalController',
			resolve: {
				conference: conference,
				conference_uid: function() {
					return conference_uid;
				}
			}
		});
	};
	$scope.createUser = function(email, pass) {
		return UserManagementService.createUser(email, pass)
									.then(function(userInfo) {
										$scope.create_user_error = false;
										$scope.new_user.email = '';
										$scope.new_user.pass = '';
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
				if(conference_uid.match(/[a-zA-Z0-9_\-]+/) && APIServices.sanitizeKey(conference_uid)===conference_uid) {
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
		}).then(function(data) {
			return $q(function(resolve, reject) {
				ref.child('common_apps').child('main').child(conference_uid).transaction(function(currentData) {
					if(currentData) {
						reject('"'+conference_uid+'" is not unique');
					} else {
						return {
							conference_id: conference_uid,
							icon_uri: data.primaryIcon.uri,
							name: data.name,
							start_day: 0,
							utc_offset: 0
						};
					}
				}, function(err, committed, dataSnapshot) {
					if(err) {
						reject(err);
					} else {
						resolve(dataSnapshot.val());
					}
				});
			});
		}).then(function() {
			return $q(function(resolve, reject) {
				ref.child('deployed_databases').child('default').once('value', function(dataSnapshot) {
					resolve(dataSnapshot.val());
				});
			});
		}).then(function(defaultDeployedDatabase) {
			return $q(function(resolve, reject) {
				ref.child('deployed_databases').child(conference_uid).transaction(function(currentData) {
					if(currentData) {
						reject('"'+conference_uid+'" is not unique');
					} else {
						return defaultData;
					}
				}, function(err, committed, dataSnapshot) {
					if(err) {
						reject(err);
					} else {
						resolve(dataSnapshot.val());
					}
				});
			});
		}).then(function() {
			$scope.create_conference_error = false;
			$scope.new_conf.id = '';
			$scope.new_conf.name = '';
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
		});
	};
}