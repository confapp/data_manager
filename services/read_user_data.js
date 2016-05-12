app.service('UserData', ['$q', 'APIServices', '$firebaseObject', function($q, APIServices, $firebaseObject) {
	return {
		getUserData: function(conference_id) {
			var ref = APIServices.getFirebaseRef();

			return $firebaseObject(ref.child('user_data').child(conference_id));
		}
	};
}]);