var express=require("express");
var router=express.Router();
var User=require("../models/user");
var notification=require("../models/notifications");
var Campgrounds=require("../models/campgrounds");
var passport=require("passport");
var async= require("async");
var nodemailer=require("nodemailer");
var crypto=require("crypto");
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
router.get("/",function(req,res){
    res.render("landing");
  });

router.get("/register",function(req,res){
    res.render("register");
 });
 
 router.post("/register",function(req,res){

      User.register(new User({
        username:req.body.username,
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        email:req.body.email,
        avatar:req.body.avatar,
      }),req.body.password,function(err,user){
     if(err){
       req.flash("error",err.message);
       return res.render("/register");
     }else{
       passport.authenticate("local")(req,res,function(){
         req.flash("success","Welcome to yelpcamp"+ user.username);
         res.redirect("/campgrounds");
       })
     }
      });
 })
 router.get("/login",function(req,res){
   res.render("login");
 });
 router.post("/login", passport.authenticate("local",{
   successRedirect:"/campgrounds",
   failureRedirect:"/login"
 }),function(req,res){
 });
 
 router.get("/logout",function(req,res){
   req.logOut();
  req.flash("success","logged you out!!");
   res.redirect("/campgrounds");
 });

router.get("/forgot",function(req,res){
   res.render("forgotpassword");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
          user: //your email id,
          pass: //your email password
        }
      });
      var mailOptions = {
        to: user.email,
        from: /*your email id*/,
        subject: 'Camper Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
   
    console.log(user);
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: //your email id,
          pass: process.env.GMAILPW //export GMAILPW=your password 
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'campertest999@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

 
router.get("/users/:id",isLoggedIn,async function(req,res){
  try {
    let user = await User.findById(req.params.id).populate('followers').exec();
    let campground=await Campgrounds.find({});
    res.render('profile', { user,campground:campground });
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

router.get("/follow/:id",function(req,res){
   User.findById(req.params.id,function(err,user){
    if(err){
      console.log(err);
    }else{
      user.followers.push(req.user._id);
      user.save();
      req.flash("success","you successfully followed"+user.username+ "!");
      res.redirect("/users/"+req.params.id);
    }
   });
});

router.get("/notifications",async function(req,res){
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notification',
      options: { sort: { "_id": -1 } }
    }).exec();
    let notifications = user.notification;
    res.render('notification', { notifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});
router.get("/notifications/:id",function(req,res){
   notification.findById(req.params.id,function(err,notification){
     if(err){
       console.log(err);
       res.redirect("back");
     }else{
       notification.isRead=true;
       notification.save();
       res.redirect("/campgrounds/"+notification.campgroundid);
     }
   });
})

router.put("/users/:id/edit/updated",isLoggedIn,function(req,res){
  User.findByIdAndUpdate(req.params.id,req.body,function(err,updated){
   if(err){
     console.log(err);
     res.redirect("back");
   }else{
     res.redirect("/users/"+req.params.id);
   }
  });
})

router.get("/users/:id/edit",isLoggedIn,function(req,res){
   User.findById(req.params.id,function(err,user){
  if(err){
    console.log(err);
    res.redirect("back");
  }else{
   res.render("updateprofile",{user:user});
  }
   });
});

router.get("/friends",isLoggedIn,function(req,res){
    User.find({},function(err,user){
  if(err){
    console.log(err);
  }else{
    res.render("addfriend",{user:user})
  }
    });
});


 function isLoggedIn(req,res,next){
   if(req.isAuthenticated()){
 return next();
   }else{
     res.render("login");
   }
 }
 
 module.exports=router;