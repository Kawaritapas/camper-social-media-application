var express=require("express");
var router=express.Router();
var Campgrounds=require("../models/campgrounds");
var User=require("../models/user");
var notification=require("../models/notifications");
var methodOverride=require("method-override");
router.use(methodOverride("_method"));
var opencage=require("opencage-api-client");

router.use(async function(req,res,next){
  res.locals.error=req.flash("error");
  res.locals.success=req.flash("success");
  res.locals.currentuser=req.user;
  if(req.user){
    try{
    let user=await User.findById(req.user._id).populate("notification",null,{isRead:false}).exec();
    res.locals.notification=user.notification.reverse();
  }catch(err){
    console.log(err.message);
  }
}
  next();
});


router.get("/campgrounds",function(req,res){
    if(req.query.search){
      let regex= new RegExp(Regex(req.query.search));
      console.log(regex);
      Campgrounds.find({name:regex},function(err,camp){
          if(err){
           console.log(err)
          }else{
            var nomatch;
            if(camp.length<1){
            nomatch="No places matched please search something else";
            }
            res.render("campgrounds",{camp:camp});
          }
      })
    }else{
    Campgrounds.find().sort({_id:-1}).limit(30).find(function(err,camp){
       if(err){
         console.log(err);
         res.redirect("back");
       }else{
        res.render("campgrounds",{camp:camp});
       }
        });
      }
    }); 
router.post("/campgrounds",isLoggedIn,async function(req,res){
       var name=req.body.name;
       var image=req.body.image;
       var price=req.body.price;
       var description=req.body.description;
       var author ={
        id:req.user._id,
        username:req.user.username
      }
      var newCampground= {name:name,image:image,price:price,description:description,author:author}
      try{
        let campground=await Campgrounds.create(newCampground);
        let user= await User.findById(req.user._id).populate("followers").exec();
        let newnotification={
          username:req.user.username,
          campgroundid:campground.id
        }
        for(const follower of user.followers){
          let notifications=await notification.create(newnotification);
          follower.notification.push(notifications);
          follower.save();
        }
        res.redirect(`/campgrounds/${campground.id}`);
      }catch(err){
        req.flash("error",err.message);
        res.redirect("back")
      }
});
  
    router.get("/campgrounds/new",isLoggedIn,function(req,res){
        res.render("new.ejs");
    });
    
    router.get("/campgrounds/:id",function(req,res){
        Campgrounds.findById(req.params.id).populate("comments").exec(function(err,found){
         if(err){
          console.log(err);
         }else{
            res.render("show",{camp:found});  
            console.log(found);
         }
        });
    });
    router.get("/campgrounds/:id/edit",checkuser,function(req,res){
        Campgrounds.findById(req.params.id,function(err,camp){
          res.render("updateCampground",{camp:camp});
        });
    });
    router.get("/:id",checkuser,function(req,res){
      Campgrounds.findByIdAndRemove(req.params.id,function(err,camp){
    if(err){
      req.flash("error","couldn't remove the campground ")
      res.redirect("/campgrounds");
    }else{
      req.flash("success","successfully removed the campground");
      res.redirect("/campgrounds")
    } 
      })
    })


router.put("/campgrounds/:id",checkuser,function(req,res){
  opencage.geocode({q: req.body.location}).then(data => {
    console.log(JSON.stringify(data));
    if (data.status.code == 200) {
      if (data.results.length > 0) {
        var place = data.results[0];
        req.body.lat=place.geometry.lat;
        req.body.lng=place.geometry.lng;
        req.body.location=place.formatted;
        Campgrounds.findByIdAndUpdate(req.params.id,req.body,function(err,updated){
          if(err){
          console.log(err);
          req.flash("error","couldnt update the campgrounds")
          res.redirect("back");
          }else{
            req.flash("success","successfully updated the campground");
            res.redirect("/campgrounds/"+updated._id);
          }
        });
  
      }
    } else if (data.status.code == 402) {
      console.log('hit free-trial daily limit');
      console.log('become a customer: https://opencagedata.com/pricing'); 
    } else {
      console.log('error', data.status.message);
    }
  }).catch(error => {
    console.log('error', error.message);
  });
});

router.post("/likes/:id",function(req,res){
   Campgrounds.findById(req.params.id,function(err,camp){
      if(err){
        console.log(err);
      }else{
       camp.likes.push(req.user);
       camp.save()
       res.redirect("back")
      }
   });
})

router.post("/likes/:id/unlike",function(req,res){
   Campgrounds.findById(req.params.id,function(err,camp){
     if(err){
       console.log(err);
     }else{
       camp.likes.pop(req.user);
       camp.save()
       res.redirect("back")
     }
   })
})

    function isLoggedIn(req,res,next){
        if(req.isAuthenticated()){
      return next();
        }else{
          req.flash("error","please login");
          res.redirect("/login");
        }
      }


   function checkuser(req,res,next){
     if(req.isAuthenticated()){
       Campgrounds.findById(req.params.id,function(err,camp){
 if(err){
   req.flash("error","could not find the campground")
   res.redirect("back");
 }else{
  if(camp.author.id.equals(req.user._id)){
   return next();
  } else{
    req.flash("error","permission denied");
    res.redirect("back");
  }    }
})
     }else{
       req.flash("error","you need to be signed in")
       res.redirect("back")
     }
   };   


   function Regex(text){
     return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
   }
    module.exports=router;
    