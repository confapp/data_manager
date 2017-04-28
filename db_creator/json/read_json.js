app.factory('JSONReader', JSONReader);

JSONReader.$inject=['$q', '$http', 'ParseJSONPapers', 'ParseJSONSessions', 'ParseJSONSchedule'];
function JSONReader($q, $http, ParseJSONPapers, ParseJSONSessions, ParseJSONSchedule) {
	var CATEGORY_PARSE_ORDER = ['entities', 'sessions', 'schedule'];
	var VAR_REGEX = new RegExp('^[$A-Za-z_][0-9A-Z_a-z$]*\s*\=\s*', 'g')

	return {
		parseJSON: function(options, uri, filename) {
			return $http({
				method: 'GET',
				url: uri,
				transformResponse: []
			}).then(function(val) {
				var str = val.data;
				// get rid of the equality setting in the beginning of the file
				var var_name = str.slice(0, str.indexOf("=")).trim();
				var fixed_string = str.replace(VAR_REGEX, '');
				try {
					var value = JSON.parse(fixed_string);
					return {
						filetype: 'json',
						value: value,
						var_name: var_name,
						filename: filename
					};
				} catch (e) {
					return {
						filetype: 'json',
						filename: filename,
						error: e
					}
				}
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
							// options.warnings.add(filename, 'Could not parse ' + filename + '. Ignoring.')
							throw new Error('Unknown JSON type ' + parsedValue.category);
							// return false;
						}
					}
				});

				parsePromises.push.apply(parsePromises, categoryPromises);
			});
			_.each(parsedValues, function(parsedValue) {
				if(parsedValue.filetype === 'json' && parsedValue.error) {
					var filename = parsedValue.filename;
					options.warnings.add(filename, 'Could not parse JSON file ' + filename + '. Ignoring. (' + parsedValue.error + ')')
				}
			});
			return parsedValues;
		}
	};
};
