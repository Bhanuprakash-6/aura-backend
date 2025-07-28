import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN ,
        credentials: true
    }
));

//accept json in limit
app.use(express.json({limit: "16kb"}));
//accept from the url
app.use(express.urlencoded({extended: true, limit: "16kb"}));
//to store random image 
app.use(express.static("public"));
//to do some cookie operations
app.use(cookieParser());


//routes import
import userRouter from "./routes/user.routs.js";

//routes declaration
app.use("/api/v1/users", userRouter);
//app.use("/api/v1/users ", userRouter)

export{ app }