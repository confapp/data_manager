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
			var zip = new JSZip();

			var sqlitePromise = $q.all([jsonDatabase.$loaded(), currentVersion.$loaded()]).then(function(valueArray) {
				jsonData = valueArray[0];
				version = valueArray[1].$value;

				jsonString = angular.toJson(jsonData);
				jsonpString = 'var _cadata_ = ' + jsonString + ';';
				filename = conferenceID + '_' + version;


				return DatabaseCreator.createDatabaseFromJSON(jsonData);
			}).then(function(sqlite3DB) {
				return sqlite3DB.export();
			});

			return sqlitePromise.then(function(exportedSQLiteDB) {
				zip.folder('database')	.file(filename+'.json'   , jsonString)
										.file(filename+'.jsonp'  , jsonpString)
										.file(filename+'.sqlite3', exportedSQLiteDB);

				var content = zip.generate({ type: 'blob' });
				saveAs(content, filename+'.zip');
			});
		}
	};
}