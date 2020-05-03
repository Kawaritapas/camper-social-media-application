var mongoose=require("mongoose");
var passportlocalmongoose=require("passport-local-mongoose");

var UserSchema= new mongoose.Schema({
    username:String,
    password:String,
    avatar:String,
    cover:String,
    phone:Number,
    dateofbirth:String,
    education:String,
    lives:String,
    website:String,
    languages:String,
    gender:String,
    aboutyou:String,
    firstName:String,
    lastName:String,
    resetPasswordExpires:Date,
    resetPasswordToken:String,
    email:{type:String,unique:true,required:true},
    notification:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"notification"
        }
    ],
   followers:[
       {
           type:mongoose.Schema.Types.ObjectId,
           ref:"User"
       }
   ]

});
UserSchema.plugin(passportlocalmongoose);
var User=mongoose.model("User",UserSchema);
module.exports=User;