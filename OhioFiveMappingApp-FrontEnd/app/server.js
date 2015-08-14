/*
Mapping server. Performs write requests to google drive sheets, serves visitors with the client app.
Powered by expressjs
*/
// init express framework
var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
var Spreadsheet = require('edit-google-spreadsheet');
app.use(bodyParser.json());
/*
serve files in "client" directory to users
*/
app.use(express.static('client'));
//use jade to serve html files
app.set('view engine', 'jade');
//getJSON
//route visitors to client app app
app.get('/', function(req, res) {
    //authorize user prior to serving data


    //serve main app
    res.sendFile('./client/index.html', {
        root: __dirname
    })
});
/*
add -- add a marker to a google drive document using node-edit-google-spreadsheet
*/
app.post('/add', function(req, res) {
    var input = req.body;
    console.log(req.body.marker);
    //are we adding a layer or marker?
    if ((input.hasOwnProperty('marker')) || (input.hasOwnProperty('layer'))) {
        //get object key
        console.log(req.body.layer || req.body.marker);
        var gSheetkey = req.body.marker.mapKey;
        Spreadsheet.load({
            debug: true,
            spreadsheetId: String(gSheetkey),
            worksheetName: 'Sheet1',

            // authentication :)
            oauth2: {
                "client_id": "447842114622-d8olefdjlfptc8qrv2u43r2h2se8dj89.apps.googleusercontent.com",
                "client_secret": "VFvrYGnHGsKxZOMpwh64rJZG",
                "refresh_token": "1/9W4RgSrwEI17Er8YSte4FFhzLFr0o1dexJCB9EQl_5M"
            }
        }, function sheetReady(err, spreadsheet) {
            //use speadsheet!

            if (err) throw err;
            spreadsheet.receive(function(err, rows, info) {
      if(err) throw err;
      console.log("Found rows:", rows);
      var rowsLength = Object.keys(rows).length;
      var rowObject = {};
            var row = {
                  1: "marker",
                  2: " ",
                  3: String(req.body.marker.lat),
                  4: String(req.body.marker.lon),
                  5: String(req.body.marker.label.message),
                  6: String(req.body.marker.startDate),
                  7: String(req.body.marker.endDate)
              };
              rowObject[rowsLength+1] = row;
              console.log('row',rowObject);
            spreadsheet.add(rowObject);
      spreadsheet.send(function(err) {
          if (err) throw err;
      });
      console.log("Updated! ");
      // Found rows: { '3': { '5': 'hello!' } }
      });
            spreadsheet.metadata(function(err, metadata) {
                if (err) throw err;
                var newRow = metadata.rowCount + 1;
                console.log(newRow);

                // { title: 'Sheet3', rowCount: '100', colCount: '20', updated: [Date] }
            });

        });
    } else {
        res.send('Error: invalid data');
    }
});


//init server
var server = app.listen(8000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('READY!', host, port);
});
