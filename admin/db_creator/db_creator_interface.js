var CURRENT_SCHEMA_VERSION='A',
	SECperHR = 60*60*24;
app.factory('DatabaseCreator', DatabaseCreator);

DatabaseCreator.$inject=['$q', 'CreateTables', 'DataTypes', 'CSVReader', 'WarningList', 'SQLtoJSON'];
function DatabaseCreator($q, CreateTables, DataTypes, CSVReader, WarningList, SQLtoJSON) {
	var service = {
		createDatabase: createDatabase
	};

	function createDatabase(sourceData) {
		var db = new SQL.Database(),
			options = {
				warnings: new WarningList.WarningList(),
				sessions: {},
				people: {},
				institutions: {},
				submissions: {},
				annotations: {},
				locations: {},
				presentationTypes: {},
				sessionTypes: {},
				timezone: sourceData.timeZone,
				schedule: [],
				getOrPutPerson: function(person_options) {
					var id = person_options.id,
						person;

					if((id || id===0) && this.people.hasOwnProperty(id)) {
						person = this.people[id];
						person.merge(person_options);
					} else {
						person =  new DataTypes.Person(person_options);
						if(id || id === 0) {
							this.people[id] = person;
						}
					}

					return person;
				},
				getOrPutInstitution: function(institution_options) {
					var id = institution_options.institution,
						institution;
					if(this.institutions.hasOwnProperty(id)) {
						institution = this.institutions[id];
						institution.merge(institution_options);
					} else {
						institution = this.institutions[id] = new DataTypes.Institution(institution_options);
					}

					return institution;
				},
			};

		var parsePromises = _.map(sourceData.dataFiles, function(dataFile) {
			var uri = dataFile.uri.uri,
				fileName = dataFile.name;

			return CSVReader.parseCSV(options, uri, fileName);
		});

		_.each(sourceData.locations, function(location) {
			var map = sourceData.maps[location.mapKey];
			options.locations[location.id] = new DataTypes.Location(_.extend({
				map: _.extend({}, map)
			}, location));
		});

		_.each(sourceData.annotationTypes, function(annotation) {
			options.annotations[annotation.id] = new DataTypes.Annotation(_.extend({}, annotation));
		});

		_.each(sourceData.presentationTypes, function(presentationType) {
			options.presentationTypes[presentationType.name] = presentationType;
		});

		_.each(sourceData.sessionTypes, function(sessionType) {
			options.sessionTypes[sessionType.name] = sessionType;
		});

		var version;

		return CreateTables.initializeDatabase(db).then(function(db) {
			return $q.all(parsePromises);
		}).then(function(parsedValues) {
			return CSVReader.handleParsedCSVs(options, parsedValues);
		}).then(function() {
			options.schedule.sort(function(a, b) { return a.start - b.start; });
		}).then(function() {
			var seq = 1;
			var insertionPromises = _.map(options.locations, function(location) {
				return location.do_insert(db, seq++);
			});
			return $q.all(insertionPromises);
		}).then(function() {
			var seq = 1;
			var insertionPromises = _.map(options.annotations, function(annotation) {
				return annotation.do_insert(db, seq++);
			});
			return $q.all(insertionPromises);
		}).then(function() {
			var scheduleInsertionPromises = _.map(options.schedule, function(session) {
				return session.do_insert(db);
			});

			return $q.all(scheduleInsertionPromises);
		}).then(function() {
			var first_session = _.first(options.schedule),
				last_session = _.last(options.schedule),
				duration = last_session.end - first_session.start,
				utc_offset = first_session.offset,
				start_day = Math.floor((first_session.start+(utc_offset*60))/SECperHR)*SECperHR - (utc_offset*60),
				end_day = Math.floor((last_session.end+(utc_offset*60))/SECperHR)*SECperHR - (utc_offset*60),
				num_days = 1 + (end_day - start_day)/SECperHR;

			db.run("INSERT INTO conference(id, start_day, num_days, name, location, description, utc_offset, webapp_base_url, data_sync, vote, reading_list, schedule, note, icon_url, schema_version) " +
					"VALUES ($id, $start_day, $num_days, $name, $location, $description, $utc_offset, $webapp_base_url, $data_sync, $vote, $reading_list, $schedule, $note, $icon_url, $schema_version)", {
				$id: sourceData.uid,
				$start_day: start_day,
				$location: sourceData.location,
				$description: sourceData.description,
				$utc_offset: utc_offset,
				$name: sourceData.name,
				$num_days: num_days,
				$webapp_base_url: sourceData.webBaseURL,
				$data_sync: sourceData.hasDataSync ? 1 : 0,
				$vote: sourceData.hasVoting ? 1 : 0,
				$reading_list: sourceData.hasReadingList ? 1 : 0,
				$schedule: sourceData.hasSchedule ? 1 : 0,
				$note: sourceData.hasNotes ? 1 : 0,
				$icon_url: sourceData.primaryIcon.uri,
				$schema_version: CURRENT_SCHEMA_VERSION
			});
			return db;
		}).then(function(db) {
			version = sourceData.currentDatabaseVersion ? sourceData.currentDatabaseVersion+1 : 1;
			db.run("INSERT INTO db_info(version, last_updated) VALUES ($version, $last_updated)", {
				$version: version,
				$last_updated: Math.round((new Date()).getTime()/1000)
			});
			return db;
		}).then(function(db) {
			return SQLtoJSON.jsonify(db);
		}).then(function(json) {
			return {
				database: db,
				json: json,
				version: version,
				warnings: options.warnings.serialize()
			};
		});
	}

	return service;
}