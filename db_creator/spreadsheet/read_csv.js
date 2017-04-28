app.factory('CSVReader', CSVReader);

CSVReader.$inject=['$q', 'CSVHeaders', 'DetermineCSVType', 'ParseCSVAttachments', 'ParseCSVPapers', 'ParseCSVSessions'];
function CSVReader($q, CSVHeaders, DetermineCSVType, ParseCSVAttachments, ParseCSVPapers, ParseCSVSessions) {
	var CATEGORY_PARSE_ORDER = ['pcs_files', 'session_files', 'attachment_files'];

	return {
		parseCSV: function(options, uri, filename) {
			return $q(function(resolve, reject) {
					Papa.parse(uri, {
						download: true,
						complete: function(results) {
							resolve(results);
						},
						error: function(err) {
							reject(err);
						}
					});
			}).then(function(parsedResult) {
				return parsedResult.data;
			}).then(function(data) {
				var csvType = DetermineCSVType.determineCSVType(options, data, filename),
					category = csvType.category;

				return {
					filetype: 'csv',
					filename: filename,
					category: category,
					data: data
				};
			});
		},
		handleParsedCSVs: function(options, parsedValues) {
			var parsePromises = [];

			_.each(CATEGORY_PARSE_ORDER, function(category) {
				var categoryPromises = _.map(parsedValues, function(parsedValue) {
					if(parsedValue.filetype === 'csv' && parsedValue.category === category) {
						var filename = parsedValue.filename;
						if(category === 'pcs_files') {
							return ParseCSVPapers.parseCSVPapers(options, parsedValue.data, parsedValue.filename);
						} else if(category === 'session_files') {
							return ParseCSVSessions.parseCSVSessions(options, parsedValue.data, parsedValue.filename);
						} else if(category === 'attachment_files') {
							return ParseCSVAttachments.parseCSVAttachments(options, parsedValue.data, parsedValue.filename);
						} else {
							throw new Error('Unknown CSV type ' + parsedValue.category);
							// return false;
						}
					}
				});

				parsePromises.push.apply(parsePromises, categoryPromises);
			});

			_.each(parsedValues, function(parsedValue) {
				if(parsedValue.filetype === 'csv' && parsedValue.error) {
					var filename = parsedValue.filename;
					options.warnings.add(filename, 'Could not parse CSV file ' + filename + '. Ignoring. (' + e + ')')
				}
			});

			return parsedValues;
		}
	};
};