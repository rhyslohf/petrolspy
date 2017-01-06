var request = require("request");
var express = require('express');
var app = express();

var REQ = 'https://petrolspy.com.au/webservice-1/station/box';
var NELAT = -34.7376326004574;
var NELNG = 138.7992493776611;
var SWLAT = -35.0632739887249;
var SWLNG = 138.2543961672119;

var DAYS = 24;
var EPOCH = function() { return parseInt((new Date()).getTime()); };

var requestPetrol = function(nelat,nelng,swlat,swlng,callback) {
	
	var values = {'1':{},'2':{},'3':{}};
	
	var url = REQ+'?'+'neLat='+nelat+'&neLng='+nelng+'&swLat='+swlat+'&swLng='+swlng;
	request({
		url: url,
		json: true
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			//callback(body.message.list);
			
			for (var i=0; i < body.message.list.length; i++) {
				var e = body.message.list[i];
				var location = {lat:e.location.y, lon:e.location.x};
				
				for (var p in e.prices) {
					var updatedTime = e.prices[p].updated;
					var timeDifferentInMilliseconds = EPOCH()-updatedTime;
					var hoursOld = parseInt(timeDifferentInMilliseconds/1000/60/60);
										
					if (hoursOld <= 1*DAYS) {
						if (!values['1'][p]) values['1'][p] = [];
						values['1'][p].push({
							'time': updatedTime,
							'price': e.prices[p].amount,
							'location': location,
							'icon': e.icon,
                            'name': e.name,
							'age': timeDifferentInMilliseconds
						});
					}
					
					if (hoursOld >= 1*DAYS && hoursOld <= 2*DAYS) {
						if (!values['2'][p]) values['2'][p] = [];
						values['2'][p].push({
							'time': updatedTime,
							'price': e.prices[p].amount,
							'location': location,
							'icon': e.icon,
                            'name': e.name,
							'age': timeDifferentInMilliseconds
						});
					}
					
					if (hoursOld >= 3*DAYS && hoursOld <= 7*DAYS) {
						if (!values['3'][p]) values['3'][p] = [];
						values['3'][p].push({
							'time': updatedTime,
							'price': e.prices[p].amount,
							'location': location,
                            'icon': e.icon,
                            'name': e.name,
							'age': timeDifferentInMilliseconds
						});
					}
				}			
			}
			
			callback(values);
			
		} else {
			console.log('>>>> ERROR <<<<');
			console.log(error);
			callback();
		}
		
	});
};

app.get('/petrol', function (req, res) {
	requestPetrol(NELAT,NELNG,SWLAT,SWLNG, function(data) {
		res.json(data);
	});
});

app.use(express.static('public'));


var port = process.env.PORT || 8080;

app.listen(port, function () {
  console.log('Listening on '+port+'...');
});