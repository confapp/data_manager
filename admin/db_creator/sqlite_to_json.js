app.service('SQLtoJSON', ['$q', function($q) {
	return {
		jsonify: function(db) {
			return $q(function(resolve, reject) {
				var tableNames = [];
				db.each("SELECT name FROM sqlite_master WHERE type='table'", function(row) {
					tableNames.push(row.name);
				});
				resolve(tableNames);
			}).then(function(tableNames) {
				var json_obj = {},
					promises = _.map(tableNames, function(tableName) {
						return $q(function(resolve, reject) {
							var headers = [];
							db.each("PRAGMA table_info( " + tableName + ")", function(info) {
								headers.push(info.name);
							});
							resolve(headers);
						}).then(function(headers) {
							return $q(function(resolve, reject) {
								var query = "SELECT " + headers.join(",") + " FROM " + tableName,
									rows = [];

								db.each(query, function(map) {
									var row = _.map(headers, function(key) {
										return map[key];
									});
									rows.push(row);
								});
								resolve({
									headers: headers,
									rows: rows
								});
							});
						}).then(function(table_obj) {
							json_obj[tableName] = table_obj;
						});
					});
				return $q	.all(promises)
							.then(function(tables) {
								return json_obj;
							});
			});
		}
	};
}]);