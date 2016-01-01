var parse_csv = require('./spreadsheet/read_csv.js').parse_csv,
	read_csv_pcs_files = require('./spreadsheet/csv_papers_reader').read_pcs_files,
	read_csv_sessions = require('./spreadsheet/csv_sessions_reader').read_sessions,
	read_csv_attachments = require('./spreadsheet/csv_attachments_reader').read_attachments,

	parse_json = require('./json/read_json.js').read_json,
	read_json_pcs_files = require('./json/json_papers_reader').read_pcs_files,
	read_json_sessions = require('./json/json_sessions_reader').read_sessions,
	read_json_schedule = require('./json/json_schedule_reader').read_schedule,

	determine_csv_type = require('./spreadsheet/determine_csv_type').determine_csv_type,
	determine_json_type = require('./json/determine_json_type').determine_json_type,
	initialize_db = require('./create_tables').initialize_db,
	jsonify_tables= require('./sqlite_to_json').jsonify_tables,
	sqlite3 = require("sqlite3"),
	data_type = require('./data_types'),
	WarningList = require('./warnings').WarningList,
	my_date_offset = (new Date()).getTimezoneOffset() * 60,
	fs = require("fs"),
	_ = require("underscore"),
	log = require('loglevel');

log.setLevel("debug");
var SECperHR = 60*60*24;

