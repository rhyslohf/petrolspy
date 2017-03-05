var request = require("request");
var express = require('express');
var app = express();

var REQ = 'https://petrolspy.com.au/webservice-1/station/box';
var NELAT = -34.7376326004574;
var NELNG = 138.7992493776611;
var SWLAT = -35.0632739887249;
var SWLNG = 138.2543961672119;

var EPOCH = function() { return parseInt((new Date()).getTime()); };

// cache results for 5 minutes
var CACHE_STORE = null;

var requestPetrol = function(nelat,nelng,swlat,swlng,callback) {
	
	var values = [];
	
	var url = REQ+'?'+'neLat='+nelat+'&neLng='+nelng+'&swLat='+swlat+'&swLng='+swlng;
	request({
		url: url,
		json: true
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			for (var i=0; i < body.message.list.length; i++) {
				var e = body.message.list[i];
				var location = {lat:e.location.y, lon:e.location.x};
				
				for (var p in e.prices) {
					var updatedTime = e.prices[p].updated;
					var timeDifferentInMilliseconds = EPOCH()-updatedTime;
					var hoursOld = parseInt(timeDifferentInMilliseconds/1000/60/60);
					
					// we only care about things that have been updated in the last 24 hrs
					
					if (hoursOld > 24) continue;
					
					var tidyObj = {
						'time': updatedTime,
						'price': e.prices[p].amount,
						'location': location,
						'icon': e.icon,
						'name': e.name,
						'age': timeDifferentInMilliseconds,
						'type': e.prices[p]['type']
					};
					
					values.push(tidyObj);
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

var cache = function(data) {

	if (!data) {
		// if fresh cache
		if (CACHE_STORE && ((new Date().getTime() - CACHE_STORE.timestamp)/1000) < 300) {
			console.log('using cache');
			return CACHE_STORE;
		} else {
			CACHE_STORE = null;
			return null;
		}
	} else {
		console.log('caching');
		// set cache
		CACHE_STORE = {timestamp: new Date().getTime(), data:data};
		return CACHE_STORE;
	}
	
	return null;
};

app.get('/petrol', function (req, res) {
	if (cache()) {
		res.json(cache().data);
	} else {
		requestPetrol(NELAT,NELNG,SWLAT,SWLNG, function(data) {
			cache(data);
			res.json(data);
		});
	}
});

app.use(express.static('public'));


var port = process.env.PORT || 8080;

app.listen(port, function () {
  console.log('Listening on '+port+'...');
});