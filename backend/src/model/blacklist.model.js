const mongoose=require('mongoose');

const blacklistScheme=new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required to be added in blacklist"  ]
    }
},
{
  timestamps:true
})

const tokenBlacklistModel=mongoose.model("blacklist",blacklistScheme);

module.exports=tokenBlacklistModel;