exports.generate_db = function(options) {
	var version = options.db_info ? options.db_info.version : "",
		filename = options.db_name + '_' + options.db_info.version,
		sqlite_filename = filename + '.sqlite3',
		json_filename =   filename + '.json',
		unique_persons = {},
		unique_institutions = {},
		session_type_map = {},
		presentation_type_map = {},
		location_map = {},
		submission_map = {};

	_.each(options.locations.rooms, function(room) {
		location_map[room.code_name] = room;
	});

	_.each(options.event_types, function(event_type) {
		var type_map = event_type.type === 'presentation' ?
							presentation_type_map : session_type_map;
		type_map[event_type.code_name] = event_type;
	});

	_.extend(options, {
		warnings: new WarningList(),
		people: unique_persons,
		session_types: session_type_map,
		presentation_types: presentation_type_map,
		get_or_put_person: function(person_options) {
			var id = person_options.id,
				person;

			if((id || id===0) && unique_persons.hasOwnProperty(id)) {
				person = unique_persons[id];
				person.merge(person_options);
			} else {
				person =  new data_type.Person(person_options);
				if(id || id === 0) {
					unique_persons[id] = person
				}
			}

			return person;
		},
		get_or_put_institution: function(institution_options) {
			var id = institution_options.institution,
				institution;
			if(unique_institutions.hasOwnProperty(id)) {
				institution = unique_institutions[id];
				institution.merge(institution_options);
			} else {
				institution = unique_institutions[id] = new data_type.Institution(institution_options);
			}

			return institution;
		},
		location_map: location_map,
		addWarning: function(fname, warningText) {
			options.warnings.push({
				filename: fname,
				text: warningText
			});
		},
		sessions: {},
		schedule: [],
		submissions: {}
	});


		// ========================== DETERMINE TYPES ==========================
	log.debug("...determine types");
	return Promise.all(_.map(options.contents, function(contents, fname) {
			var type = endsWith(fname, ".json") ? 'json' : 'csv',
				var_name = options.var_names[fname],
				promise;

			if(type === 'json') {
				promise = determine_json_type(options, contents, fname, var_name);
			} else {
				promise = determine_csv_type(options, contents, fname);
			}
			return promise.then(function(type_info) {
				var category = type_info.category;

				if(_.has(options, category)) {
					options[category].push(type_info);
				} else if (category === "conference_files") {
					options[category] = type_info;
				} else {
					options[category] = [type_info];
				}
			});
		})
		// ========================== /DETERMINE TYPES ==========================
	).then(function() {
		// ========================== SUBMISSIONS ==========================
		log.debug("...processing submissions");
		var csv_pcs_files = [],
			json_pcs_files = [];

		_.each(options.pcs_files, function(info) {
			if(info.type === "csv") {
				csv_pcs_files.push(info.filename);
			} else if(info.type === "json") {
				json_pcs_files.push(info.filename);
			}
		});

		var csv_promise = read_csv_pcs_files(csv_pcs_files, options).then(function(submissions) {
				_.extend(options.submissions, submissions);
			}),
			json_promise = read_json_pcs_files(json_pcs_files, options).then(function(submissions) {
				_.extend(options.submissions, submissions);
			});

		return Promise	.all([csv_promise, json_promise]);
		// ========================== /SUBMISSIONS ==========================
	}).then(function() {
		// ========================== SESSIONS ==========================
		log.debug("...processing sessions");
		var csv_session_files = [],
			json_session_files = [];

		_.each(options.session_files, function(info) {
			if(info.type === "csv") {
				csv_session_files.push(info.filename);
			} else if(info.type === "json") {
				json_session_files.push(info.filename);
			}
		});


		var csv_promise = read_csv_sessions(csv_session_files, options).then(function(schedule_data) {
				var schedule = schedule_data.schedule,
					sessions = schedule_data.sessions;

				options.schedule.push.apply(options.schedule, schedule);
				_.extend(options.sessions, sessions);
			}),
			json_promise = read_json_sessions(json_session_files, options).then(function(schedule_data) {
				var schedule = schedule_data.schedule,
					sessions = schedule_data.sessions;

				options.schedule.push.apply(options.schedule, schedule);
				_.extend(options.sessions, sessions);
			});

		return Promise.all([csv_promise, json_promise]);
		// ========================== /SESSIONS ==========================
	}).then(function() {
		// ========================== SCHEDULE ==========================
		log.debug("...processing schedule");
		var schedule_filenames = _.pluck(options.schedule_files, "filename");

		return read_json_schedule(schedule_filenames, options).then(function(schedule_data) {
			if(schedule_data.length > 0) {
				options.schedule = schedule_data;
			}
		}).then(function() {
			options.schedule.sort(function(a, b) { return a.start - b.start; });
		});
		// ========================== /SCHEDULE ==========================
	}).then(function() {
		// ========================== ATTACHMENTS ==========================
		log.debug("...processing attachments");
		var csv_attachment_files = _.chain(options.attachment_files)
									.filter(function(info) {
										return info.type === "csv";
									})
									.pluck("filename")
									.value();


		read_csv_attachments(csv_attachment_files, options).then(function(attachment_data) {
			options.attachments = _.extend(options.attachments, attachment_data);
		});
		// ========================== /ATTACHMENTS ==========================
	}).then(function() {
		// ========================== CREATE & INITIALIZE DB ==========================
		log.debug("...create database");
		var db = new sqlite3.Database(sqlite_filename);
		return initialize_db(db);
		// ========================== /CREATE & INITIALIZE DB ==========================
	}).then(function(db) {
		// ========================== ADD CONFERENCE TABLE ==========================
		log.debug("...add conference table");
		return new Promise(function(resolve, reject) {
			var conference = options.conference,
				first_session = _.first(options.schedule),
				last_session = _.last(options.schedule),
				duration = last_session.end - first_session.start,
				utc_offset = first_session.offset,
				start_day = Math.floor((first_session.start+(utc_offset*60))/SECperHR)*SECperHR - (utc_offset*60),
				end_day = Math.floor((last_session.end+(utc_offset*60))/SECperHR)*SECperHR - (utc_offset*60),
				num_days = 1 + (end_day - start_day)/SECperHR;

			db.run("INSERT INTO conference(id, start_day, num_days, name, location, description, utc_offset, update_url, webapp_base_url, data_url, data_sync, vote, reading_list, schedule, note) " +
					"VALUES ($id, $start_day, $num_days, $name, $location, $description, $utc_offset, $update_url, $webapp_base_url, $data_url, $data_sync, $vote, $reading_list, $schedule, $note)", {
				$id: conference.id,
				$start_day: start_day,
				$location: conference.location,
				$description: conference.description,
				$utc_offset: utc_offset,
				$name: conference.name,
				$short_name: conference.short_name,
				$num_days: num_days,
				$update_url: conference.update_url,
				$webapp_base_url: conference.webapp_base_url,
				$data_url: conference.data_url,
				$data_sync: conference.data_sync ? 1 : 0,
				$vote: conference.vote ? 1 : 0,
				$reading_list: conference.reading_list ? 1 : 0,
				$schedule: conference.schedule ? 1 : 0,
				$note: conference.note ? 1 : 0
			}, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve(db);
				}
			});
		});
		// ========================== /ADD CONFERENCE TABLE ==========================
	}).then(function(db) {
		// ========================== ADD LOCATIONS ==========================
		log.debug("...add locations");
		var map_names = {};
		_.each(options.locations.maps, function(map) {
			map_names[map.file] = map.name;
		});

		var promises = _.map(options.locations.rooms, function(room, seq) {
			return new Promise(function(resolve, reject) {
				db.run("INSERT INTO location (name, sequence, map_name, map_file, map_x_pct, map_y_pct) " +
						"VALUES ($name, $seq, $map_name, $file, $x_pct, $y_pct)", {
					$name: room.display,
					$seq: seq,
					$file: room.map_file,
					$x_pct: room.pct_x,
					$y_pct: room.pct_y,
					$map_name: map_names[room.map_file] || ""
				}, function(err) {
					if(err) {
						reject(err);
					} else {
						room.pk = this.lastID;
						resolve();
					}
				});
			});
		});

		return Promise	.all(promises)
						.then(function() {
							return db;
						});
		// ========================== /ADD LOCATIONS ==========================
	}).then(function(db) {
		// ========================== ADD ANNOTATIONS ==========================
		log.debug("...add annotations");
		var promises = _.map(options.annotations, function(annotation, seq) {
			return new Promise(function(resolve, reject) {
				if(annotation.isUsed) {
					db.run("INSERT INTO annotation (name, type, description, icon, sequence) VALUES ($name, $type, $description, $icon, $sequence)", {
						$name: annotation.name,
						$type: annotation.type,
						$description: annotation.description,
						$icon: annotation.icon,
						$sequence: seq
					}, function(err) {
						if(err) {
							reject(err);
						} else {
							annotation.pk = this.lastID;
							resolve();
						}
					});
				} else {
					resolve();
				}
			});
		});

		return Promise	.all(promises)
						.then(function() {
							return db;
						});
		// ========================== /ADD ANNOTATIONS ==========================
	}).then(function(db) {
		// ========================== INSERT DB INFO ==========================
		log.debug("...add db info");
		if(options.db_info) {
			return new Promise(function(resolve, reject) {
				db.run("INSERT INTO db_info(version, last_updated) " +
						"VALUES ($version, $last_updated)", {
					$version: options.db_info.version,
					$last_updated: Math.round((new Date()).getTime()/1000)
				}, function(err) {
					if(err) {
						reject(err);
					} else {
						resolve(db);
					}
				});
			});
		} else {
			return db;
		}
		// ========================== /INSERT DB INFO ==========================
	}).then(function(db) {
		// ========================== INSERT SESSIONS ==========================
		log.debug("...insert sessions");
		var promises = _.map(options.schedule, function(session) {
			return session.do_insert(db, options.conference.utc_offset);
		});

		return Promise	.all(promises)
						.then(function() {
							return db;
						});
		// ========================== /INSERT SESSIONS ==========================
	}).then(function(db) {
		log.debug("...jsonify tables");
		return jsonify_tables(db);
		//return new Promise(function(resolve) {
			//db.close(function() {
				//resolve(json_obj);
			//});
		//});
	}).then(function(json_obj) {
		log.debug("...write json objects");
		// ========================== WRITE JSON OBJECT ==========================
		var jsonp_filename = json_filename+"p",
			remove_promises = [json_filename, jsonp_filename].map(function(filename) {
				return new Promise(function(resolve, reject) {
					fs.exists(filename, function(exists) {
						if(exists) {
							fs.unlink(filename, function(err) {
								if(err) {
									reject(err);
								} else {
									resolve();
								}
							});
						} else {
							resolve();
						}
					});
				});
			});

		return Promise.all(remove_promises).then(function() {
			var stringified_json_obj = JSON.stringify(json_obj);

			var json_promise = new Promise(function(resolve, reject) {
					fs.writeFile(json_filename, stringified_json_obj, function(err) {
						if(err) {
							reject(err);
						} else {
							resolve(json_filename);
						}
					});
				}),
				jsonp_promise = new Promise(function(resolve, reject) {
					fs.writeFile(jsonp_filename, "_cadata_="+stringified_json_obj, function(err) {
						if(err) {
							reject(err);
						} else {
							resolve(jsonp_filename);
						}
					});
				});
			return Promise	.all([json_promise, jsonp_promise])
							.then(function(vals) {
								return {
									sqlite_filename: sqlite_filename,
									json_filename: vals[0],
									jsonp_filename: vals[1],
									version : version,
									warnings: options.warnings.serialize()
								};
							});
		});
		// ========================== /WRITE JSON OBJECT ==========================
	}).then(function(db_info) {
		log.info("SQLite3 file: " + db_info.sqlite_filename);
		log.info("JSON    file: " + db_info.json_filename  );
		log.info("JSONP   file: " + db_info.jsonp_filename );
		log.info("Warnings:");
		log.info("---");
		log.info(db_info.warnings );
		log.info("---");
		return _.extend({
			failed: false,
			errors: []
		}, db_info);
	}, function(err) {
		log.error(err);
		log.error(err.stack);
		return {
			failed: true,
			errors: [err]
		};
	});
};

