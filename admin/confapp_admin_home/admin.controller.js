app.controller('HomeController', HomeController);

HomeController.$inject = ['$q', '$http', '$scope', '$location', '$rootScope', 'AuthenticationService', '$firebaseObject', '$firebaseArray', 'Upload', 'DatabaseCreator'];
function HomeController($q, $http, $scope, $location, $rootScope, AuthenticationService, $firebaseObject, $firebaseArray, Upload, DatabaseCreator) {
	var conferenceID = $location.search().conference;
	var conferenceRef = ref.child('conferences').child(conferenceID);
	$scope.user_email = AuthenticationService.getUserInformation().email;

	$scope.conference = $firebaseObject(conferenceRef);
	$scope.conference.$bindTo($scope, 'conference');
	$scope.logout = function() {
		AuthenticationService.logout();
		$location.path('/login');
	};

	$scope.dataFiles = $firebaseObject(conferenceRef.child('dataFiles'));
	$scope.annotationTypes = $firebaseObject(conferenceRef.child('annotationTypes'));
	$scope.sessionTypes = $firebaseObject(conferenceRef.child('sessionTypes'));
	$scope.presentationTypes = $firebaseObject(conferenceRef.child('presentationTypes'));
	$scope.maps = $firebaseObject(conferenceRef.child('maps'));
	$scope.locations = $firebaseObject(conferenceRef.child('locations'));

	function uploadFiles(files, folder) {
		if (files && files.length) {
			return Upload.upload({
				url: 'upload.php',
				data: {
					file: files,
					folder: folder,
					userToken: AuthenticationService.getAuthInformation().token,
					conferenceID: conferenceID
				}
			}).then(function (resp) {
				var rv = [],
					resultingURIs = resp.data;
				for(var i = 0; i<files.length; i++) {
					rv.push({
						name: files[i].name,
						uri: resultingURIs[i]
					});
				}
				return rv;
			});
		} else {
			return $q(function(resolve, reject) {
				reject(new Error('No files selected'));
			});
		}
	}

	function removeDataFile(fileURL) {
		/*
		return $http({
			url: 'upload.php',
			data: {
				userToken: AuthenticationService.getAuthInformation().token,
				conferenceID: conferenceID,
				remove: fileURL
			}
		});
		*/
	}

	$scope.changeNewAnnotationImage = function(file) {
		uploadFiles(file, 'annotations').then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.new_annotation_icon = fileInfos[0];
			}
		});
	};

	$scope.changeAnnotationImage = function(file, annotationType, key) {
		uploadFiles(file, 'annotations').then(function(fileInfos) {
			if(fileInfos.length > 0) {
				annotationType.icon = fileInfos[0];
			}
		});
	};

	$scope.addAnnotationType = function(id, type, description, icon) {
		$scope.new_annotation_id = $scope.new_annotation_type =
			$scope.new_annotation_description = '';
		$scope.new_annotation_icon = false;

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
		$scope.new_map_id = $scope.new_map_name = '';
		$scope.new_map_image = false;

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
		uploadFiles(file, 'maps').then(function(fileInfos) {
			if(fileInfos.length > 0) {
				map.image = fileInfos[0];
			}
		});
	};

	var waitingLocationKey;
	$scope.moveLocation = function(location, locationKey) {
		if($scope.waitingForMapClick === location) {
			$scope.waitingForMapClick = false;
		} else {
			$scope.waitingForMapClick = location;
			waitingLocationKey = locationKey;
		}
	};

	$scope.onClickMap = function(map, mapKey, event) {
		var location = $scope.waitingForMapClick;
		if(location) {
			$scope.waitingForMapClick = false;
			var img = $(event.target);

			conferenceRef.child('locations').child(waitingLocationKey).update({
				pctX: event.offsetX/img.width(),
				pctY: event.offsetY/img.height(),
				mapKey: mapKey
			});
		}
	};

	$scope.changeNewMapImage = function(file) {
		uploadFiles(file, 'maps').then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.new_map_image = fileInfos[0];
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
		return uploadFiles(file, 'icons').then(function(fileInfos) {
			if(fileInfos.length > 0) {
				$scope.conference.primaryIcon = fileInfos[0];
			}
		});
	};

	$scope.uploadData = function(files) {
		var uploadTime = (new Date()).getTime();
		return uploadFiles(files, 'data').then(function(filenames) {
			for(var i = 0; i<filenames.length; i++) {
				var filename = filenames[i],
					name = filename.name;
				var info = {
					uri: filename,
					name: name,
					updated: uploadTime
				};
				var refName = sanitizeKey(name);
				conferenceRef.child('dataFiles').child(refName).set(info);
			}
		});
	};

	$scope.removeDataFile = function(file, key) {
		conferenceRef.child('dataFiles').child(key).remove();
		removeDataFile(file.uri);
	};

	$scope.updateIcon = function(file) {
		return uploadFiles(file, 'icons').then(function(filenames) {
			if(filenames.length > 0) {
				var filename = filenames[0];
				$scope.conference.primaryIconURI = filename;
			}
		});
	};

	$scope.uploadFiles = function (files, folder) {
		return uploadFiles(files, folder);
	};

	$scope.addSessionType = function(name, event_demonym, person_demonym) {
		$scope.new_session_type_name = $scope.new_session_type_event_demonym =
			$scope.new_session_type_person_demonym = '';

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
		$scope.new_presentation_type_name = $scope.new_presentation_type_duration = $scope.new_presentation_type_person_demonym = '';

		conferenceRef.child('presentationTypes').push({
			name: name,
			duration: duration,
			personDemonym: person_demonym
		});
	};

	$scope.addLocation = function(id, name) {
		conferenceRef.child('locations').push({
			id: id,
			name: name,
			pctX: -1,
			pctY: -1
		});

		$scope.new_location_id = $scope.new_location_name = '';
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

	$scope.mapLocations = {};
	$q.all([$scope.maps.$loaded(), $scope.locations.$loaded()]).then(function() {
		$scope.maps.$watch(updateMapLocations)
		$scope.locations.$watch(updateMapLocations)
		updateMapLocations();
	})
	/*

	$scope.maps
	$scope.maps = $firebaseObject(conferenceRef.child('maps'));
	$scope.locations = $firebaseObject(conferenceRef.child('locations'));
	conferenceRef.child('locations').on('value', updateMapLocations);
	conferenceRef.child('maps').on('value', updateMapLocations);
	*/
	function updateMapLocations() {
		var mapLocations = $scope.mapLocations;
		angular.forEach(mapLocations, function(mapLocation, key) {
			delete mapLocations[key];
		});

		angular.forEach($scope.maps, function(map, mapKey) {
			angular.forEach($scope.locations, function(location, locationKey) {
				if(location.mapKey === mapKey) {
					if(angular.isArray(mapLocations[mapKey])) {
						mapLocations[mapKey].push(location);
					} else {
						mapLocations[mapKey] = [location]
					}
				}
			});
		});
		setTimeout(updateLocationMarkerPositions, 10);
	}


	$scope.conference.$loaded(function(data) {
		setTimeout(function() {
			$scope.$watch('conference.location', function(newValue) {
				$scope.timeZoneError = false;
				getLocationTimeZone(newValue).then(function(timeZone) {
					$scope.timeZoneError = false;
					$scope.conference.timeZone = timeZone;
				}, function(err) {
					$scope.timeZoneError = err.toString();
				});
			});
		}, 100);
	});

	function getLocationTimeZone(address) {
		if(!address) {
			return $q(function(resolve, reject) {
				reject(new Error('No location specified'));
			});
		}
		var geoResultStored;
		return $http({
			url: "https://maps.googleapis.com/maps/api/geocode/json",
			method: "GET",
			params: {
				key: geocode_api_key,
				address: address
			}
		}).then(function(gCodeResults) {
			var data = gCodeResults.data;
			if(data.results.length > 0) {
				return data.results[0];
			} else {
				throw new Error('No results for location ' + address);
			}
		}).then(function(geoResult) {
			geoResultStored = geoResult;
			return $http({
				url: "https://maps.googleapis.com/maps/api/timezone/json",
				method: "GET",
				params: {
					key: tz_api_key,
					location: geoResult.geometry.location.lat+","+geoResult.geometry.location.lng,
					timestamp: (new Date()).getTime()/1000
				}
			});
		}).then(function(addrResult){
			return addrResult.data.timeZoneId;
		});
	}
	function sanitizeKey(key) {
		key = key.replace(".","-dot-");
		key = key.replace("#","-hash-");
		key = key.replace("$","-dollar-");
		key = key.replace("/","-slash-");
		key = key.replace("[","-leftsquare-");
		key = key.replace("]","-rightsquare-");
		return key;
	}

	$scope.mouseEnterLocation = function(location) {
		$scope.hoveringOverLocation = location;
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

	$scope.getMapMarkerClasses = function(location) {
		var rv = ['locationMarker'];
		if($scope.waitingForMapClick) {
			rv.push('ignoreClicks');
		}
		if($scope.waitingForMapClick === location) {
			rv.push('waitingForMapClick');
		}
		if($scope.hoveringOverLocation === location) {
			rv.push('highlighted');
		}
		return rv.join(' ');
	};
	$scope.getLocationRowClasses = function(location) {
		var rv = [];
		if($scope.waitingForMapClick === location) {
			rv.push('waitingForMapClick');
		}
		if($scope.hoveringOverLocation === location) {
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
					left: Math.round(x+markerRadius)+'px',
					top: Math.round(y-markerRadius)+'px',
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
			var jsonData = result.json;
			conferenceRef.child('currentJSONDatabase').set(jsonData);
			return result;
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
		}).then(function(result) {
			gim[gim.length-1] += 'done';
			result.database.close();
			conferenceRef.update({
				currentDatabaseVersion: result.version
			});

			$scope.warnings = result.warnings;
		}, function(err) {
			$scope.error = err;
		}).finally(function() {
			$scope.generatingInterimMessages = [];
			$scope.currentlyGenerating = false;
		});
	};
	$scope.generateDatabase();
}