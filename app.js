var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var object_assign = require('object-assign');

app.listen(8080);

function handler(req, res) {
    fs.readFile(__dirname + '/public/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

var FETCH_INTERVAL = 1000;
var HOST = "http://www.chotot.vn";
var PATH = "/tp-ho-chi-minh/mua-ban/#";
var URL = HOST + PATH;
var imgs = {};
var i = 0;

var fetchIO = io.on('connection', function (socket) {
    socket.emit('imageDownloaded', imgs);
    var fetchDone = true;
    var fetchIntervalId = setInterval(function () {
        if (!fetchDone) return;
        fetchDone = false;
        request(URL, function (err, resp, body) {
            $ = cheerio.load(body);
            var rows = $('img.thumbnail');
            var newImgs = {};
            var changed = false;
            for (var key in rows) {
                var row = rows[key];
                if (row && row.attribs) {
                    var attr = row.attribs.src; //['data-original'];
                    if (attr && !imgs[attr]) {
                        newImgs[attr] = {
                            position: i++
                        };
                        changed = true;
                    }
                    attr = row.attribs['data-original'];
                    if (attr && !imgs[attr]) {
                        newImgs[attr] = {
                            position: i++
                        };
                        changed = true;
                    }
                }
            }
            if (changed === true) {
                console.log('changed', newImgs);
                imgs = object_assign({}, imgs, newImgs);
                fetchIO.emit('imageDownloaded', newImgs);
            }
            fetchDone = true;
        });
    }, FETCH_INTERVAL);

    socket.on('disconnect', function () {
        clearInterval(fetchIntervalId);
    });
});
