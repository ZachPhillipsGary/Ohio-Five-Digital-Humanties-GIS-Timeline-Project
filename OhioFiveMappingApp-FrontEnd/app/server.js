/*
Mapping server. Performs write requests to google drive sheets, serves visitors with the client app.
Powered by expressjs
*/
var express = require('express');
var app = express(); // init express framework
/*
serve files in "client" directory to users
*/
app.use(express.static('client'));
//use jade to serve html files
app.set('view engine', 'jade');
//route visitors to client app app
app.get('/', function (req, res) {
  res.sendFile('./client/index.html', {root: __dirname })
});
/*
add -- add a marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/add/', function (req, res) {
  var request = JSON.stringify(req.body));


});
//init server
var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
