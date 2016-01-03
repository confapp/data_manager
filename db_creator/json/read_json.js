var fs = require('fs');

exports.read_json = function(json_filename, encoding) {
	return new Promise(function(resolve, reject) {
		if(!encoding) {
			encoding = 'utf8';
		}
		
		fs.readFile(json_filename, encoding, function (err, data) {
			var value, var_name;
			if (err) {
				reject(err);
			} else {
				try {
					// get rid of the equality setting in the beginning of the file
					value = JSON.parse(data.replace(/^[$A-Za-z_][0-9A-Z_a-z$]*\s*\=\s*/, ""));
					var_name = data.slice(0, data.indexOf("="));
					resolve({
						value: value,
						var_name: var_name
					});
				} catch(e) {
					reject(e);
				}
			}
		});
	});
};
