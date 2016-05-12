app.controller('UserDataController', UserDataController);

UserDataController.$inject = ['$scope', '$q', '$uibModalInstance', 'UserData', 'conference_uid'];

function UserDataController($scope, $q, $uibModalInstance, UserData, conference_uid) {
	$scope.loading = true;
	$scope.uData = UserData.getUserData(conference_uid);
	var databasePromise = $q(function(resolve, reject) {
		confApp.loadFirebaseDatabase(conference_uid, function(db) {
			resolve(db);
		});
	});

	$scope.uData.$loaded().then(function(data) {
		var votes = {};
		_.each(data, function(val, uid) {
			_.each(val, function(data) {
				var event_id = data.event_id,
					vote = data.vote;
				if(vote && vote.value) {
					if(votes[event_id]) {
						votes[event_id]++;
					} else {
						votes[event_id] = 1;
					}
				}
			});
		});

		var votes_arr = [];
		_.each(votes, function(numVotes, eventId) {
			votes_arr.push({
				eventId: eventId,
				votes: numVotes
			})
		});
		votes_arr.sort(function(a, b) {
			return b.votes - a.votes;
		});
		databasePromise.then(function(db) {
			var types = {};
			_.each(votes_arr, function(item) {
				var event = db.getEventWithUniqueID(item.eventId);

				item.title = event.getName();
				item.type = event.getType();
				types[item.type] = true;
			});
			$scope.votes = votes_arr;
			$scope.types = _.keys(types);
			$scope.loading = false;
		});
	});

	$scope.dismiss = function() {
		$uibModalInstance.dismiss('cancel');
	};
}