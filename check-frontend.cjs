<<<<<<< HEAD
const http = require('http');
http.get('http://localhost:5173/', function(r) {
  let d = '';
  r.on('data', function(c) { d += c; });
  r.on('end', function() {
    console.log('Status:', r.statusCode);
    console.log('Has root:', d.includes('id="root"'));
  });
=======
const http = require('http');
http.get('http://localhost:5173/', function(r) {
  let d = '';
  r.on('data', function(c) { d += c; });
  r.on('end', function() {
    console.log('Status:', r.statusCode);
    console.log('Has root:', d.includes('id="root"'));
  });
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
});