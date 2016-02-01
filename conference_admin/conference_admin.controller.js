app.controller('HomeController', HomeController);

HomeController.$inject = ['$q', '$http', '$scope', '$location', '$rootScope', 'AuthenticationService', '$firebaseObject', '$firebaseArray', 'DatabaseCreator', 'APIServices', 'UploadService', 'DownloadService'];
function HomeController($q, $http, $scope, $location, $rootScope, AuthenticationService, $firebaseObject, $firebaseArray, DatabaseCreator, APIServices, UploadService, DownloadService) {
	var ref = APIServices.getFirebaseRef();
	var conferenceID = $location.search().conference;
	var conferenceRef = APIServices.getConferencesRef().child(conferenceID);
	var firebaseRef = APIServices.getFirebaseRef();

	ref.onAuth(function() {
		$scope.conference = $firebaseObject(conferenceRef);
		$scope.conference.$bindTo($scope, 'conference');

		$scope.dataFiles = $firebaseObject(conferenceRef.child('dataFiles'));
		$scope.dataFiles.$bindTo($scope, 'dataFiles');
		$scope.annotationTypes = $firebaseObject(conferenceRef.child('annotationTypes'));
		$scope.annotationTypes.$bindTo($scope, 'annotationTypes');
		$scope.sessionTypes = $firebaseObject(conferenceRef.child('sessionTypes'));
		$scope.sessionTypes.$bindTo($scope, 'sessionTypes');
		$scope.presentationTypes = $firebaseObject(conferenceRef.child('presentationTypes'));
		$scope.presentationTypes.$bindTo($scope, 'presentationTypes');
		$scope.maps = $firebaseObject(conferenceRef.child('maps'));
		$scope.maps.$bindTo($scope, 'maps');
		$scope.locations = $firebaseObject(conferenceRef.child('locations'));
		$scope.locations.$bindTo($scope, 'locations');


		$scope.mapLocations = {};
		$q.all([$scope.maps.$loaded(), $scope.locations.$loaded()]).then(function() {
			conferenceRef.child('maps').on('value', updateMapLocations);
			conferenceRef.child('locations').on('value', updateMapLocations);
			updateMapLocations();
		})
	});

	$scope.logout = function() {
		AuthenticationService.logout();
		$location.path('/login');
	};

	$scope.changeNewAnnotationImage = function(file) {
		UploadService.uploadFiles(file, 'annotations', conferenceID).then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.new_annotation.icon = fileInfos[0];
			}
		});
	};

	$scope.changeAnnotationImage = function(file, annotationType, key) {
		UploadService.uploadFiles(file, 'annotations', conferenceID).then(function(fileInfos) {
			if(fileInfos.length > 0) {
				conferenceRef.child('annotationTypes').child(key).child('icon').set(fileInfos[0]);
				//annotationType.icon = fileInfos[0];
			}
		});
	};

	$scope.addAnnotationType = function(id, type, description, icon) {
		$scope.new_annotation.id = $scope.new_annotation.type =
			$scope.new_annotation.description = '';
		$scope.new_annotation.icon = false;

		var info = {
			id: id,
			type: type,
			description: description
		};

		if(icon) {
			info.icon = icon;
		}

		conferenceRef.child('annotationTypes').push(info);
	};

	$scope.addMap = function(id, name, image) {
		$scope.new_map.id = $scope.new_map.name = '';
		$scope.new_map.image = false;

		var info = {
			id: id,
			name: name
		};

		if(image) {
			info.image = image;
		}

		conferenceRef.child('maps').push(info);
	};

	$scope.removeMap = function(map, key) {
		conferenceRef.child('maps').child(key).remove();
	};

	$scope.changeMapImage = function(file, map, key) {
		UploadService.uploadFiles(file, 'maps', conferenceID).then(function(fileInfos) {
			if(fileInfos.length > 0) {
				//map.image = fileInfos[0];
				conferenceRef.child('maps').child(key).child('image').set(fileInfos[0]);
			}
		});
	};

	var waitingLocationKey;
	$scope.moveLocation = function(location, locationKey) {
		if($scope.waitingForMapClick === location) {
			$scope.waitingForMapClick = waitingLocationKey = false;
		} else {
			$scope.waitingForMapClick = location;
			waitingLocationKey = locationKey;
		}
	};

	$scope.onClickMap = function(map, mapKey, event) {
		var location = $scope.waitingForMapClick;
		if(location) {
			var img = $(event.target);

			conferenceRef.child('locations').child(waitingLocationKey).update({
				pctX: event.offsetX/img.width(),
				pctY: event.offsetY/img.height(),
				mapKey: mapKey
			});

			$scope.waitingForMapClick = waitingLocationKey = false;
		}
	};

	$scope.changeNewMapImage = function(file) {
		UploadService.uploadFiles(file, 'maps', conferenceID).then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.new_map.image = fileInfos[0];
			}
		});
	};

	$scope.removeAnnotationType = function(annotationType, key) {
		conferenceRef.child('annotationTypes').child(key).remove();
	};

	$scope.removeSessionType = function(sessionType, key) {
		conferenceRef.child('sessionTypes').child(key).remove();
	};

	$scope.uploadIcon = function(file) {
		return UploadService.uploadFiles(file, 'icons', conferenceID).then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.conference.primaryIcon = fileInfos[0];
			}
		});
	};

	$scope.uploadData = function(files) {
		var uploadTime = (new Date()).getTime();
		return UploadService.uploadFiles(files, 'data', conferenceID).then(function(filenames) {
			for(var i = 0; i<filenames.length; i++) {
				var filename = filenames[i],
					name = filename.name;
				var info = {
					uri: filename,
					name: name,
					updated: uploadTime
				};
				var refName = APIServices.sanitizeKey(name);
				conferenceRef.child('dataFiles').child(refName).set(info);
			}
		});
	};

	$scope.removeDataFile = function(file, key) {
		conferenceRef.child('dataFiles').child(key).remove();
		UploadService.removeDataFile(file.uri, conferenceID);
	};

	$scope.updateIcon = function(file) {
		return UploadService.uploadFiles(file, 'icons', conferenceID).then(function(filenames) {
			if(filenames.length > 0) {
				var filename = filenames[0];
				$scope.conference.primaryIconURI = filename;
			}
		});
	};
	$scope.addSessionType = function(name, event_demonym, person_demonym) {
		$scope.new_session.name = $scope.new_session.event_demonym =
			$scope.new_session.person_demonym = '';

		conferenceRef.child('sessionTypes').push({
			name: name,
			eventDemonym: event_demonym,
			personDemonym: person_demonym
		});
	};

	$scope.removeSessionType = function(sessionType, key) {
		conferenceRef.child('sessionTypes').child(key).remove();
	};

	$scope.removePresentationType = function(presentationType, key) {
		conferenceRef.child('presentationTypes').child(key).remove();
	};

	$scope.removeLocation = function(location, key) {
		conferenceRef.child('locations').child(key).remove();
	};

	$scope.addPresentationType = function(name, duration, person_demonym) {
		$scope.new_presentation_type.name = $scope.new_presentation_type.duration = $scope.new_presentation_type.person_demonym = '';

		conferenceRef.child('presentationTypes').push({
			name: name,
			duration: duration,
			personDemonym: person_demonym
		});
	};

	$scope.addLocation = function(id, name) {
		$scope.new_location.id = $scope.new_location.name = '';

		conferenceRef.child('locations').push({
			id: id,
			name: name,
			pctX: -1,
			pctY: -1
		});
	};

	$scope.restoreProgramOptionDefaults = function() {
		conferenceRef.update({
			hasSchedule: true,
			hasNotes: true,
			hasReadingList: true,
			hasDataSync: true,
			hasVoting: false
		});
	};

	/*

	$scope.maps
	$scope.maps = $firebaseObject(conferenceRef.child('maps'));
	$scope.locations = $firebaseObject(conferenceRef.child('locations'));
	conferenceRef.child('locations').on('value', updateMapLocations);
	conferenceRef.child('maps').on('value', updateMapLocations);
	*/
	function updateMapLocations() {
		var mapLocations = $scope.mapLocations;
		conferenceRef.child('maps').once('value', function(mval) {
			var maps = mval.val();
			conferenceRef.child('locations').once('value', function(lval) {
				var locations = lval.val();

				angular.forEach(locations, function(mapLocation, key) {
					delete mapLocations[key];
				});


				angular.forEach(maps, function(map, mapKey) {
					angular.forEach(locations, function(location, locationKey) {
						if(location.mapKey === mapKey) {
							if(!mapLocations[mapKey]) {
								mapLocations[mapKey] = {};
							}
							mapLocations[mapKey][locationKey] = location;
						}
					});
				});
				setTimeout(updateLocationMarkerPositions, 10);
			});
		});
	}


	$scope.conference.$loaded(function(data) {
		setTimeout(function() {
			$scope.$watch('conference.location', function(newValue) {
				$scope.timeZoneError = false;
				APIServices.getLocationTimeZone(newValue).then(function(timeZone) {
					$scope.timeZoneError = false;
					$scope.conference.timeZone = timeZone;
				}, function(err) {
					$scope.timeZoneError = err.toString();
				});
			});
		}, 100);
	});

	$scope.mouseEnterLocation = function(location, key) {
		$scope.hoveringOverLocation = key;
	};
	$scope.mouseLeaveLocation = function(location) {
		$scope.hoveringOverLocation = false;
	};

	$scope.getMapClasses = function() {
		var rv = ['map'];
		if($scope.waitingForMapClick) {
			rv.push('waitingForMapClick');
		}
		return rv.join(' ');
	};

	$scope.getMapMarkerClasses = function(location, key) {
		var rv = ['locationMarker'];
		if($scope.waitingForMapClick) {
			rv.push('ignoreClicks');
		}
		if(waitingLocationKey === key) {
			rv.push('waitingForMapClick');
		}
		if($scope.hoveringOverLocation === key) {
			rv.push('highlighted');
		}
		return rv.join(' ');
	};
	$scope.getLocationRowClasses = function(location, key) {
		var rv = [];
		if(waitingLocationKey === key) {
			rv.push('waitingForMapClick');
		}
		if($scope.hoveringOverLocation === key) {
			rv.push('highlighted');
		}
		return rv.join(' ');
	};

	$scope.hoveringOverLocation = false;

	angular.element(window).on('resize', updateLocationMarkerPositions);
	var markerBorderThickness = 3,
		markerRadius = 10;

	function updateLocationMarkerPositions() {
		var locationMarkers = angular.element('.locationMarker');
		angular.forEach(locationMarkers, function(locationMarker) {
			var elem = angular.element(locationMarker),
				pctX = parseFloat(elem.attr('data-pctX')),
				pctY = parseFloat(elem.attr('data-pctY')),
				img = angular.element('img', elem.parent()),
				dimensions = getImageDimensions(img);
			dimensions.then(function(dim) {
				var x = pctX*dim.width,
					y = pctY*dim.height;

				elem.css({
					left: Math.round(x+markerRadius/2)+'px',
					top: Math.round(y-markerRadius/2)+'px',
					'border-radius': markerRadius+'px',
					width: (2*markerRadius-markerBorderThickness)+'px',
					height: (2*markerRadius-markerBorderThickness)+'px',
					'border-width': markerBorderThickness+'px'
				});
			});
		});
	}
	function getImageDimensions(img) {
		img = angular.element(img);

		return $q(function(resolve, reject){
			function doResolve() {
				resolve({
					width: img.width(),
					height: img.height()
				});
			}

			if(img[0].complete) {
				doResolve();
			} else {
				img.on('load', function() {
					doResolve();
				}).on('error', function(err) {
					reject(err);
				});
			}
		});
	}
	$scope.generatingInterimMessages = [];
	$scope.currentlyGenerating = false;
	$scope.warinings = [];
	$scope.error = false;

	$scope.generateDatabase = function() {
		var gim = $scope.generatingInterimMessages = [];
		$scope.warnings = [];
		$scope.error = false;
		$scope.currentlyGenerating = true;
		return $q(function(resolve, reject) {
			$scope.generatingInterimMessages.push('downloading data...');
			conferenceRef.once('value', function(dataSnapshot){
				resolve(dataSnapshot.val());
			});
		}).then(function(sourceData) {
			gim[gim.length-1] += 'done';
			$scope.generatingInterimMessages.push('generating database...');
			return DatabaseCreator.createDatabase(sourceData);
		}).then(function(result) {
			gim[gim.length-1] += 'done';
			$scope.generatingInterimMessages.push('uploading json database...');
			//conferenceRef.child('currentJSONDatabase').set(jsonData);
			firebaseRef.child('deployed_databases').child(conferenceID).child('schema').set(result.tables);
			firebaseRef.child('deployed_databases').child(conferenceID).child('database').set(result.json);
			firebaseRef.child('common_apps').child('main').child(conferenceID).update(result.dbInfo);
			
			return result;
		}).then(function(result) {

			/*
		}).then(function(result) {
			gim[gim.length-1] += 'done';
			$scope.generatingInterimMessages.push('uploading sqlite database...');
			var db = result.database,
				exportedDatabase = db.export();

			return $http({
				url: 'upload.php',
				data: {
					database: exportedDatabase,
					userToken: AuthenticationService.getAuthInformation().token,
					conferenceID: conferenceID
				},
				method: 'POST'
			}).then(function(info) {
				console.log(info);
				return result;
			});
			*/
			/*
		$firebaseObject(ref.child('common_apps').child('main').child(conferenceID)).$bindTo();
		//conferenceRef.child('name')).$watch(function() {

		});

		//var common_app_icon_uri = $firebaseO

		/*
				ref.child('common_apps').child('main').child(conference_uid).transaction(function(currentData) {
					if(currentData) {
						reject('"'+conference_uid+'" is not unique');
					} else {
						return {
							conference_id: conference_uid,
							icon_uri: data.primaryIcon.uri,
							name: data.name,
							start_day: 1451624400,
							utc_offset: -300
						};
					}
				}, function(err, committed, dataSnapshot) {
				*/
		}).then(function(result) {
			gim[gim.length-1] += 'done';
			result.database.close();
			conferenceRef.update({
				currentDatabaseVersion: result.version,
				currentDatabaseUpdated: result.updated
			});

			$scope.warnings = result.warnings;
		}, function(err) {
			$scope.error = err;
		}).finally(function() {
			$scope.generatingInterimMessages = [];
			$scope.currentlyGenerating = false;
		});
	};

	$scope.downloadDatabase = function() {
		DownloadService.downloadDatabaseZip(conferenceID);
	};
}