var express = require('express');
var ObjectID=require('mongoskin').ObjectID;
var router = express.Router();


router.get('/newrecipe', function(req, res) {
    res.render('newrecipe', { pageTitle: 'Add New Recipe',createRecipePage:true });
});

router.get('/', function(req,res) {
            res.location("../recipes/recipelist");
            res.redirect("../recipes/recipelist");
});

router.get('/recipelist', function(req, res) {
    var db = req.db;
    //var collection = db.get('recipecollection');
    db.collection('recipecollection').find().toArray(function(e,docs){
        res.render('recipelist', {
            "list" : docs,
            "pageTitle" : "List",
            "listPage" : true
        });
    });
});

router.get('/recipesearch', function(req, res) {
    res.render('recipesearch');
});

router.get('/tagsearch/:tag',function(req,res){
   var db = req.db;
   var qtag=req.params.tag;
    //var collection = db.get('recipecollection');
    db.collection('recipecollection').find().toArray(function(e,docs){
        var filtered=[];
        for(var i=0; i<docs.length; i++)
        {
            if(docs[i].tags!=undefined&&docs[i].tags.indexOf(qtag)!=-1)
            {
                filtered.push(docs[i]);
            }
        }
        
        res.render('recipesearchresults', {
            "list" : filtered,
            "pageTitle" : "Recipes Tagged With "+qtag,
            "query" : req.params.tag
        });
    }); 
});

router.post('/searchrecipe', function(req, res) {
    var db = req.db;
    db.collection('recipecollection').ensureIndex({name:"text"},function(err,obj){if(err){console.log(err);}});
    db.collection('recipecollection').find({"$text":{"$search":req.body.query}}).toArray(function(err,items){
        if(err){console.log(err);}
        //Search through ingredients
        db.collection('recipecollection').find().toArray(function(err2,ingItems){
        if(err){console.log(err2);}
        var results = items;
        for(var i=0; i<ingItems.length; i++)
        {
            for(var k=0; k<ingItems[i].ingredients.length; k++)
            {
                //Match on ingredient
                if(ingItems[i].ingredients[k].ingredient.toLowerCase().indexOf(req.body.query.toLowerCase())>-1)
                {
                    //Add if not already in
                    var addFlag=true;

                    results.forEach(function(item)
                    {
                        //console.log(item._id+"---"+ingItems[i]._id);
                        if(item._id.toString()==ingItems[i]._id.toString())
                        {
                            addFlag=false;
                        }
                    });
                    if(addFlag)
                    {
                        results[results.length]=ingItems[i];
                    }
                    break;
                }
            }
        }
        
        res.render('recipesearchresults',{"list":results,"query":req.body.query});
        });
        //res.render('recipesearchresults',{"list":items});
    });
});

//PANTRY FUNCTIONALITY
router.get('/pantry',function(req,res){ 
    res.render('pantry',{"pantryPage":true});
});
function pantryCompare(pantryObj,recipe){
    if(recipe.ingredients===undefined)
    {
        console.log("pantrycheckFailed");
        return;
    }
    
    var missingIngs=[];
    for(var i=0; i<recipe.ingredients.length; i++)
    {
        var hasIng=false;
        for(var k=0; k<pantryObj.length; k++)
        {
            if(pantryObj[k].ingredient.toLowerCase()==recipe.ingredients[i].ingredient.toLowerCase())
            {
                hasIng=true;
                break;
            }
        }
        if(hasIng==false)
        {
            missingIngs.push(recipe.ingredients[i]);
        }
    }
    return missingIngs;
}
router.post('/pantrysearch',function(req,res){
    var pantry=[];
    for(var i=0; i<req.body.ingredients.length; i++)
    {
        pantry.push({ingredient:req.body.ingredients[i],amount:req.body.amounts[i],unit:req.body.units[i],unitType:req.body.types[i]});
    }
    
    var db = req.db;
    
    db.collection('recipecollection').find().toArray(function(err2,docs){
        var matches=[];
        var closeMatches=[];
        var closeIngs=[];
        for(var i=0; i<docs.length; i++)
        {
            var neededIngs=pantryCompare(pantry,docs[i]);
            if(neededIngs.length==0)
            {
                matches.push(docs[i]);
            }
            else if(neededIngs.length<3)
            {
                closeMatches.push(docs[i]);
                var closeIngsMatch=-1;
                //Holy shit this loopfuckery hopefully condenses the ingredient sets from the results i.e.:if you have multiple close matches that are just missing beef, they will be passed to the view under the same missing ingredient object
                for(var k=0; k<closeIngs.length;k++)
                {
                    for(var j=0; j<closeIngs[k].ingSet.length; j++)
                    {
                        var ingredientsMatch=false;
                        for(var q=0;q<neededIngs.length;q++)
                        {
                            if(neededIngs[q].ingredient.toLowerCase()==closeIngs[k].ingSet[j].ingredient.toLowerCase())
                            {
                                ingredientsMatch=true;
                            }
                        }
                        if(ingredientsMatch==false)
                        {
                            break;
                        }
                        if(j==closeIngs[k].ingSet.length-1)
                        {
                            closeIngsMatch=k;
                        }
                    }
                    if(closeIngsMatch!=-1)
                    {
                        break;
                    }
                }
                
                if(closeIngsMatch==-1)
                {
                    var ingString = "With ";
                    if(neededIngs.length==1)
                    {
                        ingString+=neededIngs[0].ingredient;
                    }
                    else
                    {
                        for(var k=0; k<neededIngs.length; k++)
                        {
                            if(k==neededIngs.length-1)
                            {
                                ingString+="and "+neededIngs[k].ingredient;
                            }
                            else
                            {
                                ingString+=neededIngs[k].ingredient+" ";
                            }
                        }
                    }
                    closeIngs.push({ingString:ingString,ingSet:neededIngs,recSet:[docs[i]]});
                }
                else
                {
                    closeIngs[closeIngsMatch].recSet.push(docs[i]);
                }
            }
        }
        closeIngs.sort(function(a,b){
           return (a.ingSet.length-b.ingSet.length); 
        });
        
        while(closeIngs.length>4)
        {
            closeIngs.pop();
        }
        res.render('pantrysearchresults',{"list":matches,"closeMatches":closeIngs});
    });
});