exports.filenamesToOptions = function(infoFilenames, dataFilenames) {
	var options = {
			contents: {},
			var_names: {}
		},
		info_promises = _.map(infoFilenames, function(fname, type) {
			if(type === "converter") {
				var convert_fn = require(process.cwd() + '/' + fname).convert;
				options[type] = convert_fn;
				return true;
			} else {
				return parse_json(fname).then(function(info) {
					options[type] = info.value;
				});
			}
		}),
		data_promises =  _.map(dataFilenames, function(fname) {
			var promise;
			if(endsWith(fname, 'json')) {
				promise = parse_json(fname);
			} else {
				promise = parse_csv(fname).then(function(data) {
					return {
						value: data,
						var_name: false
					};
				});
			}

			return promise.then(function(info) {
				options.contents[fname] = info.value;
				options.var_names[fname] = info.var_name;
			});
		});

	return Promise	.all(info_promises.concat(data_promises))
					.then(function() {
						return options;
					}, function(err) {
						console.log(err);
					});
};


if(require.main === module) { // called directly
	var	info_filenames = {},
		data_filenames = [],
		db_name = "generated_database";

	_.each(process.argv, function(val, index) {
		if(index === 2) {
			db_name = val;
		} else if(index > 2) {
			if(val.indexOf("=")>=0) {
				var parts = val.split("="),
					type = parts[0];
				fname = parts[1];

				info_filenames[type] = fname;
			} else if(val) {
				fname = val;
				data_filenames.push(fname);
			}
		}
	});


	return exports	.filenamesToOptions(info_filenames, data_filenames)
					.then(function(options) {
						options.db_name = db_name;
						return exports.generate_db(options);
					});
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
