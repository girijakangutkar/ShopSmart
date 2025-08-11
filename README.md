# E-commerce Shop Smart

## Introduction

ShopSmart is an e-commerce platform that allows users to browse, purchase, and review products across various categories. The platform connects buyers with sellers and aims to provide a seamless shopping experience.

## Project Type

Backend

## Deployed App

Frontend: https://shop-smart-blush.vercel.app/
Backend: https://shopsmart-a2pp.onrender.com/

## Directory Structure

shopsmart/
├─ config/
├─ middlewares/
├─ models/
├─ routes/
├─ tests/
├─ server.js
├─ Docker
├─ .env
├─ .env.test

## 📸 App Screenshots

- **Home Page**  
  ![Home Page](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/Screenshot%20(1408).png)

- **Shopping Cart**  
  ![Shopping Cart](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/Screenshot%20(1409).png)

- **Order History**  
  ![Order History](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/Screenshot%20(1410).png)

- **Wish List**  
  ![Wish List](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/Screenshot%20(1411).png)

- **User Profile**  
  ![User Profile](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/Screenshot%20(1412).png)

## 🎥 Video Walkthrough of the Project

- [GitHub-hosted video](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/video1259025874.mp4)  
- [Google Drive video](https://drive.google.com/file/d/1UvJ6jRt6PRFimd-Frc6V7JFSqVcZXmcN/view?usp=sharing)

## 🧑‍💻 Video Walkthrough of the Codebase

- [GitHub-hosted video](https://github.com/girijakangutkar/ShopSmart/blob/main/assets/video2259025874.mp4)  
- [Google Drive video](https://drive.google.com/file/d/1uL4bXA2JokIrqzvyjrZ6fd_66Luv0Ljf/view?usp=sharing)


## Features

- Search and filter products
- Purchase products securely
- Leave reviews for products
- Add product to the cart
- WishList a product
- login/signup and forgot password
- caching data with redis

## Installation & Getting started

```bash
git clone https://github.com/girijakangutkar/ShopSmart.git

npm install

cd project_name

npm start
```

## Usage

.env credentials

- Need MONGO_URI
- Nodemailer credentials with gmail and password
- Razorpay credentials with api key and key secret
- Cloudinary credentials with cloud name, api key and api secret
- JWT secret for token creation

## Credentials

Admin:
-email: admin@gmail.com
-password: pass123

User:
-user: user@gmail.com
-password: pass123

## API Endpoints

- AUTH_ROUTES
    - POST /api/signup - user signup
    - POST /api/login - user login
    - POST /api/forgotPassword - user forgot password
    - POST /api/resetPassword - user reset password
    - GET /api/user/:userId - user details

- USER_ROUTES
  - GET /myInfo/orderHistory - get all orderHistory
  - GET /myInfo/order/:orderId - get particular order details
  - PUT /myInfo/cancelOrder/:orderId - cancel an order
  - PUT /myInfo/updateOrderStatus/:orderId - Update the orderStatus of an order
  - GET /myInfo/admin/allOrders - Get all orders as admin only
  - PUT /myInfo/orderThis/:productId - Order a product
  - PUT /myInfo/addToCart/:productId - Add a product to the cart
  - GET myInfo/car - View the products which are in the cart
  - DELETE /myInfo/removeFromCart/:productId - Remove a product from the cart
  - PATCH /myInfo/addRatingAndReview/:productId - Add a review for a product
  - GET /myInfo/wishList - Get the products which are in the wishlist
  - PATCH /myInfo/addToWishList/:productId - Add a product to the wishList
  - DELETE /myInfo/removeFromWishList/:productId - Remove a product from wishList
  - PATCH /myInfo/updateProfile/:userId - Updating user details

- PRODUCT_ROUTES
  - GET /wareHouse/public/products - Get products without authentication for showing them to the unauthorized user
  - GET /wareHouse/getProduct/:productId - Show product
  - GET /wareHouse/products - Show products with filter with authentication
  - POST /wareHouse/addProduct - Add a new product
  - PUT /wareHouse/editProduct/:productId - Edit a product
  - DELETE /wareHouse/deleteProduct/:productId - Delete a product
  - GET /wareHouse/productDetails/:productId - Get particular product details

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Docker
- redis
- Cloudinary
- NodeMailer



