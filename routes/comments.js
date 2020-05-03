var express=require("express");
var router =express.Router();
var Campgrounds=require("../models/campgrounds");
var User=require("../models/user");
var notification=require("../models/notifications")
var Comment=require("../models/comment");
router.use(function(req,res,next){
  res.locals.message=req.flash("error");
  res.locals.currentuser=req.user;
  next();
});
router.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
    Campgrounds.findById(req.params.id,function(err,found){
        if(err){
          console.log(err);
        }else{
          res.render("newcomment",{camp:found});
        }
    });
   });
   
   router.post("/campgrounds/:id/comment",isLoggedIn, function(req,res){
       Campgrounds.findById(req.params.id,function(err,found){
         if(err){
           console.log(err);
           res.redirect("/campgrounds")
         }else{
           Comment.create(req.body.comment,async function(err,comment){
               try{
                comment.author.id=req.user._id;
                comment.author.username=req.user.username;
                comment.save();
                found.comments.push(comment);
                found.save();
                req.flash("success","successfully added the comment")
                res.redirect("/campgrounds/"+found._id); 
                
                 let user = await User.findById(req.user._id).populate('followers').exec();
                 let newNotification = {
                 username: req.user.username,
                 commentid: req.params.id,
                
                }
                for(const follower of user.followers) {
                  let notifications = await notification.create(newNotification);
                  follower.notification.push(notifications);
                  follower.save();
                }
                res.redirect(`/campgrounds/${found._id}`);
               }catch(err){
                 req.flash("error",err.message);
                 res.redirect("back");
               }
           })
         }
       })
   })
   //edit
   router.get("/campgrounds/:id/:commentsid/edit",checkuser,function(req,res){
     Comment.findById(req.params.commentsid,function(err,comment){
     res.render("updatecomment",{camp_id:req.params.id,comment:comment})
     });
   });


router.put("/campgrounds/:id/comments/:commentsid",checkuser,function(req,res){
   Comment.findByIdAndUpdate(req.params.commentsid,req.body.comment,function(err,comment){
      if(err){
        console.log(err);
      }else{
        req.flash("success","successfully updated the comment");
        res.redirect("/campgrounds/"+req.params.id);
      }
   });
});

router.get("/campgrounds/:id/:commentsid/delete/deleted",checkuser,function(req,res){
 Comment.findOneAndRemove(req.params.commentsid,function(err,comment){
  if(err){
    req.flash("error","couldnt remove the error");
    res.redirect("back");
  }else{
    req.flash("success","successfully removed the comment");
    res.redirect("/campgrounds/"+req.params.id);
  }
 });
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
  return next();
    }else{
      req.flash("error","please login")
      res.redirect("/login");
    }
  }

function checkuser(req,res,next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.commentsid,function(err,comment){
      if(err){
        req.flash("error","no campgrounds found")
        res.redirect("back");
      }else{
        if(comment.author.id.equals(req.user._id)){
          return next();
        }else{
          req.flash("error","permission denied");
          res.send("this comment doesnt belong to you");
        }
      }
       });
  }else{
    req.flash("error","please login");
    res.redirect("back");
  }

}


module.exports=router;