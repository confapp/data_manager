app.service('DataTypes', ['$q', function($q) {
	var Institution = function(options) {
		var key;
		for(key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};

	(function(My) {
		var proto = My.prototype;
		proto.merge = function(other) { };
		proto.equals = function(other) {
			return other instanceof My && other.institution === this.institution;
		};
	}(Institution));

	var Person = function(options) {
		var key;
		for(key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};

	(function(My) {
		var proto = My.prototype;
		proto.merge = function(other) { };
		proto.equals = function(other) {
			return other instanceof My && other.id === this.id;
		};
		proto.do_insert = function(db) {
			if(!this.pk_promise) {
				var self = this,
					institution_name = this.institutions.length > 0 ? this.institutions[0].institution : "";

				this.pk_promise = $q(_.bind(function(resolve, reject) {
					db.run("INSERT INTO person(name, last_name, affiliation) VALUES ($name, $last_name, $affiliation)", {
						$name: this.name,
						$last_name: this.last,
						$affiliation: institution_name
					});
					//getLastRowID(db)
					self.pk = getLastRowID(db);
					resolve(self.pk);
				}, this));
			}

			return this.pk_promise;
		};
	}(Person));

	var SubEvent = function(options) {
		var key;
		for(key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};

	(function(My) {
		var proto = My.prototype;
		proto.merge = function(other) { };
		proto.equals = function(other) {
			return other instanceof My;
		};
		proto.do_insert = function(db, session) {
			if(!this.pk_promise) {
				var location_fk = session.location ? session.location.pk : -1,
					start_offset = 0,
					end_offset = 0,
					start_time = session.start,
					end_time = session.end,
					utc_offset = session.offset,
					self = this;

				if(start_time >= 0) { // only if we have a start time given
					_.some(session.submissions, function(submission) {
						var duration = submission.duration ? submission.duration * 60 : false;
						if(duration) {
							end_offset += duration;
							if(submission === this) {
								return true;
							}
							start_offset += duration;
						}
						return false;
					}, this);

					if(end_offset > 0) {
						start_time = session.start + start_offset;
						end_time = session.start + end_offset;
					}
				}

				this.pk_promise = $q(_.bind(function(resolve, reject) {
					db.run("INSERT INTO event(parent_fk, title, unique_id, type, location_fk, description, short_description, person_demonym, event_demonym, start_time, end_time, utc_offset) " +
							"VALUES ($parent_fk, $title, $unique_id, $type, $location_fk, $description, $short_description, $person_demonym, $event_demonym, $start_time, $end_time, $utc_offset)", {
							$parent_fk: session.pk,
							$title: this.title,
							$unique_id: this.unique_id,
							$type: this.type,
							$description: this.description,
							$short_description: this.short_description,
							$location_fk: location_fk,
							$person_demonym: this.person_demonym,
							$event_demonym: this.event_demonym,
							$start_time: start_time,
							$end_time: end_time,
							$utc_offset: utc_offset
						});
					self.pk = getLastRowID(db);
					resolve(self.pk);
				}, this)).then(_.bind(function(event_pk) {
					var authors_promises = _.map(this.authors, function(author) {
						return author.do_insert(db);
					});
					return $q.all(authors_promises);
				}, this)).then(_.bind(function(event_pk) {
					var event_people_promises = _.map(this.authors, function(author, seq) {
							return $q(_.bind(function(resolve, reject) {
								db.run("INSERT INTO event_people(event_fk, person_fk, sequence) VALUES ($event_fk, $person_fk, $sequence)", {
									$event_fk: this.pk,
									$person_fk: author.pk,
									$sequence: seq+1
								});
								resolve();
							}, this));
					}, this);
					return $q.all(event_people_promises);
				}, this)).then(_.bind(function(event_pk) {
					var event_annotations_promises = _.map(this.annotations, function(annotation) {
							return $q(_.bind(function(resolve, reject) {
								db.run("INSERT INTO event_annotations(event_fk, annotation_fk) VALUES ($event_fk, $annotation_fk)", {
									$event_fk: this.pk,
									$annotation_fk: annotation.pk
								});
								resolve();
							}, this));
					}, this);
					return $q.all(event_annotations_promises);
				}, this)).then(_.bind(function(event_pk) {
					var event_attachments_promises = _.map(this.attachments, function(attachment) {
							return $q(_.bind(function(resolve, reject) {
								db.run("INSERT INTO event_attachments(event_fk, type, filename, directory, url) VALUES ($event_fk, $type, $filename, $directory, $url)", {
									$event_fk: this.pk,
									$type: attachment.type,
									$filename: attachment.filename,
									$directory: attachment.directory,
									$url: attachment.url,
								});
								resolve();
							}, this));
					}, this);
					return $q.all(event_attachments_promises);
				}, this)).then(_.bind(function() {
					return this.pk;
				}, this));
			}

			return this.pk_promise;
		};
	}(SubEvent));

	var Annotation = function(options) {
		for(var key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};
	(function(My) {
		var proto = My.prototype;
		proto.markAsUsed = function() {
			this.isUsed = true;
		};
		proto.do_insert = function(db, seq) {
			return $q(_.bind(function(resolve, reject) {
				if(this.isUsed) {
					db.run("INSERT INTO annotation (name, type, description, icon, icon_url, sequence) VALUES ($name, $type, $description, $icon, $icon_uri, $sequence)", {
						$name: this.id,
						$type: this.type,
						$description: this.description,
						$icon: this.icon.name,
						$icon_uri: this.icon.uri,
						$sequence: seq
					});
					this.pk = getLastRowID(db);
					resolve(true);
				} else {
					resolve(false);
				}
			}, this));
		};
	}(Annotation));

	var Location = function(options) {
		for(var key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};

	(function(My) {
		var proto = My.prototype;
		proto.merge = function(other) { };
		proto.equals = function(other) {
			return other instanceof My && other.id === this.id;
		};
		proto.do_insert = function(db, seq) {
			if(!this.pk_promise) {
				var self = this;
				var map = this.map || {
					name: '',
					image: {
						name: '',
						uri: ''
					}
				};
				this.pk_promise = $q(_.bind(function(resolve, reject) {
					var id = db.run("INSERT INTO location (name, sequence, map_name, map_file, map_url, map_x_pct, map_y_pct) " +
							"VALUES ($name, $seq, $map_name, $file, $map_uri, $x_pct, $y_pct)", {
						$name: this.name,
						$seq: seq,
						$file: map.image.name,
						$x_pct: this.pctX,
						$y_pct: this.pctY,
						$map_uri: map.image.uri,
						$map_name: map.name
					});
					self.pk = getLastRowID(db);
					resolve(self.pk);
				}, this));
			}
			return this.pk_promise;
		};
	}(Location));

	var Event = function(options) {
		var key;
		for(key in options) {
			if(options.hasOwnProperty(key)) {
				this[key] = options[key];
			}
		}
	};

	(function(My) {
		var proto = My.prototype;
		proto.do_insert = function(db, conf_tz_offset) {
			var self = this;
			return $q(_.bind(function(resolve, reject) {
				var location_fk = this.location ? this.location.pk : -1;

				db.run("INSERT INTO event(parent_fk, title, type, unique_id, description, start_time, end_time, location_fk, person_demonym, event_demonym, utc_offset) " +
						"VALUES ($parent_fk, $title, $type, $unique_id, $description, $start_time, $end_time, $location_fk, $person_demonym, $event_demonym, $utc_offset)", {
					$parent_fk: -1,
					$title: this.title,
					$type: this.type,
					$unique_id: this.unique_id,
					$start_time: this.start,
					$end_time: this.end,
					$utc_offset: this.offset,
					$location_fk: location_fk,
					$person_demonym: this.person_demonym,
					$event_demonym: this.event_demonym
				});
				self.pk = getLastRowID(db);
				resolve(self.pk);
			}, this)).then(_.bind(function() {
				if(this.chairs) {
					var chair_promises = _.map(this.chairs, function(chair) {
							return chair.do_insert(db);
						});
					return $q.all(chair_promises);
				} else {
					return [];
				}
			}, this)).then(_.bind(function(chair_fks) {
				var event_people_promises = _.map(chair_fks, function(chair_fk, seq) {
					return $q(function(resolve, reject) {
						db.run("INSERT INTO event_people(event_fk, person_fk, sequence) VALUES ($event_fk, $person_fk, $sequence)", {
							$event_fk: self.pk,
							$person_fk: chair_fk,
							$sequence: seq+1
						});
						resolve();
					});
				});

				return $q.all(event_people_promises);
			}, this)).then(_.bind(function() {
				var submission_promises = _.map(this.submissions, function(submission) {
					return submission.do_insert(db, self);
				});
				return $q.all(submission_promises);
			}, this)).then(_.bind(function(submission_fks) {
				var event_events_promises = _.map(submission_fks, function(submission_fk, seq) {
					return $q(function(resolve, reject) {
						db.run("INSERT INTO event_events(parent_fk, child_fk, sequence) VALUES ($parent_fk, $child_fk, $sequence)", {
							$parent_fk: self.pk,
							$child_fk: submission_fk,
							$sequence: seq+1
						});
						resolve();
					});
				});
				return $q.all(event_events_promises);
			}, this));
		};
	}(Event));

	function getLastRowID(db) {
		return db.exec('select last_insert_rowid();')[0].values[0][0];
	}
	return {
		Event: Event,
		Institution: Institution,
		Location: Location,
		Person: Person,
		SubEvent: SubEvent,
		Annotation: Annotation
	};
}]);