app.factory('UploadService', UploadService);

UploadService.$inject=['$q', '$http', 'AuthenticationService', 'Upload'];
function UploadService($q, $http, AuthenticationService, Upload) {
	var UPLOAD_URL = 'upload.php';
	return {
		uploadFiles: function(files, folder, conferenceID) {
			if (files && files.length) {
				return Upload.upload({
					url: UPLOAD_URL,
					data: {
						file: files,
						folder: folder,
						userToken: AuthenticationService.getAuthInformation().token,
						conferenceID: conferenceID
					}
				}).then(function (resp) {
					if(resp.error) {
						throw new Error(resp.error);
					} else {
						var rv = [],
							resultingURIs = resp.data;
						for(var i = 0; i<files.length; i++) {
							rv.push({
								name: files[i].name,
								uri: resultingURIs[i]
							});
						}
						return rv;
					}
				});
			} else {
				return $q(function(resolve, reject) {
					reject(new Error('No files selected'));
				});
			}
		},

		removeDataFile: function(fileURL, conferenceID) {
			return $http({
				url: UPLOAD_URL,
				data: {
					userToken: AuthenticationService.getAuthInformation().token,
					conferenceID: conferenceID,
					remove: fileURL
				}
			});
		}
	};
}