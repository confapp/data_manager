app.factory('ParseCSVPapers', [
	'CSVHeaders',
	'DataTypes',
	'WarningList',
	function(CSVHeaders, DataTypes, WarningList) {
		return {
			parseCSVPapers: function(options, data, filename) {
				var warnings = options.warnings,
					annotations = options.annotations,
					conference = options.conference,
					objects = CSVHeaders.dataToObjects(data, CSVHeaders.headers.pcs),
					presentation_types = options.presentationTypes,
					get_or_put_institution = _.bind(options.getOrPutInstitution, options),
					get_or_put_person = _.bind(options.getOrPutPerson, options),
					rowOffset = CSVHeaders.getRowOffset(data),
					defaultType = filename.replace(/\.csv/gi, '');

				_.each(objects, function(obj, x) {
					var rowNum = x + rowOffset,
						annos = [],
						people = [],
						type = obj.get1("type") || defaultType,
						demonyms = presentation_types[type] || {eventDemonym: "", personDemonym: "", duration: false};

					var author_ids = obj.getArray("author_id"),
						first_names = obj.getArray("author_first_name"),
						middle_names = obj.getArray("author_middle_name"),
						last_names = obj.getArray("author_last_name"),
						emails = obj.getArray("author_email_address"),
						affiliation_departments = obj.getArray("author_affiliation_department"),
						affiliation_institutions = obj.getArray("author_affiliation_institution"),
						affiliation_cities = obj.getArray("author_affiliation_city"),
						affiliation_states = obj.getArray("author_affiliation_state"),
						affiliation_countries = obj.getArray("author_affiliation_country"),
						secondary_affiliation_departments = obj.getArray("secondary_author_affiliation_department"),
						secondary_affiliation_institutions = obj.getArray("secondary_author_affiliation_institution"),
						secondary_affiliation_cities = obj.getArray("secondary_author_affiliation_city"),
						secondary_affiliation_states = obj.getArray("secondary_author_affiliation_state"),
						secondary_affiliation_countries = obj.getArray("secondary_author_affiliation_country");

					_.each(author_ids, function(author_id, index) {
						if(!first_names[index]) {
							return;
						}

						var institution_1_info = {
									department: affiliation_departments[index],
									institution: affiliation_institutions[index],
									city: affiliation_cities[index],
									state: affiliation_states[index],
									country: affiliation_countries[index]
								},
								institution_2_info = {
									department: secondary_affiliation_departments[index],
									institution: secondary_affiliation_institutions[index],
									city: secondary_affiliation_cities[index],
									state: secondary_affiliation_states[index],
									country: secondary_affiliation_countries[index]
								},
								institution_infos = [],
								institutions, person_info, person;

						if(institution_1_info.institution) { institution_infos.push(institution_1_info); }
						if(institution_2_info.institution) { institution_infos.push(institution_2_info); }

						var name = middle_names[index] ? first_names[index] + " " + middle_names[index] + " " + last_names[index] :
															 first_names[index] + " " + last_names[index];

						var institutions = institution_infos.map(function(ii) {
								return get_or_put_institution(ii);
							}),
							person_info = {
								id: author_id,
								given: first_names[index],
								middle: middle_names[index],
								last: last_names[index],
								name: name,
								email: emails[index],
								institutions: institutions
							};

						if(!person_info.id) {
							person_info.id = person_info.email || person_info.given+person_info.middle+person_info.last;
							warnings.add(fname, "Could not find author ID", rowNum);
						}
						var person = get_or_put_person(person_info);
						people.push(person);
					});

					if(annotations) {
						var annotationStr = obj.get1("annotations");
						if(annotationStr) {
							_.each(annotationStr.split(","), function(annotation_name) {
								if(annotations.hasOwnProperty(annotation_name)) {
									var anno = annotations[annotation_name];
									annos.push(anno);
									anno.markAsUsed();
								} else {
									warnings.add(filename, "Could not find annotation '"+annotation_name+"'", rowNum, WarningList.warningType.MISSING_ANNOTATION, {annotation: annotation_name});
								}
							});
						}
					}

					var submission_info = {
						authors: people,
						description: obj.get1("description") || "",
						short_description: obj.get1("short_description") || "",
						annotations: annos,
						unique_id: obj.get1("id").trim(),
						type: type,
						event_demonym: demonyms.eventDemonym,
						person_demonym: demonyms.personDemonym,
						title: obj.get1("title"),
						duration: demonyms.duration
					};

					var submission = new DataTypes.SubEvent(submission_info);
					if(submission.unique_id) {
						options.submissions[submission.unique_id] = submission;
					}
				});
			}
		}
	}
]);
/*
var data_type = require('../data_types'),
	my_date_offset = (new Date()).getTimezoneOffset() * 60,
	_ = require('underscore'),
	path = require('path'),
	csv_headers = require('./csv_headers'),
	warningType = require('../warnings').warningType,
	extract_parts = function(id, row, cols) {
		var rv = {},
			len = cols.length,
			i = 0,
			col;

		for(; i<len; i++) {
			col = cols[i];
			rv[col.replace("??", "").replace("  ", " ").trim()]  = row[col.replace("??", id)];
		}
		return rv;
	};

function handle_csv_data(contents, options, submissions, fname) {
	var warnings = options.warnings,
		annotations = options.annotations,
		conference = options.conference,
		objects = csv_headers.dataToObjects(contents, csv_headers.headers.pcs),
		presentation_types = options.presentation_types,
		get_or_put_institution = options.get_or_put_institution,
		get_or_put_person = options.get_or_put_person,
		rowOffset = csv_headers.getRowOffset(contents),
		defaultType = path.basename(fname, path.extname(fname));

	_.each(objects, function(obj, x) {
		var rowNum = x + rowOffset,
			annos = [],
			people = [],
			type = obj.get1("type") || defaultType,
			demonyms = presentation_types[type] || {event_demonym: "", person_demonym: "", duration: false};

		var author_ids = obj.getArray("author_id"),
			first_names = obj.getArray("author_first_name"),
			middle_names = obj.getArray("author_middle_name"),
			last_names = obj.getArray("author_last_name"),
			emails = obj.getArray("author_email_address"),
			affiliation_departments = obj.getArray("author_affiliation_department"),
			affiliation_institutions = obj.getArray("author_affiliation_institution"),
			affiliation_cities = obj.getArray("author_affiliation_city"),
			affiliation_states = obj.getArray("author_affiliation_state"),
			affiliation_countries = obj.getArray("author_affiliation_country"),
			secondary_affiliation_departments = obj.getArray("secondary_author_affiliation_department"),
			secondary_affiliation_institutions = obj.getArray("secondary_author_affiliation_institution"),
			secondary_affiliation_cities = obj.getArray("secondary_author_affiliation_city"),
			secondary_affiliation_states = obj.getArray("secondary_author_affiliation_state"),
			secondary_affiliation_countries = obj.getArray("secondary_author_affiliation_country");

		_.each(author_ids, function(author_id, index) {
			if(!first_names[index]) {
				return;
			}

			var institution_1_info = {
						department: affiliation_departments[index],
						institution: affiliation_institutions[index],
						city: affiliation_cities[index],
						state: affiliation_states[index],
						country: affiliation_countries[index]
					},
					institution_2_info = {
						department: secondary_affiliation_departments[index],
						institution: secondary_affiliation_institutions[index],
						city: secondary_affiliation_cities[index],
						state: secondary_affiliation_states[index],
						country: secondary_affiliation_countries[index]
					},
					institution_infos = [],
					institutions, person_info, person;

			if(institution_1_info.institution) { institution_infos.push(institution_1_info); }
			if(institution_2_info.institution) { institution_infos.push(institution_2_info); }

			var name = middle_names[index] ? first_names[index] + " " + middle_names[index] + " " + last_names[index] :
												 first_names[index] + " " + last_names[index];

			var institutions = institution_infos.map(function(ii) {
					return get_or_put_institution(ii);
				}),
				person_info = {
					id: author_id,
					given: first_names[index],
					middle: middle_names[index],
					last: last_names[index],
					name: name,
					email: emails[index],
					institutions: institutions
				};

			if(!person_info.id) {
				person_info.id = person_info.email || person_info.given+person_info.middle+person_info.last;
				warnings.add(fname, "Could not find author ID", rowNum);
			}
			var person = get_or_put_person(person_info);
			people.push(person);
		});

		if(annotations) {
			var annotationStr = obj.get1("annotations");
			if(annotationStr) {
				_.each(annotationStr.split(","), function(annotation_name) {
					var i = 0,
						len = annotations.length,
						anno, found = false;
					for(;i<len; i++) {
						anno = annotations[i];
						if(anno.name === annotation_name) {
							found = true;
							annos.push(anno);
							anno.isUsed = true;
							break;
						}
					}
					if(!found) {
						warnings.add(fname, "Could not find annotation '"+annotation_name+"'", rowNum, warningType.MISSING_ANNOTATION, {annotation: annotation_name});
					}
				});
			}
		}

		var submission_info = {
			authors: people,
			description: obj.get1("description") || "",
			short_description: obj.get1("short_description") || "",
			annotations: annos,
			unique_id: obj.get1("id").trim(),
			type: type,
			event_demonym: demonyms.event,
			person_demonym: demonyms.person,
			title: obj.get1("title"),
			duration: demonyms.duration
		};

		var submission = new data_type.SubEvent(submission_info);
		if(submission.unique_id) {
			submissions[submission.unique_id] = submission;
		}
	});
}

exports.read_pcs_files = function(filenames, options) {
	return new Promise(function(resolve, reject) {
		var submissions = {};
		_.each(filenames, function(fname) {
			handle_csv_data(options.contents[fname], options, submissions, fname);
		});
		resolve(submissions);
	});
};

*/