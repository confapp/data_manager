app.factory('APIServices', APIServices);

APIServices.$inject=['$q', '$http'];
function APIServices($q, $http) {
	var config = {
		apiKey: "AIzaSyC0rxn5Oipwn0mH8gjV0DjqebTfwmeQm-U",
		authDomain: "confapp-data-sync.firebaseapp.com",
		databaseURL: "https://confapp-data-sync.firebaseio.com",
		storageBucket: "confapp-data-sync.appspot.com",
	};
	firebase.initializeApp(config);

	var ref = firebase.database().ref(),
		conferencesRef = ref.child('conferences'),
		storageRef = firebase.storage().ref(),
		authRef = firebase.auth(),
		tz_api_key = "AIzaSyCh4eAVGTJRsv-dDKatS2acYi-P1N8tjpU",
		geocode_api_key = "AIzaSyCDbBLHTSIKqafSpdM-tp_cUYEPtyJ68kM";

	var service = {
		getStorageRef: function() {
			return storageRef;
		},
		getAuthRef: function() {
			return authRef;
		},
		getFirebaseRef: function() {
			return ref;
		},
		getConferencesRef: function() {
			return conferencesRef;
		},
		sanitizeKey: function(key) {
			key = key.replace(".","-dot-");
			key = key.replace("#","-hash-");
			key = key.replace("$","-dollar-");
			key = key.replace("/","-slash-");
			key = key.replace("[","-leftsquare-");
			key = key.replace("]","-rightsquare-");
			return key;
		},
		getLocationTimeZone: function(address) {
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
	};
	return service;
}