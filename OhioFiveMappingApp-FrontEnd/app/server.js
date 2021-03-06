/*
Mapping server. Performs write requests to google drive sheets, serves visitors with the client app.
Powered by expressjs
*/
// init express framework
var express = require('express'),
    app = express();
var cors = require('cors'); // allow Cross-Domain Origin
var bodyParser = require('body-parser'); // read json
var Spreadsheet = require('edit-google-spreadsheet');
var google = require('googleapis');
app.use(bodyParser.json());
app.use(cors());
/*
serve files in "client" directory to users
*/
app.use(express.static('client'));

//oauth2 keys && key globals for Google Drive
var CLIENT_ID = '158993334098-9mighdbu51ghp33g8ihigcok05gikmpg.apps.googleusercontent.com';
var CLIENT_SECRET = 'glTMKCAyuu1EVvGFjcB6jDWh';
var PERMISSION_SCOPE = 'https://spreadsheets.google.com/feeds'; //space-delimited string or an array of scopes
var OAuth2Client = google.auth.OAuth2;
var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, 'urn:ietf:wg:oauth:2.0:oob');
//use jade to serve static html files
app.set('view engine', 'jade');
// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests.
app.all('*', function(req, res, next) {
       res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "X-Requested-With");
       res.header('Access-Control-Allow-Headers', 'Content-Type');
       next();
});
//route visitors to client app app
app.get('/', function(req, res) {
    //serve main app
    res.sendFile('./client/index.html', {
        root: __dirname
    })
});
/*
authentication -- generate oauth2 Credentials for user
example:
{
    "client_id": "447842114622-d8olefdjlfptc8qrv2u43r2h2se8dj89.apps.googleusercontent.com",
    "client_secret": "VFvrYGnHGsKxZOMpwh64rJZG",
    "refresh_token": "1/9W4RgSrwEI17Er8YSte4FFhzLFr0o1dexJCB9EQl_5M"
}
*/
app.get('/auth', function(req, res) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: PERMISSION_SCOPE
  });
  res.send(url);
});
app.post('/auth', function(req, res) {
    var code;
    if (req.body.hasOwnProperty('key')) {
      code = req.body.key || '';
    }
  console.log(code);
  oauth2Client.getToken(code, function(err, tokens) {
    if(err)
      res.send("Error getting token: " + err);
    var creds = { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: tokens.refresh_token  };
    console.log('Use this in your Spreadsheet.load():\n"oauth2": %s', JSON.stringify(creds, true, 2));
    res.send(creds || err);
  });
});

/*
add -- add a marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/add', function(req, res) {
    var input = req.body;
    console.log(req.body.marker);
    //are we adding a layer or marker?
    if ((input.hasOwnProperty('marker')) || (input.hasOwnProperty('layer'))) {
        //convert array of strings into comma seperated string
        function tagsToString(tagsArray) {
          var returnVal = '';
          for (var i = 0; i < tagsArray.length; i++) {
            returnVal + tagsArray[i] + ',';
          }
          return returnVal;
        }
        //get object key
        console.log(req.body.layer || req.body.marker);
        var gSheetkey = req.body.marker.mapKey || '';
        Spreadsheet.load({
            debug: true,
            spreadsheetId: String(gSheetkey),
            worksheetName: 'Sheet1',
            // authentication :)
            oauth2: req.body.authentication || {}

        }, function sheetReady(err, spreadsheet) {
            if (err) res.send(err);
            spreadsheet.receive(function(err, rows, info) {
      if(err) res.send(err);
    //  console.log("Found rows:", rows);
      var rowsLength = Object.keys(rows).length;
      var rowObject = {};
      console.log(req.body.marker);
            var row = {
                  1: String(req.body.marker.kind) || 'marker',
                  2: String(req.body.marker.group) || 'invalid',
                  3: String(req.body.marker.lat) || 'invalid',
                  4: String(req.body.marker.lon) || 'invalid',
                  6: String(req.body.marker.startDate) || 'invalid',
                  7: String(req.body.marker.endDate) || 'invalid',
                  8: tagsToString(req.body.marker.tags) || [],
                  9: String(req.body.marker.format) || 'invalid'
              };
              if(req.body.marker.kind === 'layer') {
                row[5] = String(req.body.marker.url);
                console.log(req.body.marker.url)
              } else if (req.body.marker.kind === 'marker'){
                 row[5] = String(req.body.marker.label.message);
              } else {
                row[5] = String(req.body.marker.label.message) || String(req.body.marker.label.url);
              }
              rowObject[rowsLength+1] = row;
              console.log('row',rowObject);
            spreadsheet.add(rowObject);
      spreadsheet.send(function(err) {
          if (err) res.send(err);
      });
      console.log("Updated! ");
      // Found rows: { '3': { '5': 'hello!' } }
      });


        });
    } else {
        res.send('Error: invalid data');
    }
});


//init HTTP server
var server = app.listen(8000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('READY!', host, port);
});
