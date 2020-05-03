var mongoose=require("mongoose");


var noti= new mongoose.Schema({
  username:String,
  campgroundid:String,
  commentid:String,
  isRead:{type:Boolean,default:false}
});

var notification=mongoose.model("notification",noti);

module.exports=notification;