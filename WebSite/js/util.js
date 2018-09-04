function randomAlphaNumericChar() {
	const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const index = Math.floor(Math.random() * CHARS.length);
	return CHARS[index];
}

function makeRandomSubmissionID() {
	return '********'.replace(/\*/g, function() {
		return randomAlphaNumericChar();
	});
}

/// https://stackoverflow.com/a/979995/1422794
function parseQueryString(query) {
	query = _.trimStart(query, '?');
	var vars = query.split("&");
	var query_string = {};
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		var key = decodeURIComponent(pair[0]);
		var value = decodeURIComponent(pair[1]);
		// If first entry with this name
		if (typeof query_string[key] === "undefined") {
			query_string[key] = decodeURIComponent(value);
			// If second entry with this name
		} else if (typeof query_string[key] === "string") {
			var arr = [query_string[key], decodeURIComponent(value)];
			query_string[key] = arr;
			// If third or later entry with this name
		} else {
			query_string[key].push(decodeURIComponent(value));
		}
	}
	return query_string;
}

function caseInsensitiveCompare(lhs, rhs) {
	return _.toUpper(lhs) === _.toUpper(rhs);
}