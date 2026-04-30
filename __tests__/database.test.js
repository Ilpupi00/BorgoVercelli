"use strict";

const { Pool } = require("pg");

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(),
  };
  return { 
    Pool: jest.fn(() => mPool),
    types: {
        setTypeParser: jest.fn()
    }
  };
});

describe("Database Config (database.js)", () => {
  let db;

  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.NODE_ENV = "test";
    jest.resetModules();
    db = require("../src/core/config/database");
  });

  describe("Initialization", () => {
    it("should throw error if DATABASE_URL is missing", () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      jest.resetModules();
      expect(() => require("../src/core/config/database")).toThrow("DATABASE_URL non impostata");
      process.env.DATABASE_URL = originalUrl;
    });

    it("should mask password in logs", () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        jest.resetModules();
        require("../src/core/config/database");
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Tentativo di connessione a:"), expect.stringContaining(":****@"));
        consoleSpy.mockRestore();
    });

    it("should handle pool error event", () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        // Access the pool created during require
        const errorHandler = db.pool.on.mock.calls.find(call => call[0] === 'error')[1];
        errorHandler(new Error("Async Error"));
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unexpected error"), expect.any(Error));
        errorSpy.mockRestore();
    });
  });

  describe("Placeholder Conversion", () => {
    it("should convert ? to $1, $2, etc.", (done) => {
        db.pool.query.mockResolvedValueOnce({ rows: [] });
        db.all("SELECT * FROM users WHERE id = ? AND status = ?", [1, 'active'], () => {
            expect(db.pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1 AND status = $2", [1, 'active']);
            done();
        });
    });
  });

  describe("Query methods", () => {
    it("db.get should return first row", (done) => {
      db.pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      db.get("SELECT * FROM x WHERE id = ?", [1], (err, row) => {
        expect(err).toBeNull();
        expect(row.id).toBe(1);
        done();
      });
    });

    it("db.get should return undefined if no rows", (done) => {
        db.pool.query.mockResolvedValueOnce({ rows: [] });
        db.get("SELECT * FROM x", (err, row) => {
          expect(row).toBeUndefined();
          done();
        });
      });

    it("db.all should return all rows", (done) => {
      db.pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      db.all("SELECT * FROM x", (err, rows) => {
        expect(err).toBeNull();
        expect(rows).toHaveLength(2);
        done();
      });
    });

    it("db.run should return rowCount and rows", (done) => {
      db.pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5 }] });
      db.run("INSERT INTO x", [], (err, result) => {
        expect(err).toBeNull();
        expect(result.rowCount).toBe(1);
        expect(result.rows).toHaveLength(1);
        done();
      });
    });

    it("db.query should return a Promise", async () => {
      db.pool.query.mockResolvedValueOnce({ rows: [{ ok: true }] });
      const res = await db.query("SELECT 1");
      expect(res.rows[0].ok).toBe(true);
    });

    it("db.close should call pool.end", async () => {
      await db.close();
      expect(db.pool.end).toHaveBeenCalled();
    });
  });

  describe("Error handling in methods", () => {
    it("db.get should handle query errors", (done) => {
      db.pool.query.mockRejectedValueOnce(new Error("Fail"));
      db.get("SELECT 1", (err) => {
        expect(err.message).toBe("Fail");
        done();
      });
    });

    it("db.all should handle query errors", (done) => {
        db.pool.query.mockRejectedValueOnce(new Error("Fail All"));
        db.all("SELECT 1", (err) => {
          expect(err.message).toBe("Fail All");
          done();
        });
    });

    it("db.run should handle query errors", (done) => {
        db.pool.query.mockRejectedValueOnce(new Error("Fail Run"));
        db.run("SELECT 1", (err) => {
          expect(err.message).toBe("Fail Run");
          done();
        });
    });
  });
});
