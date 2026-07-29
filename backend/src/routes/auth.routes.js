const { Router }=require('express');
const authController=require("../controllers/auth.controller");
const authRouter =Router();
const authMiddleware= require("../middlewares/auth.middleware")
/**
 * @route POST /api/auth/register
 * @description Restister a new user 
 * @acess Public
 */

authRouter.post("/register",authController.registerUserController);

/**
 * @route post /api/auth/login
 * @description login a user with email and password
 * @acess Public  
 */

authRouter.post("/login",authController.loginUserController);


/**
 * @route get /api/auth/logout
 * @description logout a user and clear the cookie also add it in blacklist
 * @acess Public  
 */

authRouter.get("/logout",authController.logoutUserController);

/**
 * @route get /api/auth/get-me
 * @description get the logged in user details
 * @acess Private  
 */

authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController);




module.exports=authRouter;