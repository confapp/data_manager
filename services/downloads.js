app.factory('DownloadService', DownloadService);

DownloadService.$inject=['$q', 'DatabaseCreator', 'APIServices', '$firebaseObject'];
function DownloadService($q, DatabaseCreator, APIServices, $firebaseObject) {
	var conferencesRef = APIServices.getConferencesRef();

	return {
		downloadDatabaseZip: function(conferenceID) {
			var conference = conferencesRef.child(conferenceID),
				jsonDatabase = $firebaseObject(conference.child('currentJSONDatabase')),
				currentVersion = $firebaseObject(conference.child('currentDatabaseVersion')),
				jsonData,
				jsonString,
				jsonpString,
				version,
				filename;

			$q.all([jsonDatabase.$loaded(), currentVersion.$loaded()]).then(function(valueArray) {
				jsonData = valueArray[0];
				version = valueArray[1].$value;

				jsonString = angular.toJson(jsonData);
				jsonpString = 'var _cadata_ = ' + jsonString + ';';
				filename = conferenceID + '_' + version;


				return DatabaseCreator.createDatabaseFromJSON(jsonData);
			}).then(function(sqlite3DB) {
				return sqlite3DB.export();
			}).then(function(exportedSQLiteDB) {
				var zip = new JSZip();
				zip.folder('database')	.file(filename+'.json'   , jsonString)
										.file(filename+'.jsonp'  , jsonpString)
										.file(filename+'.sqlite3', exportedSQLiteDB);

				var content = zip.generate({ type: 'blob' });
				saveAs(content, filename+'.zip');
			});
			/*




			var currentJSONData = conference.currentJSONDatabase,
				version = conference.currentDatabaseVersion;
			DatabaseCreator.createDatabaseFromJSON(currentJSONData).then(function(db) {
				var data = db.export();
				saveData(data, conference.uid+'_'+version+'.sqlite3');
			});
			var stringifiedJSONData = JSON.stringify(jsonData);
			*/
		}
	};
}