const { handleValidation, handleValidationRender } = require("../src/core/middlewares/validators");
const { validationResult } = require("express-validator");

jest.mock("express-validator", () => {
  const actual = jest.requireActual("express-validator");
  return {
    ...actual,
    validationResult: jest.fn(),
  };
});

describe("Middleware: validators", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("handleValidation", () => {
    it("should call next() if there are no validation errors", () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      handleValidation(req, res, next);
      
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should return 400 with properly formatted JSON if validation fails", () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { path: "email", msg: "Invalid email proxy format" },
          { param: "password", msg: "Too short" }
        ]
      });

      handleValidation(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email proxy format",
        errors: [
          { field: "email", message: "Invalid email proxy format" },
          { field: "password", message: "Too short" }
        ]
      });
    });
  });

  describe("handleValidationRender", () => {
    it("should call next() if no validation errors happen during render flow", () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const middleware = handleValidationRender("auth/login_page");
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.render).not.toHaveBeenCalled();
    });

    it("should return 400 and render identical view with extraData function and errors injected", () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { path: "nome", msg: "Obbligatorio" }
        ]
      });

      const cb = jest.fn((r) => ({ pageTitle: "Errore" }));
      const middleware = handleValidationRender("errors/page", cb);
      req.body = { testParam: "value" };
      
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(cb).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.render).toHaveBeenCalledWith("errors/page", {
        pageTitle: "Errore",
        error: "Obbligatorio",
        errors: [
          { field: "nome", message: "Obbligatorio" }
        ]
      });
    });

    it("should handle missing extraData function safely", () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ path: "x", msg: "y" }]
      });

      const middleware = handleValidationRender("view_name", null);
      middleware(req, res, next);

      expect(res.render).toHaveBeenCalledWith("view_name", {
        error: "y",
        errors: [{ field: "x", message: "y" }]
      });
    });
  });
});
