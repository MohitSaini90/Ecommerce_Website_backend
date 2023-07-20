import slugify from "slugify";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import orderModel from "../models/orderModel.js";
import twilio from "twilio";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
//configure
dotenv.config();

/* Twilio whastsapp api(didn't work)*/
//const accountSid = process.env.TWILIO_ACCOUNT_SID;
//const authToken = process.env.TWILIO_AUTH_TOKEN;
//const client = twilio(accountSid, authToken);
/*Twilio whastsapp api */

export const createProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    //validations
    switch (true) {
      case !name:
        return res.status(500).send({ message: "Name is required!!" });
      case !description:
        return res.status(500).send({ message: "Description is required!!" });
      case !price:
        return res.status(500).send({ message: "Price is required!!" });
      case !category:
        return res.status(500).send({ message: "Category is required!!" });
      case !quantity:
        return res.status(500).send({ message: "Quantity is required!!" });
      case photo && photo.size > 100000000:
        return res
          .status(500)
          .send({ message: "Photo is required and should be less than 1mb!!" });
    }

    //saving product
    const product = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }
    await product.save();
    res.status(200).send({
      success: true,
      message: "Product created successfully!!",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error creating product!!",
    });
  }
};

export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "Product Results:",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error showing products!!",
    });
  }
};

export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .populate("category")
      .select("-photo");
    res.status(200).send({
      success: true,
      message: "Product results:",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error showing results!!",
      error,
    });
  }
};

export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error displaying photo!!",
      error,
    });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product deleted!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error deleting product!!",
      error,
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    //validations
    switch (true) {
      case !name:
        return res.status(500).send({ message: "Name is required!!" });
      case !description:
        return res.status(500).send({ message: "Description is required!!" });
      case !price:
        return res.status(500).send({ message: "Price is required!!" });
      case !category:
        return res.status(500).send({ message: "Category is required!!" });
      case !quantity:
        return res.status(500).send({ message: "Quantity is required!!" });
      case photo && photo.size > 100000000:
        return res.status(500).send({
          message: "Photo is required and should be less than 100mb!!",
        });
    }

    //saving product
    const product = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }
    await product.save();
    res.status(200).send({
      success: true,
      message: "Product updated successfully!!",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error updating product!!",
    });
  }
};

export const filterProductController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      message: "Filters applied!!",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: " Error applying filters!!",
      error,
    });
  }
};

export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();

    res.status(200).send({
      success: true,
      message: "Products counted successfully!!",
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: " Error count products!!",
      error,
    });
  }
};

export const productListController = async (req, res) => {
  try {
    const perPage = 2;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "Products pagified successfully!!",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: " Error performing pagination!!",
      error,
    });
  }
};

export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error searching product!!",
      error,
    });
  }
};

export const searchSimilarProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Success getting similar products!!",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting similar products!!",
      error,
    });
  }
};

export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      message: "Success getting category products!!",
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting products for category!!",
      error,
    });
  }
};

export const orderController = async (req, res) => {
  try {
    const { cart, buyerID } = req.body;

    const buyer = await userModel.findById(buyerID);

    let productsHTML = "";

    const len = cart.length;
    for (let i = 0; i < len; i++) {
      const p = cart[i];
      const productInfo = await productModel.findById(p._id).select("-photo");
      const productPhoto = await productModel.findById(p._id).select("photo");

      productsHTML += `
    <div>
      <h2>${productInfo.name}</h2>
      <p>Price: $${productInfo.price}</p>
      <p>Description: ${productInfo.description}</p>
      <img src="cid:photoDATA_${i}" alt="Product Image">
      </div>
  `;
    }

    const htmlContent = `
  <h1>Order Details</h1>
  <h2>Buyer Information:</h2>
  <p>Name: ${buyer.name}</p>
  <p>Email: ${buyer.email}</p>
  <p>Phone: ${buyer.phone}</p>
  <p>Address: ${buyer.address}</p>

  <h2>Products:</h2>
  ${productsHTML}
`;

    const attachments = [];
    for (let i = 0; i < cart.length; i++) {
      const p = cart[i];
      const productPhoto = await productModel.findById(p._id).select("photo");
      const base64Image = productPhoto.photo.data.toString("base64");
      const imageType = productPhoto.photo.contentType;

      attachments.push({
        filename: `product_image_${i}.jpg`, // Replace with a meaningful filename
        path: `data:${imageType};base64,${base64Image}`,
        cid: `photoDATA_${i}`, // Unique CID for each image
      });
    }

    /*Node Mailer */
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "Order Details",
      text: "ORDER",
      html: htmlContent,
      attachments: attachments,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    /*Node Mailer */

    const order = new orderModel({
      products: cart,
      buyer: buyerID,
    }).save();
    res.status(200).send({
      success: true,
      message: "Order Placed Successfully!!",
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error placing order!!",
      error,
    });
  }
};

/*

    const messageBody = `
NAME: ${buyer.name}
EMAIL: ${buyer.email}
PHONE: ${buyer.phone}
ADDRESS: ${buyer.address}
`;

     Twilio whastsapp api(didn't work)
    
    client.messages
      .create({
        body: messageBody,
        from: "whatsapp:+14155238886",
        to: "whatsapp:" + process.env.PHONENUMBER,
      })
      .then((message) => console.log(message.sid))
      .catch((error) => console.error(error));

    Send Cart with image 
    // Read the image from MongoDB and convert to base64
    const p1 = cart[0];
    const product = await productModel.findById(p1._id).select("photo");

    const base64Image = product.photo.data.toString("base64");

    client.messages
      .create({
        body: "Check out this image!",
        from: "whatsapp:+14155238886",
        to: "whatsapp:+916005862206",
        mediaUrl: [`data:${product.photo.contentType};base64,${base64Image}`], // Send base64-encoded data
      })
      .then((message) => console.log(message.sid))
      .catch((error) => console.error(error));
      
    Twilio whastsapp api(didn't work) 
 * /*/
