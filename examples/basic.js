var express = require('express');

var app = express();
app.set('view engine', 'jade');
app.set('views', "examples/views");


app.get('/', function (req, res) {
    res.render('basic');
});

app.use('/static', express.static(__dirname + '/static'));

app.listen(3000);