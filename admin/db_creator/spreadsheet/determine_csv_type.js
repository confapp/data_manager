app.factory('DetermineCSVType', ['$q', 'CSVHeaders', function($q, CSVHeaders) {
	var hasHeader = CSVHeaders.hasHeader,
		headers = CSVHeaders.headers,
		pcs_headers = headers.pcs,
		session_headers = headers.session,
		attachment_headers = headers.attachments,
		expected_headers = {
			pcs_files: {
				mandatory: [
					pcs_headers.id,
					pcs_headers.description,
					pcs_headers.title,
					pcs_headers.author_first_name,
					pcs_headers.author_middle_name,
					pcs_headers.author_last_name,
					pcs_headers.author_email_address,
					pcs_headers.author_affiliation_institution,
					pcs_headers.author_affiliation_city,
					pcs_headers.author_affiliation_state,
					pcs_headers.author_affiliation_country
				], optional: [
					pcs_headers.author_id,
					pcs_headers.annotations,
					pcs_headers.author_affiliation_department,
					pcs_headers.type
			]}, session_files: {
				mandatory: [
					session_headers.title,
					session_headers.submissions,
					session_headers.date,
					session_headers.start_time,
					session_headers.end_time
				], optional: [
					session_headers.type,
					session_headers.location
			]}, attachment_files: {
				mandatory: [
				attachment_headers.type,
				attachment_headers.filename,
				attachment_headers.directory,
				attachment_headers.url
				], optional: [
			]}
		};
	function getMissingColumnMessage(headers) {
		var headerNames = headers.map(function(x) { return "'"+x+"'"; });
		if(headerNames.length === 1) {
			return "Missing column " + headerNames[0];
		} else if(headerNames.length === 2) {
			return "Missing columns " + headerNames[0] + " and " + headerNames[1];
		} else {
			return "Missing columns " + headerNames.slice(0, headerNames.length-1).join(", ") + ", and " + headerNames[headerNames.length-1];
		}
	}
	return {
		determineCSVType: function(options, rows, filename) {
			var warnings = options.warnings,
				startingRowNum,
				row,
				callback_value = {
					type: "csv",
					filename: filename
				},
				row;

			if(!_.isArray(rows)) { // if it's an xlsx with multiple sheets just use the first one
				var firstKey;
				for(var key in rows) {
					if(rows.hasOwnProperty(key)) {
						firstKey = key;
						break;
					}
				}
				rows = rows[firstKey];
			}

			for(startingRowNum = 0; startingRowNum<rows.length; startingRowNum++) {
				// some files skip the first row, so increment which row is being used if the second cell is empty
				row = rows[startingRowNum];

				if(row.length > 2) {
					break;
				}
			}

			if(hasHeader(row, pcs_headers.id) && hasHeader(row, pcs_headers.author_first_name)) {
				callback_value.category = "pcs_files";
			} else if(hasHeader(row, session_headers.submissions)) {
				callback_value.category = "session_files";
			} else if(hasHeader(row, attachment_headers.directory)) {
				callback_value.category = "attachment_files";
			} else {
				throw new Error("Could not find expected column headers in "+filename);
			}

			if(callback_value && callback_value.category) {
				var exp_headers = expected_headers[callback_value.category],
					mandatory_headers = exp_headers.mandatory,
					optional_headers = exp_headers.optional,
					missing_mandatory_headers = _.filter(mandatory_headers, function(header) {
						return !hasHeader(row, header);
					});

				if(missing_mandatory_headers.length > 0) {
					throw new Error(getMissingColumnMessage(_.pluck(missing_mandatory_headers, 1)) + " in " + filename);
				} else {
					var missing_optional_headers = _.filter(optional_headers, function(header) {
						return !hasHeader(row, header);
					});
					if(missing_optional_headers.length > 0) {
						warnings.add(filename, getMissingColumnMessage(_.pluck(missing_optional_headers, 1)));
					}
				}
			}

			return callback_value;
		}
	};
}]);