app.factory('CSVHeaders', function() {
	var headers = {
			pcs: {
				id: [/^ID$/i, "ID"],
				description: [/(^Abstract)|(^Description)/i, "Abstract"],
				short_description: [/(^Contribution)|(^Short Description)/i, "Short Description"],
				title: [/^Title$/i, "Title"],
				type: [/^Type/i, "Type"],
				author_id: [/Author ID \d+/i, "Author ID 1"],
				author_first_name: [/(Author given first name)|(Author given name or first name) \d+/i, "Author given first name 1"],
				author_middle_name: [/Middle initial or name \d+/i, "Middle initial or name 1"],
				author_last_name: [/(Author last\/family name)|(Author last name or family name) \d+/i, "Author last/family name 1"],
				author_email_address: [/(Valid )?email address \d+/i, "Valid email address 1"],
				author_affiliation_department: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*\d+ - Department\/School\/Lab/i, "Primary Affiliation 1 - Department/School/Lab"],
				author_affiliation_institution: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*\d+ - Institution/i, "Primary Affiliation 1 - Institution"],
				author_affiliation_city: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*\d+ - City/i, "Primary Affiliation 1 - City"],
				author_affiliation_state: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*\d+ - State or Province/i, "Primary Affiliation 1 - State or Province"],
				author_affiliation_country: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*\d+ - Country/i, "Primary Affiliation 1 - Country"],
				secondary_author_affiliation_department: [/Secondary Affiliation\s+(\(optional\))?\s*(\((\w|\s)+\))?\s*\d+ - Department\/School\/Lab/i, "Secondary Affiliation 1 - Department/School/Lab"],
				secondary_author_affiliation_institution: [/Secondary Affiliation\s+(\(optional\))?\s*(\((\w|\s)+\))?\s*\d+ - Institution/i, "Secondary Affiliation 1 - Institution"],
				secondary_author_affiliation_city: [/Secondary Affiliation\s+(\(optional\))?\s*(\((\w|\s)+\))?\s*\d+ - City/i, "Secondary Affiliation 1 - City"],
				secondary_author_affiliation_state: [/Secondary Affiliation\s+(\(optional\))?\s*(\((\w|\s)+\))?\s*\d+ - State or Province/i, "Secondary Affiliation 1 - State or Province"],
				secondary_author_affiliation_country: [/Secondary Affiliation\s+(\(optional\))?\s*(\((\w|\s)+\))?\s*\d+ - Country/i, "Secondary Affiliation 1 - Country"],
				annotations: [/(Award(s)?)|(Annotation(s)?)/i, "Awards"]
			},
			session: {
				id: [/^ID$/i, "ID"],
				title: [/^Title$/i, "Title"],
				type: [/^Type/i, "Type"],
				submissions: [/^(Submissions)|(Submission IDs)/i, "Submissions"],
				date: [/^Date/i, "Date"],
				start_time: [/^(Start )?Time/i, "StartTime"],
				end_time: [/^End Time/i, "End Time"],
				location: [/^Location/i, "Location"],
				chair: [/^Chair(\(s\))?/i, "Chair"],
				chair_id: [/Chair ID( \d+)?/i, "Chair ID 1"],
				chair_first_name: [/(Chair given first name)|(Chair given name or first name) \d+/i, "Chair given first name 1"],
				chair_middle_name: [/Chair middle initial or name \d+/i, "Chair middle initial or name 1"],
				chair_last_name: [/(Chair last\/family name)|(Chair last name or family name) \d+/i, "Chair last/family name 1"],
				chair_email_address: [/(Valid )?email address \d+/i, "Valid email address 1"],
				chair_affiliation_department: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*(\d+)? - Department\/School\/Lab/i, "Primary Affiliation 1 - Department/School/Lab"],
				chair_affiliation_institution: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*(\d+)? - Institution/i, "Primary Affiliation 1 - Institution"],
				chair_affiliation_city: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*(\d+)? - City/i, "Primary Affiliation 1 - City"],
				chair_affiliation_state: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*(\d+)? - State or Province/i, "Primary Affiliation 1 - State or Province"],
				chair_affiliation_country: [/Primary Affiliation\s+(\((\w|\s)+\))?\s*(\d+)? - Country/i, "Primary Affiliation 1 - Country"],
			}, attachments: {
				id: [/^ID/i, "ID"],
				type: [/^Type/i, "Type"],
				filename: [/^Filename/i, "Filename"],
				directory: [/^Directory/i, "Directory"],
				url: [/^URL/i, "URL"]
			}
	};
	function RowObject(obj) {
		this.obj = obj;
	}
	RowObject.prototype.get1 = function() {
		var value = this.get.apply(this, arguments);
		return _.isArray(value) ? value[0] : value;
	};
	RowObject.prototype.getArray = function() {
		var value = this.get.apply(this, arguments);
		return _.isArray(value) ? value : [value];
	};
	RowObject.prototype.get = function(fieldName) {
		return this.obj[fieldName];
	};

	function getHeaderIndex(header_row, header_info) {
		var regex = header_info[0],
			i = 0,
			len = header_row.length,
			matches = [];

		for(; i<len; i++) {
			if(header_row[i].match(regex)) {
				matches.push(i);
			}
		}

		if(matches.length === 0) {
			return -1;
		} else if(matches.length === 1) {
			return matches[0];
		} else {
			return matches;
		}
	}
	function getHeaderIndicies(row, headerList) {
		var rv = {};
		_.each(headerList, function(headerInfo, key) {
			var index = getHeaderIndex(row, headerInfo);
			rv[key] = index;
		});
		return rv;
	}
	return {
		headers: headers,
		getHeaderIndicies: getHeaderIndicies,
		hasHeader: function(header_row, header_info) {
			var regex = header_info[0],
				i = 0,
				len = header_row.length;

			for(; i<len; i++) {
				if(header_row[i].match(regex)) {
					return true;
				}
			}
			return false;
		},
		dataToObjects: function(rows, headerList) {
			var headerRow,
				len = rows.length,
				i = 0;

			for(; i<len; i++) {
				row = rows[i];
				if(row.length > 2) {
					headerRow = row;
					i++; // so the next search doesn't catch
					break;
				}
			}

			var headerIndicies = getHeaderIndicies(headerRow, headerList),
				rv = [],
				row,
				foundFirstDataRow = false,
				rowToObject = function(row) {
					var obj = {};
					_.each(headerIndicies, function(index, key) {
						if(_.isArray(index)) {
							obj[key] = _.map(index, function(i) {
								return row[i];
							});
						} else if(_.isNumber(index)) {
							obj[key] = row[index];
						}
					});
					return new RowObject(obj);
				};

			for(; i<len; i++) {
				row = rows[i];
				if(!foundFirstDataRow) {
					if(row.length > 2) {
						foundFirstDataRow = true;
					} else {
						continue;
					}
				}

				rv.push(rowToObject(row, headerIndicies));
			}

			return rv;
		},
		getRowOffset: function(rows) {
			var numFoundRows = 0,
				len = rows.length,
				i = 0;

			for(; i<len; i++) {
				row = rows[i];
				if(row.length > 2) {
					numFoundRows++;
					if(numFoundRows >= 2) {
						return i;
					}
				}
			}
			return -1;
		}
	};
});