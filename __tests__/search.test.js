const request = require("supertest");
const express = require("express");
const searchRouter = require("../src/shared/routes/search");

jest.mock("../src/features/notizie/services/dao-notizie", () => ({
  searchNotizie: jest.fn(),
}));
jest.mock("../src/features/eventi/services/dao-eventi", () => ({
  searchEventi: jest.fn(),
}));
jest.mock("../src/features/squadre/services/dao-squadre", () => ({
  searchSquadre: jest.fn(),
}));
jest.mock("../src/features/prenotazioni/services/dao-campi", () => ({
  searchCampi: jest.fn(),
}));

const daoNotizie = require("../src/features/notizie/services/dao-notizie");
const daoEventi = require("../src/features/eventi/services/dao-eventi");
const daoSquadre = require("../src/features/squadre/services/dao-squadre");
const daoCampi = require("../src/features/prenotazioni/services/dao-campi");

describe("Search Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set("view engine", "ejs");

    app.use((req, res, next) => {
      res.render = jest.fn((view, options) => {
        res.json({ view, options });
      });
      next();
    });

    app.use("/", searchRouter);
  });

  it("should render search page with no results if no query is provided", async () => {
    const response = await request(app).get("/search");

    expect(response.status).toBe(200);
    expect(daoNotizie.searchNotizie).not.toHaveBeenCalled();
    expect(response.body.view).toBe("search");
    expect(response.body.options.query).toBe("");
    expect(response.body.options.searchResults).toBeNull();
  });

  it("should render search page with results if query is provided", async () => {
    const mockNotizie = [{ id: 1, titolo: "Test", immagine_url: null, autore: "Admin" }];
    daoNotizie.searchNotizie.mockResolvedValue(mockNotizie);
    daoEventi.searchEventi.mockResolvedValue([]);
    daoSquadre.searchSquadre.mockResolvedValue([]);
    daoCampi.searchCampi.mockResolvedValue([]);

    const response = await request(app).get("/search?q=test");

    expect(response.status).toBe(200);
    expect(daoNotizie.searchNotizie).toHaveBeenCalledWith("%test%");
    expect(response.body.view).toBe("search");
    expect(response.body.options.query).toBe("test");
    expect(response.body.options.searchResults.notizie).toEqual(mockNotizie);
  });

  it("should handle error during search", async () => {
    daoNotizie.searchNotizie.mockRejectedValue(new Error("DB error"));

    const response = await request(app).get("/search?q=test");

    expect(response.status).toBe(200);
    expect(response.body.view).toBe("search");
    expect(response.body.options.error).toBe("Errore nella ricerca");
  });
});
