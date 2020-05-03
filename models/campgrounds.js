var mongoose= require("mongoose");


var yelp= new mongoose.Schema({
    name:String,
    price:Number,
    location:String,
    lat:Number,
    lng:Number,
    image:String,
    description:String,
    likes:[{
       type:mongoose.Schema.Types.ObjectId,
       ref:"User",
      
    }
  ],
    author:{
        id:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"User"
        },
        username:String
      },
    comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }],
});
var Campgrounds= mongoose.model("Campgrounds",yelp);

module.exports=Campgrounds;