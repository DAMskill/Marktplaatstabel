var CountdownClock = (function() {

    "use strict";
    
    function CountdownClock(nrOfSecondsToCountdown) {
        this.start(nrOfSecondsToCountdown);
    }

    CountdownClock.prototype.start = function(nrOfSecondsToCountdown)
    {
        this.startTime = new Date();
        if (typeof nrOfSecondsToCountdown-=='undefined' || nrOfSecondsToCountdown<0) {
            this.nrOfMilliSecondsToCountdown = 0;
            this.countdownTime = null;
        }
        else {
            this.nrOfMilliSecondsToCountdown = nrOfSecondsToCountdown*1000;
            this.countdownTime = new Date(this.nrOfMilliSecondsToCountdown);
        }
    }

    CountdownClock.prototype.getTimeLeft = function()
    {
          var timeLeftHours = 0;
          var timeLeftMinutes = 0;
          var timeLeftSeconds = 0;
          var timeElapsedInMilliseconds = new Date().getTime() - this.startTime.getTime();
        
          if (timeElapsedInMilliseconds < this.nrOfMilliSecondsToCountdown) {
             var timeLeft = new Date(this.countdownTime.getTime() - timeElapsedInMilliseconds);
             timeLeftHours = timeLeft.getUTCHours();
             timeLeftMinutes = timeLeft.getUTCMinutes();
             timeLeftSeconds = timeLeft.getUTCSeconds();
          }
        
          // Pad the minutes and seconds with leading zeros, if required
          timeLeftMinutes = ( timeLeftMinutes < 10 ? "0" : "" ) + timeLeftMinutes;
          timeLeftSeconds = ( timeLeftSeconds < 10 ? "0" : "" ) + timeLeftSeconds;
        
          // Compose the string for display        
          var timeLeftString = timeLeftHours + ":" + timeLeftMinutes + ":" + timeLeftSeconds;
        
          return timeLeftString;
    }

    return CountdownClock;

})();

