var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var mongoskin = require('mongoskin');
var exphbs  = require('express-handlebars');
var db = mongoskin.db('mongodb://localhost:27017/recipedb',{native_parser:true});
var multer=require("multer");

var routes = require('./routes/index');
var users = require('./routes/users');
var recipes = require('./routes/recipes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('views', '../views');
app.engine('.handlebars', exphbs({extname: '.handlebars',defaultLayout: 'main',layoutsDir:'../views/layouts',helpers:{rootDir:
function(){
return "https://recipes-adamkilpatrick.c9.io";    
},
//This function does all the output for the unit types when viewing recipes
unitTypeFormat:function(){
    if(this.unitType=="custom"||this.unitType==undefined)
    {
        return "<span class=\"btn btn-primary disabled\">"+this.unit+"</span>";
    }
    if(this.unitType=="volume")
    {
        return "<div class=\"btn-group\"><i class=\"dropdown-arrow dropdown-arrow-inverse\"></i><button class=\"btn btn-primary status disabled\">"+this.unit+"</button><button class=\"btn btn-primary dropdown-toggle\" data-toggle=\"dropdown\"><span class=\"caret\"></span> </button><ul class=\"dropdown-menu dropdown-inverse volumeDrop\"></ul></div>";
    }
    if(this.unitType=="weight")
    {
        return "<div class=\"btn-group\"><i class=\"dropdown-arrow dropdown-arrow-inverse\"></i><button class=\"btn btn-primary status disabled\">"+this.unit+"</button><button class=\"btn btn-primary dropdown-toggle\" data-toggle=\"dropdown\"><span class=\"caret\"></span> </button><ul class=\"dropdown-menu dropdown-inverse weightDrop\"></ul></div>";
    }
}
    
}}));
app.set('view engine', '.handlebars');


app.use(multer({
  dest: '../public/images',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
  }
}));
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/recipes',recipes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace


if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
