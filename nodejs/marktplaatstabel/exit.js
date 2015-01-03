'use strict';

var http = require('http');

var options = {
      host    : "ssl.marktplaatstabel.services",
      path    : "/exit/"
};

var newRequest = http.request(options, function(res) {

      var dataBuffer = new Buffer(0);

      res.on('data', function (chunk) {
          dataBuffer = Buffer.concat([dataBuffer, chunk]);
      });

      res.on('end', function () {
          //console.log(dataBuffer.toString());
          console.log("Marktplaatstabel is afgesloten");
      });
});

newRequest.on('error', function(error) {
    switch(error.code) {
        case 'ECONNRESET':
	    // successful shutdown
            break;
        case 'ECONNREFUSED':
            console.log("Marktplaatstabel kon niet worden afgesloten");
            break;
        default:
            console.log("Error: " + error.message);
            break;
    }
});

newRequest.end();
