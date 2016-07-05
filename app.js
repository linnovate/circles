var express = require('express');
var expressValidator = require('express-validator');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var config = require(process.cwd() + '/config');

var basePath = config.version;
var baseUrl = '/api/' + basePath;

var routes = require('./routes');

var app = express();
// var passport = require('passport');

var consolidate = require('consolidate');

require('./swagger/swagger')(app);

app.use(favicon());
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(passport.initialize());
// app.use(passport.session());

app.use(expressValidator());
app.use(cookieParser());

app.use(baseUrl, routes);

//for swagger-ui:
app.use('/swagger', express.static('./swagger/swagger-ui'));
// assign the template engine to .html files
app.engine('html', consolidate[config.templateEngine]);
// set .html as the default extension
app.set('view engine', 'html');

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

module.exports = app;