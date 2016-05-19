app.factory('UploadService', UploadService);

UploadService.$inject=['$q', '$http', 'AuthenticationService', 'Upload', 'APIServices'];
function UploadService($q, $http, AuthenticationService, Upload, APIServices) {
	var storageRef = APIServices.getStorageRef();
	return {
		uploadFiles: function(files, folder, conferenceID) {
			var folderRef = storageRef.child(conferenceID).child(folder);
			if (files && files.length) {
				return $q.all(_.map(files, function(file) {
					var uploadTask = storageRef.child(file.name).put(file);

					// Register three observers:
					// 1. 'state_changed' observer, called any time the state changes
					// 2. Error observer, called on failure
					// 3. Completion observer, called on successful completion
					return $q(function(resolve, reject) {
						uploadTask.on('state_changed', function(snapshot){
							// Observe state change events such as progress, pause, and resume
							// See below for more detail
						}, function(error) {
							// Handle unsuccessful uploads
							reject(error);
						}, function() {
							// Handle successful uploads on complete
							// For instance, get the download URL: https://firebasestorage.googleapis.com/...
							var downloadURL = uploadTask.snapshot.downloadURL;
							resolve(downloadURL);
						});
					});
				}));
			} else {
				return $q(function(resolve, reject) {
					reject(new Error('No files selected'));
				});
			}
		},

		removeDataFile: function(file, folder, conferenceID) {
			var fileRef = storageRef.child(conferenceID).child(folder).child(file);

			return $q(function(resolve, reject) {
				fileRef.delete().then(resolve, reject);
			});
		}
	};
}