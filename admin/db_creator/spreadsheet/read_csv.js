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
							reject(new Error(err));
						}
					});
			}).then(function(parsedResult) {
				return parsedResult.data;
			}).then(function(data) {
				var csvType = DetermineCSVType.determineCSVType(options, data, filename),
					category = csvType.category;

				return {
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
					if(parsedValue.category === category) {
						var filename = parsedValue.filename;
						if(category === 'pcs_files') {
							return ParseCSVPapers.parseCSVPapers(options, parsedValue.data, parsedValue.filename);
						} else if(category === 'session_files') {
							return ParseCSVSessions.parseCSVSessions(options, parsedValue.data, parsedValue.filename);
						} else if(category === 'attachment_files') {
							return ParseCSVAttachments.parseCSVAttachments(options, parsedValue.data, parsedValue.filename);
						} else {
							throw new Error('Unknown CSV type ' + parsedValue.category);
						}
					}
				});

				parsePromises.push.apply(parsePromises, categoryPromises);
			});
			//return $q.all(parsePromises);
		}
	};
};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
