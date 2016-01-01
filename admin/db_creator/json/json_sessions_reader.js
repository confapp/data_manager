var read_json = require('./read_json').read_json,
	data_type = require('../data_types'),
	my_date_offset = (new Date()).getTimezoneOffset() * 60,
	_ = require('underscore');

function handle_json_data(data, sessions, schedule, options, fname) {
	var get_or_put_person = options.get_or_put_person,
		get_or_put_institution = options.get_or_put_institution,
		annotations = options.annotations,
		conference = options.conference,
		locations = options.locations,
		session_types = options.session_types,
		submissions = options.submissions,
		location_map = options.location_map,
		warnings = options.warnings,
		unique_id, session_info;

	_.each(data, function(session_info, unique_id) {
		var location = false,
			loc = location_map[session_info.room],
			submission_ids = session_info.submissions,
			num_submissions = submission_ids.length,
			session_submissions = [],
			submission_id,
			date_problem, session_info, session;

		var session_submissions = _	.chain(session_info.submissions)
									.map(function(submission_id) {
										if(_.has(submissions, submission_id)) {
											return submissions[submission_id];
										} else {
											addWarning(fname, "Could not find submission with ID '" + submission_id + "'");
										}
									})
									.compact()
									.value();
		date_problem = !Date.parse(row["Date"]);
		if(date_problem) {
			warnings.add(fname, "Could not parse date '" + row["Date"] + "'. Try using the format MMM DD, YYYY (e.g. Apr 29, 2013)", i);
		} else {
			if(!Date.parse(row["Date"] + " " + row["Start Time"])) {
				warnings.add(fname, "Could not parse time '" + row["Time"] + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)", i);
			}

			if(!Date.parse(row["Date"] + " " + row["End Time"])) {
				warnings.add(fname, "Could not parse end time '" + row["Time"] + "'. Try using the format HH:MM AM/PM (e.g. 1:00 PM)", i);
			}
		}

		var type = session_info.type,
			title = session_info.s_title;

		var demonyms = session_types[type] || {event_demonym: "", person_demonym: ""};

		title = title.replace("&amp;", "&").replace("&nbsp;", " ").replace(/^[a-zA-Z\s\.]+:\s*/, "").trim();
		//console.log(type, conference.demonyms[type]);

		var chairs = [];
		if(session_info.chair) {
			var last_name = session_info.chair.slice(session_info.chair.lastIndexOf(" ")).trim();
			var first_name = session_info.chair.slice(0, session_info.chair.indexOf(" ")).trim();

			var chair_info = {
				id: session_info.chair,
				given: first_name,
				middle: "",
				last: last_name,
				name: session_info.chair,
				institutions: []
			};
			var chair;
			if(options.people[session_info.chair]) {
				chair = options.people[session_info.chair];
			} else {
				chair = get_or_put_person(chair_info);
			}

			chairs.push(chair);
			//}
		/*
			console.log(session_info.chair);
			var institution_info = {
					institution: row["Chair Affiliation"]
				},
				institution = new data_type.Institution(institution_info);

			
			var chair_id = row["Chair ID"] || undefined;
			var chair_info = {
				id: chair_id,
				given: row["Chair First Name"],
				middle: "",
				last: row["Chair Last Name"],
				name: row["Chair First Name"] + " " + row["Chair Last Name"],
				institutions: [institution]
			},
			chair = get_or_put_person(chair_info);
			chairs.push(chair);
			*/
		}

		session_info = {
			location: loc,
			unique_id: unique_id,
			title: title,
			submissions: session_submissions,
			type: type,
			event_demonym: demonyms.event,
			person_demonym: demonyms.person,
			chairs: chairs

			//start: Math.round(Date.parse(row["Date"] + " " + row["Start Time"])/1000)-conference.utc_offset * 60 * 60 - my_date_offset,
			//end: Math.round(Date.parse(row["Date"] + " " + row["End Time"])/1000)-conference.utc_offset * 60 * 60 - my_date_offset,
		}

		session = new data_type.Event(session_info);
		sessions[session.unique_id] = session;
		schedule.push(session);
	});
}

exports.read_sessions = function(filenames, options, callback) {
	return new Promise(function(resolve, reject) {
		var sessions = {},
			schedule = [];

		_.each(filenames, function(fname) {
			var data = options.contents[fname];
			handle_json_data(data, sessions, schedule, options, fname);
		});
		
		resolve({
			sessions: sessions,
			schedule: schedule
		});
	});
};
