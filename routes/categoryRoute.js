import express from "express";
import {
  createCategoryController,
  updateCategoryController,
  allcategoryController,
  singleCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
//router object
const router = express.Router();

//Routing
//create category
router.post(
  "/create-category",
  requireSignIn,
  isAdmin,
  createCategoryController
);
//update category
router.put(
  "/update-category/:id",
  requireSignIn,
  isAdmin,
  updateCategoryController
);
//getall categories
router.get("/get-category", allcategoryController);
//get single category
router.get("/single-category/:slug", singleCategoryController);

//delete category
router.delete(
  "/delete-category/:id",
  requireSignIn,
  isAdmin,
  deleteCategoryController
);

export default router;
