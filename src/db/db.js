import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDb connected !! DB HOST : ${connectionInstance.connection.host}`);
    }catch(error){
        console.log("MONGODB CONNECTION ERROR:", error);
        process.exit(1); // Exit the process with failure
    }
}

export default connectDB;