import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoute from "./routes/authRoute.js";
import cors from "cors";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

//configure
dotenv.config();
connectDB();

//ESModule fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//For forgot password UI
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

//middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(express.static(path.join(__dirname, "./client/build")));
//Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/products", productRoute);
//REST API
/*
app.get("/", (req, res) => {
  res.send("<h1>Welcome</h1>");
});
*/
app.use("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

//PORT
const PORT = process.env.PORT || 8080;

// RUN PORT
app.listen(PORT, () => {
  console.log(
    `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
  );
});
