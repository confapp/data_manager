app.factory('ParseCSVAttachments', [
	'CSVHeaders',
	function(CSVHeaders) {
		return {
			parseCSVAttachments: function(options, data, filename) {
				var contents = CSVHeaders.dataToObjects(data, CSVHeaders.headers.attachments);

				_.each(contents, function(obj, index) {
					var submission_id = obj.get1('id'),
						submission = options.submissions[submission_id];

					if(submission) {
						var attachment = {
							type: obj.get1('type'),
							filename: obj.get1('filename'),
							directory: obj.get1('directory'),
							url: obj.get1('url')
						};

						if(submission.attachments) {
							submission.attachments.push(attachment);
						} else {
							submission.attachments = [attachment];
						}
					}
				});
			}
		};
	}
]);
/*
var rows_to_objects = require('./read_csv').rows_to_objects,
	data_type = require('../data_types'),
	_ = require('underscore'),
	csv_headers = require('./csv_headers'),
	my_date_offset = (new Date()).getTimezoneOffset() * 60,
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

function handle_csv_data(options, attachments, fname) {
	var contents = csv_headers.dataToObjects(options.contents[fname], csv_headers.headers.attachments);
	_.each(contents, function(obj, index) {
		var submission_id = obj.get1('id'),
			submission = options.submissions[submission_id];

		if(submission) {
			var attachment = {
				type: obj.get1('type'),
				filename: obj.get1('filename'),
				directory: obj.get1('directory'),
				url: obj.get1('url')
			};

			if(submission.attachments) {
				submission.attachments.push(attachment);
			} else {
				submission.attachments = [attachment];
			}
		}
	});
}

exports.read_attachments = function(filenames, options) {
	return new Promise(function(resolve, reject) {
		var attachments = options.attachments = [];

		_.each(filenames, function(fname) {
			handle_csv_data(options, attachments, fname);
		});

		resolve(attachments);
	}).catch(function(e) {
		console.error(e.stack);
	});
};

*/