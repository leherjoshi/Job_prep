const userModel=require("../model/users");

const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const tokenBlacklistModel=require("../model/blacklist.model");

/**
 * @name regiqsterUserController
 * @description register a new user,name,emalilmpassword 
 * @acess Public
 */


async function registerUserController(req,res){
  const {username,email,password}=req.body;
  if(!username||!email||!password){
    return res.status(400).json({
      success:false,
      message:"Please provide all required fields"
    });
  }

  const isUserExist=await userModel.findOne({
     $or:[{username},{email}]
  })

  if(isUserExist){
    return res.status(400).json({
      message:"Account already exist with this email address {isUserExist.email} or username {isUserExist.username}",
    })
  }
  const hashed=await bcrypt.hash(password,10)

  const newuser=await userModel.create({
    username,
    email,
    password:hashed
  })

  const token=jwt.sign({
    id:newuser._id,username:newuser.username
  },process.env.JWT_SECRET,{
    expiresIn:"1d"
  })

  res.cookie("token",token)

  return res.status(201).json({
    success:true,
    message:"User registered successfully",
    token,
    newuser:{
      id:newuser._id,
      username:newuser.username,
      email:newuser.email
    }
  })


}

/**
 * @name loginUserController
 * @description login a user with email and password
 * @acess Public
 */

  async function loginUserController(req,res){
    const {email,password}=req.body;
    if(!email||!password){
      return res.status(400).json({
        success:false,
        message:"Please provide all required fields"
      });
    }
    const user=await userModel.findOne({
      email
    })

    if(!user){
      return res.status(400).json({
        success:false,
        message:"Invalid email or password"
      })
    }

    const isPasswordMatch=await bcrypt.compare(password,user.password);  






    if(!isPasswordMatch){
      return res.status(400).json({
        success:false,
        message:"Invalid email or password"
      })
    }

    const token=jwt.sign({
      id:user._id,
      username:user.username
    },process.env.JWT_SECRET,{
      expiresIn:"1d"
    })

    res.cookie("token",token)

    return res.status(200).json({
      success:true,
      message:"User logged in successfully",
      user:{
        id:user._id,
        username:user.username,
        email:user.email
      }
    })
  }

/**
 * @name logoutUserController
 * @description logout a user and clear the cookie also add it in blacklist
 * @acess Public
 */

async function logoutUserController(req,res){
    const token = req.cookies.token;

    console.log("Token:", token);

    if(!token){
        return res.status(400).json({
            success:false,
            message:"No token found"
        });
    }

    const saved = await tokenBlacklistModel.create({ token });

    console.log("Saved document:", saved);

    res.clearCookie("token");

    return res.status(200).json({
        success:true,
        message:"User logged out successfully"
    });
}

/**
 * @routes getimecontroller
 * @description get the current logged in user details
 * @access private
 * 
 */

async function getMeController(req,res){
  const user=await userModel.findById(req.user.id)
  res.status(200).json({
    user:{
      id:user._id,
      username:user.username,
      email:user.email
    }
  })
}

module.exports={registerUserController,loginUserController,logoutUserController,getMeController}; 
