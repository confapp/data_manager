app.factory('JSONReader', JSONReader);

JSONReader.$inject=['$q', '$http', 'ParseJSONPapers', 'ParseJSONSessions', 'ParseJSONSchedule'];
function JSONReader($q, $http, ParseJSONPapers, ParseJSONSessions, ParseJSONSchedule) {
	var CATEGORY_PARSE_ORDER = ['entities', 'sessions', 'schedule'];

	return {
		parseJSON: function(options, uri, filename) {
			return $http({
				method: 'GET',
				url: uri,
				transformResponse: []
			}).then(function(val) {
				var str = val.data;
				// get rid of the equality setting in the beginning of the file
				var var_name = str.slice(0, str.indexOf("=")).trim(),
					value = JSON.parse(str.replace(/^[$A-Za-z_][0-9A-Z_a-z$]*\s*\=\s*/, ''));

				return {
					filetype: 'json',
					value: value,
					var_name: var_name,
					filename: filename
				};
			});
		},
		handleParsedJSONs: function(options, parsedValues) {
			var parsePromises = [];

			_.each(CATEGORY_PARSE_ORDER, function(category) {
				var categoryPromises = _.map(parsedValues, function(parsedValue) {
					if(parsedValue.filetype === 'json' && parsedValue.var_name === category) {
						var filename = parsedValue.filename;
						if(category === 'sessions') {
							return ParseJSONSessions.parseJSONSessions(options, parsedValue.value, parsedValue.filename);
						} else if(category === 'schedule') {
							return ParseJSONSchedule.parseJSONSchedule(options, parsedValue.value, parsedValue.filename);
						} else if(category === 'entities') {
							return ParseJSONPapers.parseJSONPapers(options, parsedValue.value, parsedValue.filename);
						} else {
							throw new Error('Unknown JSON type ' + parsedValue.category);
						}
					}
				});

				parsePromises.push.apply(parsePromises, categoryPromises);
			});
			return parsedValues;
		}
	};
};
