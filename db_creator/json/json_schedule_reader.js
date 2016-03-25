app.factory('ParseJSONSchedule', [
	'WarningList',
	'DataTypes',
	'UNIXTime',
	function(WarningList, DataTypes, UNIXTime) {
		return {
			parseJSONSchedule: function(options, data, filename) {
				var sessions = options.sessions,
					annotaitons = options.annotations,
					location_map = options.locations,
					submissions = options.submissions,
					addWarning = options.addWarning,
					schedule = options.schedule,
					timezone = options.timezone;

				_.each(data, function(day) {
					var date = day.date,
						stripped_date = date.replace("th", "").replace("st", "").replace("nd", "").replace("rd", "");
					_.each(day.slots, function(slot) {
						var time = slot.time,
							times = time.split("-"),
							start_time = stripped_date + " " + times[0].trim(),
							end_time = stripped_date + " " + times[1].trim();

						date_problem = !Date.parse(stripped_date);
						if(date_problem) {
							warnings.add(filename, "Could not parse date '" + date + "'. Try using the format MMM DD, YYYY (e.g. Apr 29, 2013)");
						} else {
							if(!Date.parse(start_time)) {
								warnings.add(filename, "Could not parse time '" + start_time + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)");
							}

							if(!Date.parse(end_time)) {
								warnings.add(filename, "Could not parse end time '" + end_time + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)");
							}
						}

						var format = "MMMM D, YYYY HH:mm:ss",
							start_tstamp = UNIXTime.getUnixTime(start_time, timezone, format),
							end_tstamp = UNIXTime.getUnixTime(end_time, timezone, format),
							start = start_tstamp.unix(),
							end = end_tstamp.unix(),
							offset = start_tstamp._offset;

						_.each(slot.sessions, function(session_info) {
							var unique_id = session_info.session,
								session = sessions[unique_id],
								session_info_clone = _.extend({}, session),
								loc = location_map[session_info.room];

							session_info_clone.location = session_info_clone.location || loc;
							session_info_clone.start = start;
							session_info_clone.end = end;
							session_info_clone.offset = offset;

							schedule.push(new DataTypes.Event(session_info_clone));
						});
					});
				});
			}
		};
	}
]);
/*

var read_json = require('./read_json').read_json,
	data_type = require('../data_types'),
	moment = require('moment-timezone'),
	my_date_offset = (new Date()).getTimezoneOffset() * 60,
	obj_clone = function(obj) {
		var new_obj = {}, key, val;
		for(key in obj) {
			if(obj.hasOwnProperty(key)) {
				val = obj[key];
				new_obj[key] = val;
			}
		}
		return new_obj;
	},
	_ = require('underscore');

function handle_json_data(data, schedule, options, fname) {
	var sessions = options.sessions,
		annotaitons = options.annotations,
		conference = options.conference,
		location_map = options.location_map,
		submissions = options.submissions,
		addWarning = options.addWarning,
		timezone = conference.timezone;

	_.each(data, function(day) {
		var date = day.date,
			stripped_date = date.replace("th", "").replace("st", "").replace("nd", "").replace("rd", "");
		_.each(day.slots, function(slot) {
			var time = slot.time,
				times = time.split("-"),
				start_time = stripped_date + " " + times[0].trim(),
				end_time = stripped_date + " " + times[1].trim();

			date_problem = !Date.parse(stripped_date);
			if(date_problem) {
				addWarning(fname, "Could not parse date '" + date + "'. Try using the format MMM DD, YYYY (e.g. Apr 29, 2013)");
			} else {
				if(!Date.parse(start_time)) {
					addWarning(fname, "Could not parse time '" + start_time + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)");
				}

				if(!Date.parse(end_time)) {
					addWarning(fname, "Could not parse end time '" + end_time + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)");
				}
			}

			var format = "MMMM D, YYYY HH:mm:ss";

			var start_tstamp = moment.tz(start_time, format, timezone),
				end_tstamp = moment.tz(end_time, format, timezone),
				start = start_tstamp.unix(),
				end = end_tstamp.unix(),
				offset = start_tstamp._offset;

			_.each(slot.sessions, function(session_info) {
				var unique_id = session_info.session,
					session = sessions[unique_id],
					session_info_clone = obj_clone(session),
					loc = location_map[session_info.room];

				session_info_clone.location = session_info_clone.location || loc;
				session_info_clone.start = start;
				session_info_clone.end = end;
				session_info_clone.offset = offset;

				schedule.push(new data_type.Event(session_info_clone));
			});
		});
	});
}

exports.read_schedule = function(filenames, options) {
	var schedule = [],
		json_data = _.map(filenames, function(fname) {
			var data = options.contents[fname];
			handle_json_data(data, schedule, options, fname);
		});

	return Promise	.all(json_data)
					.then(function() {
						return schedule;
					});
};

*/