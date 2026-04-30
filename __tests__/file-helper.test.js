const fs = require("fs");
const path = require("path");
const { deleteImageFile, imageFileExists } = require("../src/shared/utils/file-helper");

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

describe("Utils: file-helper", () => {
  const mockImagePath = "/uploads/test-image.jpg";
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("deleteImageFile", () => {
    it("should return false if no url is provided", () => {
      expect(deleteImageFile(null)).toBe(false);
      expect(deleteImageFile("")).toBe(false);
    });

    it("should try to delete the file and return true if exists", () => {
      // Configuriamo isExists=true per almeno una di quelle chiamate
      fs.existsSync.mockReturnValueOnce(true); 

      const result = deleteImageFile(mockImagePath);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false and warn if file doesn't exist anywhere", () => {
      fs.existsSync.mockReturnValue(false);
      const result = deleteImageFile(mockImagePath);
      expect(result).toBe(false);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it("should not crash but return false if unlinkSync throws an error", () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error("EPERM mock error");
      });

      const result = deleteImageFile(mockImagePath);
      // Because unlink fails, fileFound remains false initially inside the block or block fails gracefully
      // Actually, looking at source code: 
      // try { fs.unlinkSync(..); fileFound=true; break;} catch { /* swallow */ }
      // If error is thrown, fileFound = false. Then warn block handles it.
      expect(result).toBe(false);
    });
  });

  describe("imageFileExists", () => {
    it("should return false if url is empty", () => {
      expect(imageFileExists("")).toBe(false);
    });

    it("should return true if fs.existsSync returns true", () => {
      fs.existsSync.mockReturnValueOnce(true);
      expect(imageFileExists("/custom/path.png")).toBe(true);
    });

    it("should return false if fs.existsSync always returns false", () => {
      fs.existsSync.mockReturnValue(false);
      expect(imageFileExists("/custom/path.png")).toBe(false);
    });
  });
});
