const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const axios = require('axios');
const fs = require('fs');

const app = express();

const city_Ids = require('./Data/city_Ids');

// var corsOptions = {
// 	origin: 'http://example.com',
// 	optionsSuccessStatus: 200
// };

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



var i = schedule.scheduleJob('* 5 0 * *', function() {
	const chunkArray = (array, size) => array.length > size ? [array.slice(0, size), ...chunkArray(array.slice(size), size)] : [array];
	var arrIds = chunkArray(city_Ids, 20);
	var requests = [];
	arrIds.map(obj => {
		requests.push(axios.get('https://api.openweathermap.org/data/2.5/group?id=' + obj + '&units=metric&appid=39f7af91a4b080cd1fdef1f8e81062e7'));
	});
	axios.all(requests).then(
		axios.spread((...responses) => {
			const dataArray = [];
			responses.map(obj => {
				obj.data.list.map(objNew => {
					dataArray.push(objNew);
				});
			});
			const today = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear(); 
			fs.writeFile('./Data/weather_data/' + today + '.json', JSON.stringify(dataArray), function (err) {
				if (err) throw err;
				console.log('File is created successfully.');
			}); 
		})
	);
});



var j = schedule.scheduleJob('* 5 12 * *', function() {
	const chunkArray = (array, size) => array.length > size ? [array.slice(0, size), ...chunkArray(array.slice(size), size)] : [array];
	var arrIds = chunkArray(city_Ids, 20);
	var requests = [];
	arrIds.map(obj => {
		requests.push(axios.get('https://api.openweathermap.org/data/2.5/group?id=' + obj + '&units=metric&appid=39f7af91a4b080cd1fdef1f8e81062e7'));
	});
	axios.all(requests).then(
		axios.spread((...responses) => {
			const dataArray = [];
			responses.map(obj => {
				obj.data.list.map(objNew => {
					dataArray.push(objNew);
				});
			});
			const today = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear(); 
			fs.writeFile('./Data/weather_data/' + today + '.json', JSON.stringify(dataArray), function (err) {
				if (err) throw err;
				console.log('File is created successfully.');
			}); 
		})
	);
});



app.get('/weatherData', function (req, res) {
	const today = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear();
	fs.readFile('./Data/weather_data/' + today + '.json', 'utf8', function(err, data) {
		res.send(JSON.parse(data));
  	}); 
});



app.use(express.static(__dirname + '/map-application/dist/map-application'));
app.use(function(req, res) {
	res.sendFile(path.join(__dirname, '/map-application/dist/map-application', 'index.html'));
});



app.use('*', function (req, res) {
	res.send('this is server side url!!!!');
});
app.listen(8000, function(){
	console.log('Listening on port ' + 8000);
 });