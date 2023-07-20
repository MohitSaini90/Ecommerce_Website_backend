import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  filterProductController,
  productCountController,
  productListController,
  searchProductController,
  searchSimilarProductController,
  productCategoryController,
  orderController,
} from "../controllers/productController.js";
import formidable from "express-formidable";

//router object
const router = express.Router();

//Routing
//create product
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);
//get all products
router.get("/get-product", getProductController);

//get single products
router.get("/get-product/:slug", getSingleProductController);

//get photo
router.get("/product-photo/:pid", productPhotoController);

//delete product
router.delete(
  "/delete-product/:pid",
  requireSignIn,
  isAdmin,
  deleteProductController
);

//update product
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

//filter product
router.post("/product-filter", filterProductController);

//Below 2 are for pagination

//count procuct
router.get("/product-count", productCountController);

//count procuct
router.get("/product-list/:page", productListController);

//search product
router.get("/search-product/:keyword", searchProductController);

//search similar products
router.get("/search-similar-product/:pid/:cid", searchSimilarProductController);

//search similar products
router.get("/product-category/:slug", productCategoryController);

//place order
router.post("/place-order", orderController);

export default router;
