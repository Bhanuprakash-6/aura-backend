import mongoose  from "mongoose";
import{ DB_NAME } from "./constants.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
    path: "./.env"
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  })
})
.catch((error) => {
    console.error("Database connection failed:", error);   
})




//first approach to connect to the database
/*
import express from "express";

const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
    app.on("error", (err) => {
      console.error("Error connecting to the database:", err);
      throw err;
    })
    
    app.listen(process.env.PORT, () => {
        console.log(`first server is running on port ${process.env.PORT}`);
    })
  } catch (error) {
    console.error("Database connection error:", error);
    throw error; 
  }
})()
*/