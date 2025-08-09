const request = require("supertest");
const app = require("../server");
const path = require("path");

describe("User Authentication", () => {
  const testEmail = `test+${Date.now()}@gmail.com`;

  test("User Signup", async () => {
    let res = await request(app)
      .post("/api/signup")
      .field("name", "test")
      .field("email", testEmail)
      .field("password", "pass123")
      .field("role", "user")
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
  });
});