router.get('/:id', function(req, res) {
    var db = req.db;
    //var collection = db.get('recipecollection');
    var o=ObjectID(req.params.id);
    db.collection('recipecollection').findOne({_id:o},function(e,docs){
        console.log(req.params.id);
        db.collection('recipecollection').find({"parentRecipe.id":req.params.id}).toArray(function(e,docs2){
        console.log(docs2.length);    
        res.render('viewrecipe', {
            "recipe" : docs,"childrenRecipesFull":docs2
        });});
    });
});


var fs=require("fs");
router.post('/addrecipe', function(req, res) {
    //take care of the imageFile
    var imgName="";
    if(req.files.imageFile!=undefined)
    {
        var tmp_path = req.files.imageFile.path;
        imgName=req.files.imageFile.name;
    }
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var name = req.body.recipename;
    var ingredient = req.body.ingredients;
    var amount = req.body.amounts;
    var unit = req.body.units;
    var unitType=req.body.types;
    var ingredients =[];
    var steps=req.body.steps;
    var tags=req.body.tagList;
    for (var i=0; i<ingredient.length;i++)
    {
        ingredients[ingredients.length]={"ingredient":ingredient[i],"amount":amount[i],"unit":unit[i],"unitType":unitType[i]};
    }
    var authorID = req.body.authorID;
    var authorName=req.body.authorName;
    
    // Set our collection
    var collection = db.collection('recipecollection');

    // Submit to the DB
    collection.insert({
        "name" : name,
        "ingredients" :  ingredients,
        "steps" : steps,
        "tags" : tags,
        "numFaves" : 0,
        "authorID" : authorID,
        "authorName":authorName,
        "childrenRecipes" : [],
        "parentRecipe" : undefined,
        "imgUrl":imgName
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // If it worked, set the header so the address bar doesn't still say /adduser
            res.location("/recipes/"+doc[0]._id);
            // And forward to success page
            res.redirect("/recipes/"+doc[0]._id);
        }
    });
});

router.get('/fork/:id', function(req, res) {
    var db = req.db;
    //var collection = db.get('recipecollection');
    var o=ObjectID(req.params.id);
    db.collection('recipecollection').findOne({_id:o},function(e,docs){
        //console.log(docs._id);
        res.render('forkrecipe', {
            "recipe" : docs
        });
    });
});

router.post('/forkrecipe', function(req, res) {
    //take care of the imageFile
    var imgName="";
    if(req.files!=null)
    {
        var tmp_path = req.files.imageFile.path;
        imgName=req.files.imageFile.name;
    }
    var db = req.db;
    //var collection = db.get('recipecollection');
    var o=ObjectID(req.body.parentid);

    // Get our form values. These rely on the "name" attributes
    var name = req.body.recipename;
    var ingredient = req.body.ingredients;
    var amount = req.body.amounts;
    var unit = req.body.units;
    var ingredients =[];
    var steps=req.body.steps;
    var unitType=req.body.types;
    var authorName=req.body.authorName;
    for (var i=0; i<ingredient.length;i++)
    {
        ingredients[ingredients.length]={"ingredient":ingredient[i],"amount":amount[i],"unit":unit[i],"unitType":unitType[i]};
    }
    var tags=req.body.tagList;
    var authorID = req.body.authorID;
    
    // Set our collection
    var collection = db.collection('recipecollection');
    var child = {
        "name" : name,
        "ingredients" :  ingredients,
        "steps" : steps,
        "parentRecipe" : {"id":req.body.parentid,"name":req.body.parentname},
        "childrenRecipes" : [],
        "numFaves":0,
        "tags":tags,
        "authorID":authorID,
        "authorName":authorName,
        "imgUrl":imgName
    };
    collection.insert(child,function(err, doc){
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            
            collection.update({_id:o},{$push:{childrenRecipes:{id:child._id,name:child.name}}},function(err,doc){
                if(err){console.log("ERROR UPDATING DB");}
            });
            res.location("/recipes/"+child._id);
            // And forward to success page
            res.redirect("/recipes/"+child._id);
            //res.render('viewrecipe',{"recipe":child})
        }
    });
});

module.exports = router;
