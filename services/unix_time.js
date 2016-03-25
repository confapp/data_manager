app.factory('UNIXTime', UNIXTime);

UNIXTime.$inject=[];
function UNIXTime() {
	return {
		getUnixTime: function(date_string, time_zone, format) {
			var date = new Date(date_string),
				moment_obj = moment.tz(date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() , format, time_zone);

			return moment_obj;
		}
	}
}