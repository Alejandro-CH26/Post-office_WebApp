var http = require('http');
var url = require('url');
var fs = require('fs');

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    
    if (q.pathname != "/") {
      var filename = "." + q.pathname + ".html";
      console.log(filename);
      fs.readFile(filename, function(err, data) {
        if (err) {
          console.log("Here");
          fs.readFile("404.html", function(err404, data){
            console.log("Herererer");
            if (err404) {
              res.writeHead(404, {'Content-Type': 'text/html'});
              return res.end("Somehow, we cannot find the 404.html file. This is probably all your fault.");
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            return res.end();
          });
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
          return res.end();
        }
      });
   } else {
      fs.readFile("index.html", function(err, data) {
        if (err) {
          fs.readFile("404.html", function(err, data){
            if (err) {
              res.writeHead(404, {'Content-Type': 'text/html'});
              return res.end("Error 404");
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            return res.end();
          });
        }
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(data);
        return res.end();
      });
    }
  }).listen(8080);

const connection = require('../server/db');

// Run a test query
connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
        console.error('❌ Query Error:', err);
        return;
    }
    console.log('✅ Current Time from DB:', results[0]);
});

// Close the connection after querying
connection.end();