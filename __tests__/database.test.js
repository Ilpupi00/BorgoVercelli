const pg = require("pg");

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
  };
  return {
    Pool: jest.fn(() => mPool),
    types: {
      setTypeParser: jest.fn()
    }
  };
});

describe("Database Configuration & Wrapper", () => {
  let db;
  let pool;

  beforeAll(() => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.NODE_ENV = "test";
    db = require("../src/core/config/database");
    pool = db.pool;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("convertQuestionPlaceholders", () => {
    it("should convert ? into $1, $2, etc.", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await db.query("SELECT * FROM table WHERE id = ? AND name = ?", [1, "test"]);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM table WHERE id = $1 AND name = $2", [1, "test"]);
    });
  });

  describe("get", () => {
    it("should resolve with first row if results exist", (done) => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Test" }] });
      db.get("SELECT * FROM test", [], (err, row) => {
        expect(err).toBeNull();
        expect(row).toEqual({ id: 1, name: "Test" });
        done();
      });
    });

    it("should resolve with undefined if no rows exist", (done) => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      db.get("SELECT * FROM test", [], (err, row) => {
        expect(err).toBeNull();
        expect(row).toBeUndefined();
        done();
      });
    });

    it("should support omitting params", (done) => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      db.get("SELECT * FROM test", (err, row) => {
        expect(err).toBeNull();
        expect(row.id).toBe(2);
        done();
      });
    });

    it("should return error on failure", (done) => {
      pool.query.mockRejectedValueOnce(new Error("DB Error"));
      db.get("SELECT * FROM test", (err, row) => {
        expect(err.message).toBe("DB Error");
        expect(row).toBeUndefined();
        done();
      });
    });
  });

  describe("all", () => {
    it("should resolve with all rows", (done) => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValueOnce({ rows: mockRows });
      db.all("SELECT * FROM test", [], (err, rows) => {
        expect(err).toBeNull();
        expect(rows).toEqual(mockRows);
        done();
      });
    });

    it("should support omitting params", (done) => {
      const mockRows = [{ id: 1 }];
      pool.query.mockResolvedValueOnce({ rows: mockRows });
      db.all("SELECT * FROM test", (err, rows) => {
        expect(err).toBeNull();
        expect(rows).toEqual(mockRows);
        done();
      });
    });

    it("should return error on failure", (done) => {
      pool.query.mockRejectedValueOnce(new Error("DB Error"));
      db.all("SELECT * FROM test", (err, rows) => {
        expect(err.message).toBe("DB Error");
        expect(rows).toBeUndefined();
        done();
      });
    });
  });

  describe("run", () => {
    it("should resolve with rowCount and rows", (done) => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
      db.run("UPDATE test SET val = 1", [], (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual({ rowCount: 1, rows: [{ id: 1 }] });
        done();
      });
    });

    it("should support omitting params", (done) => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });
      db.run("UPDATE test SET val = 1", (err, result) => {
        expect(err).toBeNull();
        expect(result.rowCount).toBe(1);
        done();
      });
    });

    it("should return error on failure", (done) => {
      pool.query.mockRejectedValueOnce(new Error("DB Error"));
      db.run("UPDATE test SET val = 1", (err, result) => {
        expect(err.message).toBe("DB Error");
        expect(result).toBeUndefined();
        done();
      });
    });
  });

  describe("query", () => {
    it("should return a promise", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const promise = db.query("SELECT * FROM test");
      expect(promise).toBeInstanceOf(Promise);
      const res = await promise;
      expect(res.rows).toEqual([{ id: 1 }]);
    });
    
    it("should handle error promise", async () => {
      pool.query.mockRejectedValueOnce(new Error("Promise DB Error"));
      await expect(db.query("SELECT * FROM test")).rejects.toThrow("Promise DB Error");
    });
  });

  describe("close", () => {
    it("should call pool.end", () => {
      db.close();
      expect(pool.end).toHaveBeenCalled();
    });
  });
});
