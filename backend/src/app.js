const express=require('express');

const cookieParser=require('cookie-parser');
const cors=require('cors');


const app=express();
app.use(cookieParser());
app.use(express.json());

// CORS configuration for both development and production
const allowedOrigins = [
    "http://localhost:5173", // Development
    process.env.FRONTEND_URL // Production (set in .env)
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// require all the routes here 
const authRouter=require("./routes/auth.routes");
const interviewRouter=require("./routes/interview.routes");
const mockInterviewRouter=require("./routes/mockInterview.routes");

// use the routes here
app.use("/api/auth",authRouter);
app.use("/api/interview",interviewRouter);
app.use("/api/mock-interview",mockInterviewRouter);


module.exports=app;

