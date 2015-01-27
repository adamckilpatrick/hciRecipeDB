var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
            /*res.location("./recipes/recipelist");
            res.redirect("./recipes/recipelist");*/
            res.render('index',{homePage:true});
});

module.exports = router;
