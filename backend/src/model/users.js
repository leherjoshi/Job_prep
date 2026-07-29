const moongoose = require('mongoose');

const userSchema = new moongoose.Schema({
  username :{
    type:String,
    unique:[true,"Username already exists"],
    required:[true,"Username is required"]

  },
  email:{
    type:String,
    unique:[true,"Email already exists"],
    required:[true,"Email is required"]
  },
  password:{
    type:String,
    required:[true,"Password is required"]
  }

})

const userModel = moongoose.model("users",userSchema);

module.exports =userModel;
