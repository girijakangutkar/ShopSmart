const request = require("supertest");
const app = require("../server");
const jwt = require("jsonwebtoken");
const path = require("path");
let token;
let userId;
let productId;

describe("Product activities", () => {
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

  //   test("Get products", async () => {
  //     const res = await request(app)
  //       .get("/wareHouse/products")
  //       .set("Authorization", `Bearer ${token}`);
  //     expect(res.statusCode).toBe(200);
  //     // expect(res.body.msg).toBe("Products data fetched successfully from DB")
  //     expect(res.body.productData).toBeDefined();
  //   });

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

  test("Get product information", async () => {
    const res = await request(app)
      .get(`/wareHouse/getProduct/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
  });

  test("Get product review", async () => {
    const res = await request(app)
      .get(`/wareHouse/productDetails/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
  });

  test("Edit the product", async () => {
    const res = await request(app)
      .put(`/wareHouse/editProduct/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productName: "NewTestProduct" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test("Delete the products", async () => {
    const res = await request(app)
      .delete(`/wareHouse/deleteProduct/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Products deleted successfully");
  });
});
