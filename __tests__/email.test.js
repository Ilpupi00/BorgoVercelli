const request = require("supertest");
const express = require("express");
const emailRouter = require("../src/shared/routes/email");

jest.mock("../src/shared/services/email-service", () => ({
  sendEmail: jest.fn()
}));

jest.mock("../src/core/middlewares/validators", () => ({
  validateSendEmail: [(req, res, next) => next()]
}));

describe("Email Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/", emailRouter);
  });

  it("POST /send-email should succeed", async () => {
    require("../src/shared/services/email-service").sendEmail.mockResolvedValue({ messageId: "msg123" });
    const response = await request(app)
      .post("/send-email")
      .send({ name: "test", email: "test@test.com", subject: "Subj", message: "Hello", phone: "123" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("POST /send-email should handle errors", async () => {
    require("../src/shared/services/email-service").sendEmail.mockRejectedValue(new Error("Send failed"));
    const response = await request(app)
      .post("/send-email")
      .send({ name: "test", email: "test@test.com" });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Errore durante l'invio della mail.");
  });
});
