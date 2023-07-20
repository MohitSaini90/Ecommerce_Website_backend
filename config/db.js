import mongoose from "mongoose";
import colors from "colors";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.Mongo_URL);
    console.log(
      `Connected to DataBase ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Error occured: ${error}`.bgMagenta.white);
  }
};

export default connectDB;
