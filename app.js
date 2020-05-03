var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var Campgrounds=require("./models/campgrounds");
var Comment=require("./models/comment");
var passport=require("passport");
var flash= require("connect-flash");
var localstrategy=require("passport-local");
var User=require("./models/user");
var passportlocalmongoose=require("passport-local-mongoose");
var commentsRoutes=require("./routes/comments");
var campgroundsRoutes=require("./routes/campgrounds");
var authRoutes=require("./routes/auth");
var methodOverride=require("method-override");
mongoose.set("useNewUrlParser",true);
mongoose.set("useUnifiedTopology",true);
mongoose.connect("mongodb://localhost/yelp_camp");
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine","ejs");
app.use(require("express-session")({
  secret:"tapas is going to be a web developer",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(bodyParser.urlencoded({extended:true}));


//important middleware code 
/*
app.use(function(req,res,next){
  res.locals.currentuser=req.user;
  next();
})
*/
app.use(function(req,res,next){
   res.locals.currentuser=req.user;
   next();
});
app.use(async function(req,res,next){
  res.locals.error=req.flash("error");
  res.locals.success=req.flash("success");
  res.locals.currentuser=req.user;
  if(req.user){
    try{
    let user=await User.findById(req.user._id).populate("notification",null,{isRead:true}).exec();
    res.locals.notification=user.notification.reverse();
  }catch(err){
    console.log(err.message);
  }
}
  next();
});

//routes
app.use(authRoutes);
app.use(campgroundsRoutes);
app.use(commentsRoutes);

app.listen(3002,function(req,res){
    console.log("server is starting");
});
