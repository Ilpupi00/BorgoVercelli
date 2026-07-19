const request = require("supertest");
const express = require("express");
const sitemapRouter = require("../src/shared/routes/sitemap");

jest.mock("../src/features/notizie/services/dao-notizie", () => ({ getNotizieFiltered: jest.fn() }));
jest.mock("../src/features/eventi/services/dao-eventi", () => ({ getEventiPubblicati: jest.fn() }));
jest.mock("../src/features/squadre/services/dao-squadre", () => ({ getSquadre: jest.fn() }));

describe("Sitemap Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use("/", sitemapRouter);
  });

  it("GET /sitemap.xml should return valid xml", async () => {
    const daoNotizie = require("../src/features/notizie/services/dao-notizie");
    const daoEventi = require("../src/features/eventi/services/dao-eventi");
    const daoSquadre = require("../src/features/squadre/services/dao-squadre");

    daoNotizie.getNotizieFiltered.mockResolvedValue([{ id: 1, created_at: "2023-01-01T00:00:00Z" }]);
    daoEventi.getEventiPubblicati.mockResolvedValue([{ id: 1, created_at: "2023-01-01T00:00:00Z" }]);
    daoSquadre.getSquadre.mockResolvedValue([{ id: 1, created_at: "2023-01-01T00:00:00Z" }]);

    const response = await request(app).get("/sitemap.xml");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("application/xml");
    expect(response.text).toContain("<?xml");
    expect(response.text).toContain("/notizia/1");
    expect(response.text).toContain("/evento/1");
    expect(response.text).toContain("/getsquadra/1");
  });

  it("should handle errors gracefully", async () => {
    const daoNotizie = require("../src/features/notizie/services/dao-notizie");
    daoNotizie.getNotizieFiltered.mockRejectedValue(new Error("DB error"));
    
    // The error is caught internally and doesn't crash the route, it just logs
    const response = await request(app).get("/sitemap.xml");
    expect(response.status).toBe(200);
  });
});
