var express = require('express');
var ObjectID=require('mongoskin').ObjectID;
var router = express.Router();

/* GET users listing. */
router.get('/userlist', function(req, res) {
    var db = req.db;
    db.collection('usercollection').find().toArray(function(e, docs) {
        res.render('userlist', {
            "list" : docs
        });
    });
});

router.get('/newuser', function(req, res) {
    res.render('newuser', { title: 'Create new account' });
});

router.get('/login', function(req, res) {
    res.render('login', { pageTitle: 'Log in to account' });
    //res.send('respond with login page');
});

router.get('/logout', function(req, res) {
    res.render('logoutsegway', { pageTitle: 'Logging out...' });
});

//TODO clean this up
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.post('/adduser', function(req, res) {
    var db = req.db;
    
    var nickname = req.body.nickname;
    var email = req.body.email;
    //TODO search to check that the email is not yet taken
    var password = req.body.password;
    //TODO hash password for security
    
    //TODO link users to recipes via references
    
    var collection = db.collection('usercollection');
    
    collection.insert({
        "nickname" : nickname,
        "email" : email,
        "password" : password
    }, function(err, doc) {
        if (err) {
            res.send("There was a problem adding the user to the database.");
        } else {
            res.location("userlist");
            res.redirect("userlist");
        }
    });
});

router.get('/:id', function(req, res) {
    var db = req.db;
    var o=ObjectID(req.params.id);
    db.collection('usercollection').findOne({_id:o},function(e,docs){
        console.log(docs.email);
        console.log(docs.nickname);
        db.collection('recipecollection').find({authorID:req.params.id}).toArray(function(e2,docs2){
        res.render('viewuser', {
            "user" : docs,
            "recipes" :docs2
        });
        });
    });
});

router.post('/authuser', function(req, res) {
    var db = req.db;
    var emailAddr = req.body.email;
    console.log(emailAddr);
    console.log(req.body.password);
    //TODO hash password
    db.collection('usercollection').findOne({email:emailAddr},function(e,docs){
        //TODO catch error for non-existant email
        if (docs.password == req.body.password) {
            //res.send("correct password");
            res.location("loginsegway");
            res.render('loginsegway', { 
                userid: docs._id,
                nickname: docs.nickname
            });
            console.log(docs._id);
            //TODO redirect to intermediate page for saving session info, then to user's profile
        } else {
            res.location("login");
            res.render('login', {
                pageTitle: 'Log in to account',
                errMessage: 'Incorrect password',
                formEmail: emailAddr
            });
        }
    });
});

module.exports = router;
