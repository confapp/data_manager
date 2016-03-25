app.factory('WarningList', [
	function() {
		function WarningList() {
			this.warnings = [];
		}

		(function(My) {
			var proto = My.prototype;

			proto.add = function(filename, message, row, type, info) {
				this.warnings.push({
					filename: filename,
					message: message,
					row: row || false,
					type: type || false,
					info: info
				});
			};

			proto.serialize = function() {
				return this.warnings;
			};
		}(WarningList));

		return {
			WarningList: WarningList,
			warningType: {
				MISSING_LOCATION: "MISSING_LOCATION",
				MISSING_ANNOTATION: "MISSING_ANNOTATION",
				MISSING_SUBMISSION: "MISSING_SUBMISSION"
			}
		};
	}
]);
