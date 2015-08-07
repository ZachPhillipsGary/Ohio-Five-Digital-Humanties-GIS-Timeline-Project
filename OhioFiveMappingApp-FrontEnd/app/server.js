/*
Mapping server. Performs write requests to google drive sheets, serves visitors with the client app.
Powered by expressjs
*/
// init express framework
var express = require('express'), app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
/*
serve files in "client" directory to users
*/
app.use(express.static('client'));
//use jade to serve html files
app.set('view engine', 'jade');
//getJSON
//route visitors to client app app
app.get('/', function (req, res) {
  res.sendFile('./client/index.html', {root: __dirname })
});
/*
add -- add a marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/add/', function (req, res) {
  var request = JSON.stringify(req.body);
  console.log(request);
});
/*
edit -- change an existing marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/edit/', function (request, response) {
  var request = JSON.stringify(request.body);
  console.log(request.body);

});
//init server
var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
