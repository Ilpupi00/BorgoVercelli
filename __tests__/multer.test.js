const fs = require("fs");
const path = require("path");

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock("multer", () => {
  const m = jest.fn().mockReturnValue({});
  m.diskStorage = jest.fn().mockImplementation((config) => config);
  return m;
});

describe("Multer config", () => {
  beforeEach(() => {
    jest.resetModules();
    require("fs").existsSync.mockReset();
    require("fs").mkdirSync.mockReset();
  });

  it("should create directory if it doesn't exist", () => {
    require("fs").existsSync.mockReturnValue(false);
    require("../src/core/config/multer");
    expect(require("fs").mkdirSync).toHaveBeenCalled();
  });

  it("should handle storage destination and filename", () => {
    require("fs").existsSync.mockReturnValue(true);
    const multerConfig = require("../src/core/config/multer");
    const multer = require("multer");
    
    expect(multerConfig.upload).toBeDefined();
    expect(multerConfig.uploadSquadra).toBeDefined();

    const config = multer.mock.calls[0][0];
    
    // Test fileFilter
    const cb = jest.fn();
    config.fileFilter(null, { mimetype: "image/png" }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);

    const cbError = jest.fn();
    config.fileFilter(null, { mimetype: "application/json" }, cbError);
    expect(cbError).toHaveBeenCalledWith(expect.any(Error), false);

    // Test storage config
    const storageConfig = multer.diskStorage.mock.calls[0][0];
    const cbDest = jest.fn();
    storageConfig.destination(null, null, cbDest);
    expect(cbDest).toHaveBeenCalledWith(null, multerConfig.uploadDir);

    const cbFile = jest.fn();
    storageConfig.filename(null, { originalname: "test file.png" }, cbFile);
    expect(cbFile).toHaveBeenCalledWith(null, expect.stringContaining("test_file.png"));

    // Test squadra storage config
    const squadraStorageConfig = multer.diskStorage.mock.calls[1][0];
    const cbSquadraFile = jest.fn();
    squadraStorageConfig.filename(null, { originalname: "test file.png" }, cbSquadraFile);
    expect(cbSquadraFile).toHaveBeenCalledWith(null, expect.stringContaining("squadra_"));
  });
});
