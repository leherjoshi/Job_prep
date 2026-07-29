require('dotenv').config();
const app =require("./src/app");

const connectDB = require('./src/config/database');
const invokeGeminiAi =require("./src/services/ai.service")
const {resume,selfDescription,jobDescription}=require("./src/services/temp")
const {generateInterviewReport}=require("./src/services/ai.service")


connectDB();

generateInterviewReport({resume,selfDescription,jobDescription}).then((report)=>{
  console.log("Interview Report:", report);
}).catch((error)=>{
  console.error("Error generating interview report:", error);
});

//invokeGeminiAi() ;
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});