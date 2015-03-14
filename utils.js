// Check whether the current time is valid to call a lunch train.
module.exports = {
	validLunchTrainTime: function(lastTrainTime) {
		// Milliseconds in an hour.
		var millisPerHour = 1000 * 60 * 60;
	    return ((Date.now() - lastTrainTime) >= millisPerHour);
	}

}