const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");
const path = require("path");
let token;
let userId;
let productId;

describe("User activities", () => {
  const testEmail = `test+${Date.now()}@gmail.com`;

  test("User Signup", async () => {
    let res = await request(app)
      .post("/api/signup")
      .field("name", "test")
      .field("email", testEmail)
      .field("password", "pass123")
      .field("role", "admin")
      .attach("profilePhoto", path.resolve(__dirname, "../trolley.png"));
    expect(res.statusCode).toBe(201);
    expect(res.body.msg).toBe("User Signup success");
  });

  test("User login", async () => {
    let res = await request(app)
      .post("/api/login")
      .send({ email: testEmail, password: "pass123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Login success");
    expect(res.body.accessToken).toBeDefined();

    token = res.body.accessToken;
    expect(token).toBeDefined();
    const decoded = jwt.decode(token);
    userId = decoded.userId;
  });

  test("Adding product", async () => {
    const res = await request(app)
      .post("/wareHouse/addProduct")
      .set("Authorization", `Bearer ${token}`)
      .field("productName", "Test1")
      .field("productPrice", 20)
      .field("productCompany", "Company1")
      .field("AvailableOptions", "green")
      .field("category", "testing2")
      .field("stock", 30)
      .attach("productImage", path.resolve(__dirname, "../trolley.png"));
    expect(res.statusCode).toBe(201);
    expect(res.body.product).toBeDefined();
    productId = res.body.product._id;
    console.log(productId);
  });

  test("Get products", async () => {
    const res = await request(app)
      .get("/wareHouse/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    // expect(res.body.msg).toBe("Products data fetched successfully from DB")
    expect(res.body.productData).toBeDefined();
  });

  //? Profile Edit
  test("Profile edit", async () => {
    const res = await request(app)
      .patch(`/myInfo/updateProfile/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", "NewUser");
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("User updated successfully");
  });

  // test("Place an order", async () => {
  //   const res = await request(app)
  //     .put(`/myInfo/orderThis/${productId}`)
  //     .set("Authorization", `Bearer ${token}`)
  //     .send({
  //       quantity: 1,
  //       paymentMode: "cod",
  //       paymentId: "fdfonawii454577djvn",
  //       paymentStatus: false,
  //     });
  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.msg).toBe("Order success");
  //   expect(res.body.orderId).toBeDefined();
  //   expect(res.status.paymentStatus).toBe("pending");
  //   expect(res.body.orderData).toBeDefined();
  // });

  test("Add to the cart", async () => {
    const res = await request(app)
      .put(`/myInfo/addToCart/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Product added to cart");
    expect(res.body.cartData).toBeDefined();
  });

  test("Show cart data", async () => {
    const res = await request(app)
      .get("/myInfo/cart")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.cart).toBeDefined();
  });

  test("Remove from cart", async () => {
    const res = await request(app)
      .delete(`/myInfo/removeFromCart/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.cart).toBeDefined();
  });

  test("Review products", async () => {
    const res = await request(app)
      .patch(`/myInfo/addRatingAndReview/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        review: {
          rating: 4,
          feedback: "Good testing cart",
        },
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Review added");
    expect(res.body.product).toBeDefined();
  });

  test("Add to wish list", async () => {
    const res = await request(app)
      .patch(`/myInfo/addToWishList/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Added to the wishList");
  });

  test("Wish Listed items", async () => {
    const res = await request(app)
      .get("/myInfo/wishList")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.wishList).toBeDefined();
  });

  test("Remove from wish list", async () => {
    const res = await request(app)
      .delete(`/myInfo/removeFromWishList/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.wishList).toBeDefined();
  });
});
