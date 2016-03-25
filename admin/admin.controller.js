app.controller('AdminController', AdminController);

AdminController.$inject = ['$scope', '$location', '$rootScope', 'AuthenticationService', 'APIServices', '$firebaseObject', 'DatabaseCreator'];
function AdminController($scope, $location, $rootScope, AuthenticationService, APIServices, $firebaseObject, DatabaseCreator) {
	var obj = JSON.parse('{"annotationTypes":{"-K74SS4op2fPcCGJrfAs":{"description":"Honorable Mention","icon":{"name":"honorable.png","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/annotations/honorable.png"},"id":"honorable","type":"Award"},"-K74S_0cW7QMlwzfYEC-":{"description":"Best Paper","icon":{"name":"best.png","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/annotations/best.png"},"id":"best","type":"Award"}},"currentDatabaseUpdated":1451799145,"currentDatabaseVersion":1,"dataFiles":{"attachments-dot-csv":{"name":"attachments.csv","updated":1451921292907,"uri":{"name":"attachments.csv","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/attachments.csv"}},"courses-dot-csv":{"name":"courses.csv","updated":1451921292907,"uri":{"name":"courses.csv","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/courses.csv"}},"papers-dot-csv":{"name":"papers.csv","updated":1451921292907,"uri":{"name":"papers.csv","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/papers.csv"}},"schedule-dot-json":{"name":"schedule.json","updated":1458910938058,"uri":{"name":"schedule.json","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/schedule.json"}},"sessions-dot-json":{"name":"sessions.json","updated":1458910938058,"uri":{"name":"sessions.json","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/sessions.json"}},"sessions-dot-csv":{"name":"sessions.csv","updated":1451921292907,"uri":{"name":"sessions.csv","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/sessions.csv"}},"talks-dot-csv":{"name":"talks.csv","updated":1451921292907,"uri":{"name":"talks.csv","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/data/talks.csv"}}},"description":"The First International Conference on Database Creators Default Settings","hasDataSync":true,"hasNotes":true,"hasReadingList":true,"hasSchedule":true,"hasVoting":false,"location":"Ann Arbor, MI","locations":{"-K74XkoQcsrC6odA3s4q":{"id":"red","mapKey":"-K74U4PMYnQgsgVUuqQD","name":"Red Room","pctX":0.3442622950819672,"pctY":0.6055555555555555},"-K74Y4WLYvikhEGrcYjR":{"id":"blue","mapKey":"-K74U4PMYnQgsgVUuqQD","name":"Blue Room","pctX":0.5045537340619308,"pctY":0.6611111111111111},"-K74ZjrMkS5S8fZwnf9M":{"id":"green","mapKey":"-K74U4PMYnQgsgVUuqQD","name":"Green Room","pctX":0.6539162112932605,"pctY":0.6083333333333333},"-K74ZmMrkbczrBjvH91g":{"id":"oval","mapKey":"-K74UJln_rda4UBAhfeG","name":"Oval Room","pctX":0.5027322404371585,"pctY":0.6475409836065574}},"maps":{"-K74U4PMYnQgsgVUuqQD":{"id":"floor_1","image":{"name":"floor_1.png","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/maps/floor_1.png"},"name":"Floor 1"},"-K74UJln_rda4UBAhfeG":{"id":"floor_2","image":{"name":"floor_2.png","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/maps/floor_2.png"},"name":"Floor 2"}},"name":"JSON Test","presentationTypes":{"-K74TAYiGXor9Bv4xIky":{"duration":"20","name":"Paper","personDemonym":"Author"},"-K74TDaL1Y1miiX8X0a4":{"duration":"15","name":"Note","personDemonym":"Authors"}},"primaryIcon":{"name":"defaultConferenceIcon.png","uri":"http://localhost/~soney/confapp_admin/uploads/json_test/icons/defaultConferenceIcon.png"},"sessionTypes":{"-K74Sxh3jo3Mxp6D7rGe":{"eventDemonym":"Papers","name":"Papers","personDemonym":"Chair"},"-K74T3TBsVMAW_sdr7qn":{"eventDemonym":"Course","name":"Course","personDemonym":"Instructor"}},"timeZone":"America/New_York","uid":"json_test","webBaseURL":"http://confapp.github.io/web_guide/?conference=json_test"}');
	DatabaseCreator.createDatabase(obj);
	return;
	var ref = APIServices.getFirebaseRef();
	$scope.isRootUser = false;

	ref.onAuth(function(adata) {
		if(adata) {
			var userInformation = AuthenticationService.getUserInformation(),
				authInformation = AuthenticationService.getAuthInformation();

			$scope.user_email = userInformation ? userInformation.email : false;
			AuthenticationService.isRootUser().then(function(isRoot) {
				if(isRoot) { $scope.isRootUser = isRoot; }
			});
		}
	});

	$scope.logout = function() {
		$scope.user_email = false;
		AuthenticationService.logout();
		$location.path('/login');
	};

	$scope.manageAccount = function() {
		$location.path('/manage_account');
	};

	$scope.chooseConference = function() {
		$location.search({
			conference: undefined
		}).path('/choose_conference');
	};
	$scope.manageAllAccounts = function() {
		$location.path('root_admin');
	};
}