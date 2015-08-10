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
  //authorize user prior to serving data


  //serve main app
  res.sendFile('./client/index.html', {root: __dirname })
});
/*
add -- add a marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/add', function (req, res) {
var input = req.body;
  //are we adding a layer or marker?
  if (input.hasOwnProperty('marker')) {
    //marker
    console.log(req.body.marker);
  } else if (input.hasOwnProperty('layer')) {
    //layer
    console.log(req.body.layer);
  } else {
    res.send('Error: invalid data');
  }

});
//init server
var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('READY!', host, port);
});
