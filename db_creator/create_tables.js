app.service('CreateTables', ['$q', function($q) {
	var TABLES = {
			"conference": [
				["id", "TEXT"],

				["name", "TEXT"],
				["location", "TEXT"],
				["utc_offset", "INTEGER"],
				["description", "TEXT"],

				["webapp_base_url", "TEXT"],
				["icon_url", "TEXT"],
				//["update_url", "TEXT"],
				//["data_url", "TEXT"],

				["start_day", "INTEGER"],
				["num_days", "INTEGER"],

				["data_sync", "INTEGER"],
				["vote", "INTEGER"],
				["reading_list", "INTEGER"],
				["schedule", "INTEGER"],
				["note", "INTEGER"],

				["schema_version", "TEXT"]
			],

			"db_info": [
				["version", "TEXT"],
				["last_updated", "INTEGER"]
			],

			"location": [
				["_id", "INTEGER PRIMARY KEY"],

				["name", "TEXT"],

				["map_x_pct", "REAL"],
				["map_y_pct", "REAL"],

				["sequence", "INTEGER"],
				["map_file", "TEXT"],
				["map_url", "TEXT"],
				["map_name", "TEXT"]
			],

			"person": [
				["_id", "INTEGER PRIMARY KEY"],

				["name", "TEXT"],
				["last_name", "TEXT"],
				["affiliation", "TEXT"]
			],

			"annotation": [
				["_id INTEGER PRIMARY KEY"],

				["name", "TEXT"],
				["type", "TEXT"],
				["description", "TEXT"],

				["icon", "TEXT"],
				["icon_url", "TEXT"],
				["sequence", "INTEGER"]
			],

			"event": [
				["_id", "INTEGER PRIMARY KEY"],
				["parent_fk", "INTEGER REFERENCES event(_id)"],

				["unique_id", "TEXT"],
				["type", "TEXT"],

				["title", "TEXT"],
				["description", "TEXT"],
				["short_description", "TEXT"],
				["location_fk", "INTEGER REFERENCES location(_id)"],

				["start_time", "INTEGER"],
				["end_time", "INTEGER"],
				["utc_offset", "INTEGER"],

				["person_demonym", "TEXT"],
				["event_demonym", "TEXT"]
			],

			"event_people": [
				//["_id INTEGER PRIMARY KEY"],

				["event_fk", "INTEGER REFERENCES event(_id)"],
				["person_fk", "INTEGER REFERENCES person(_id)"],

				["sequence", "INTEGER"]
			],

			"event_events": [
				//["_id INTEGER PRIMARY KEY"],

				["parent_fk", "INTEGER REFERENCES event(_id)"],
				["child_fk", "INTEGER REFERENCES event(_id)"],

				["sequence", "INTEGER"]
			],

			"event_annotations": [
				//["_id INTEGER PRIMARY KEY"],

				["event_fk", "INTEGER REFERENCES event(_id)"],
				["annotation_fk", "INTEGER REFERENCES annotation(_id)"],

				//["sequence", "INTEGER"]
			],

			"event_attachments": [
				//["_id", "INTEGER PRIMARY KEY"],

				["type", "TEXT"],

				["event_fk", "INTEGER REFERENCES event(_id)"],

				["filename", "TEXT"],
				["directory", "TEXT"],
				["url", "TEXT"]
			]
		},
		join_space = function(x) { return x.join(" "); };

	return {
		initializeDatabase: function(db) {
			return $q(function(resolve, reject) {
				_.each(TABLES, function(fields, table_name) {
					var create_str =  "CREATE TABLE " + table_name + " (\n\t" +
											fields.map(join_space).join(",\n\t") +
										"\n)";
					db.run(create_str);
				});
				resolve(db);
			});
		},
		tables: TABLES
	};
}]);
/*
	return new Promise(function(resolve, reject) {
		var to_drop = [];
		db.each("SELECT name FROM sqlite_master WHERE type='table'", function(err, row) {
			to_drop.push(row.name);
		}, function() {
			resolve(to_drop);
		});
	}).then(function(table_names) {
		var drop_promises = _.map(table_names, function(table_name) {
			return new Promise(function(resolve, reject) {
				db.run("DROP TABLE " + table_name, function() {
					resolve();
				});
			});
		});
		return Promise.all(drop_promises);
*/