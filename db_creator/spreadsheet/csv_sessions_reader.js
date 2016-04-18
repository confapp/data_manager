app.factory('ParseCSVSessions', [
	'CSVHeaders',
	'WarningList',
	'DataTypes',
	'UNIXTime',
	function(CSVHeaders, WarningList, DataTypes, UNIXTime) {
		return {
			parseCSVSessions: function(options, data, filename) {
				var my_date_offset = (new Date()).getTimezoneOffset() * 60;

				var annotations = options.annotations,
					conference = options.conference,
					sessions = options.sessions,
					location_map = options.locations,
					submissions = options.submissions,
					schedule = options.schedule,
					get_or_put_institution = _.bind(options.getOrPutInstitution, options),
					get_or_put_person = _.bind(options.getOrPutPerson, options),
					warnings = options.warnings,
					rowOffset = CSVHeaders.getRowOffset(data),
					objects = CSVHeaders.dataToObjects(data, CSVHeaders.headers.session),
					session_types = options.sessionTypes,
					timezone = options.timezone,
					missingLocations = options.missingLocations,
					defaultType = filename.replace(/\.csv/gi, '');

				_.each(objects, function(obj, index) {
					var location = obj.get1('location'),
						loc = location_map[location],
						rowNum = index + rowOffset,
						session_submissions = [];

					if(!loc) {
						missingLocations[location] = true;
						warnings.add(filename, "Could not find location '" + location + "'.", rowNum, WarningList.warningType.MISSING_LOCATION, {location: location});
					}

					var session_submissions_ids = obj.get1("submissions");
					var session_submissions_arr = session_submissions_ids ? session_submissions_ids.split(",") : [];

					_.each(session_submissions_arr, function(submission_id) {
						var submission = submissions[submission_id.trim()];

						if(submission) {
							session_submissions.push(submission);
						} else {
							warnings.add(filename, "Could not find submission '"+submission_id+"'", rowNum);
						}
					});

					var chairs = [];
					if(obj.get1("chair_first_name")) {
						var institution_info = {
								institution: obj.get1("chair_affiliation_institution")
							},
							institution = get_or_put_institution(institution_info);

						var chair_id = obj.get1("chair_id");
						var chair_info = {
								id: chair_id,
								given: obj.get1("chair_first_name"),
								middle: obj.get1("chair_middle_name"),
								last: obj.get1("chair_last_name"),
								name: obj.get1("chair_first_name") + " " + obj.get1("chair_last_name"),
								institutions: [institution]
							},
							chair = get_or_put_person(chair_info);
						chairs.push(chair);
					} else if(obj.get1("chair")) {
						var names = obj.get1("chair").split(" "),
							chair_info;
						if(names.length <= 2) {
							chair_info = {
								name: obj.get1("chair"),
								given: names[0],
								last: names[1],
								middle: "",
								institutions: []
							};
						} else {
							chair_info = {
								name: obj.get1("chair"),
								given: names[0],
								middle: names.slice(1, names.length-1).join(" "),
								last: _.last(names),
								institutions: []
							};
						}

						chair = get_or_put_person(chair_info);
						chairs.push(chair);
					}

					var type = obj.get1("type") || defaultType,
						demonyms = session_types[type] || {eventDemonym: "", personDemonym: ""};

					var date = obj.get1("date"),
						start_time = date + " " + obj.get1("start_time"),
						end_time = date + " " + obj.get1("end_time"),
						date_problem = !Date.parse(date);

					if(date_problem) {
						warnings.add(filename, "Could not parse date '" + date + "'. Ignoring this row. Try using the format MMM DD, YYYY (e.g. Apr 29, 2013)", rowNum);
						return;
					} else {
						if(!Date.parse(start_time)) {
							warnings.add(filename, "Could not parse time '" + obj.get1("start_time") + "'. Ignoring this row. Try using the format HH:MM AM/PM (e.g. 1:00 PM)", rowNum);
							return;
						}

						if(!Date.parse(end_time)) {
							warnings.add(filename, "Could not parse end time '" + obj.get1("end_time") + "'. Ignoring this row. Try using the format HH:MM AM/PM (e.g. 1:00 PM)", rowNum);
							return;
						}
					}

					var start_tstamp = UNIXTime.getUnixTime(start_time, timezone),
						end_tstamp = UNIXTime.getUnixTime(end_time, timezone),
						start = start_tstamp.isValid() ? start_tstamp.unix() : -1,
						end = end_tstamp.isValid() ? end_tstamp.unix() : -1,
						offset = start_tstamp._offset || 0;

					session_info = {
						location: loc,
						unique_id: obj.get1("id") || "session_" + _.keys(sessions).length,
						title: obj.get1("title"),
						submissions: session_submissions,
						type: type,
						event_demonym: demonyms.eventDemonym,
						person_demonym: demonyms.personDemonym,
						start: start,
						end: end,
						offset: offset,
						chairs: chairs
					};

					session = new DataTypes.Event(session_info);
					sessions[session.unique_id] = session;
					schedule.push(session);
				});
			}
		}
	}
]);