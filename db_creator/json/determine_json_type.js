var fs = require('fs');

exports.determine_json_type = function(options, data, filename, var_name) {
	return new Promise(function(resolve, reject) {
		var category = false;

		if(var_name === 'entities') {
			category = 'pcs_files';
		} else if(var_name === 'schedule') {
			category = 'schedule_files';
		} else if(var_name === 'sessions') {
			category = 'session_files';
		}

		if(category) {
			resolve({
				type: "json",
				filename: filename,
				category: category
			});
			resolve(rv);
		} else {
			reject("Unknown Type");
		}
	});
};
