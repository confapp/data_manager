app.factory('ParseJSONPapers', [
	'WarningList',
	'DataTypes',
	function(WarningList, DataTypes) {
		return {
			parseJSONPapers: function(options, data, filename) {
				var get_or_put_institution = _.bind(options.getOrPutInstitution, options),
					get_or_put_person = _.bind(options.getOrPutPerson, options),
					annotations = options.annotations,
					conference = options.conference,
					presentation_types = options.presentationTypes,
					warnings = options.warnings,
					submission, author_name, annos, authors, type, demonyms;

				_.each(data, function(submission_info, unique_id) {
					submission_info = data[unique_id];

					var submission_authors = submission_info.authors;
					if(!submission_authors) {
						submission_authors = [];
					}

					authors = _.map(submission_authors, function(author_info) {
						var institution_info = author_info.primary;
						var institution = get_or_put_institution({
								department: institution_info.dept,
								institution: institution_info.institution,
								city: institution_info.city,
								state: institution_info.location,
								country: institution_info.country
							}),
							split_name = author_info.name.split(" "),
							last_name = author_info.familyName, //split_name[split_name.length-1],
							first_name = author_info.givenName, //split_name[0],
							person = get_or_put_person({
								id: author_info.authorId || author_info.name || author_info.id,
								name: author_info.name,
								institutions: [institution],
								given: first_name,
								last: last_name
							});
						return person;
					});

					type = submission_info.subtype || submission_info.type;

					demonyms = presentation_types[type] || {event_demonym: "", person_demonym: "", duration: false};
					annos = [];
					if(submission_info.award || submission_info.hm) {
						submission_info.award = submission_info.hm ? "honorable" : "best";
						((submission_info.award+"") || "").split(",").forEach(function(annotation_name) {
							if(annotations.hasOwnProperty(annotation_name)) {
								var anno = annotations[annotation_name];
								annos.push(anno);
								anno.markAsUsed();
							} else {
								warnings.add(filename, "Could not find annotation '"+annotation_name+"'", rowNum, WarningList.warningType.MISSING_ANNOTATION, {annotation: annotation_name});
							}
						});
					}

					submission = new DataTypes.SubEvent({
						authors: authors,
						description: submission_info.abstract,
						short_description: submission_info.cAndB || submission_info.abstract.slice(0, 500)+"...",
						annotations: annos,
						unique_id: unique_id.trim(),
						type: type,
						title: submission_info.title,
						duration: demonyms.duration,
						event_demonym: demonyms.event_demonym,
						person_demonym: demonyms.person_demonym,
					});
					options.submissions[submission.unique_id] = submission;
				});
			}
		};
	}
]);
/*

var read_json = require('./read_json').read_json,
	data_type = require('../data_types'),
	_ = require('underscore');

function handle_json_data(data, submissions, options, fname) {
	var get_or_put_institution = _.bind(options.getOrPutInstitution, options),
		get_or_put_person = _.bind(options.getOrPutPerson, options),
		annotations = options.annotations,
		conference = options.conference,
		presentation_types = options.presentation_types,
		warnings = options.warnings,
		submission, author_name, annos, authors, type, demonyms;

	_.each(data, function(submission_info, unique_id) {
		submission_info = data[unique_id];

		var submission_authors = submission_info.authors;;
		if(!submission_authors) {
			submission_authors = [ ];
		}

		authors = _.map(submission_authors, function(author_info) {
			var institution = get_or_put_institution({
					department: author_info.dept,
					institution: author_info.institution,
					city: author_info.city,
					state: author_info.location,
					country: author_info.country
				}),
				split_name = author_info.name.split(" "),
				last_name = split_name[split_name.length-1],
				first_name = split_name[0],
				person = get_or_put_person({
					id: author_info.id || author_info.name,
					name: author_info.name,
					institutions: [institution],
					given: first_name,
					last: last_name
				});
			return person;
		});

		type = submission_info.subtype || submission_info.type;

		demonyms = presentation_types[type] || {event_demonym: "", person_demonym: "", duration: false};
		annos = [];
		if(submission_info.award || submission_info.hm) {
			submission_info.award = submission_info.hm ? "Honorable Mention" : "Best";
			((submission_info.award+"") || "").split(",").forEach(function(annotation_name) {
				var i = 0,
					len = annotations.length,
					anno;
				for(;i<len; i++) {
					anno = annotations[i];
					if(anno.name === annotation_name) {
						annos.push(anno);
					}
				}
			});
		}

		submission = new data_type.SubEvent({
			authors: authors,
			description: submission_info.abstract,
			short_description: submission_info.cAndB || submission_info.abstract.slice(0, 500)+"...",
			annotations: annos,
			unique_id: unique_id.trim(),
			type: type,
			title: submission_info.title,
			duration: demonyms.duration,
			event_demonym: demonyms.event_demonym,
			person_demonym: demonyms.person_demonym,
		});
		submissions[submission.unique_id] = submission;
	});
};

exports.read_pcs_files = function(filenames, options) {
	return new Promise(function(resolve, reject) {
		var submissions = {};

		_.each(filenames, function(fname) {
			var data = options.contents[fname];
			handle_json_data(data, submissions, options, fname);
		});

		resolve(submissions);
	});
};

*/