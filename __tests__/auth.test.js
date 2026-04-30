"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const auth = require('../src/core/middlewares/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            isAuthenticated: jest.fn().mockReturnValue(false),
            headers: { accept: 'text/html' },
            logout: jest.fn(cb => cb()),
            user: null,
            params: {},
            path: '/'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('isLoggedIn', () => {
        it('should call next if authenticated and active', async () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { id: 1, isBannato: () => false, isSospeso: () => false };
            await auth.isLoggedIn(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if not authenticated', async () => {
            await auth.isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.render).toHaveBeenCalledWith('error', expect.anything());
        });

        it('should return 401 JSON if not authenticated and accept json', async () => {
            req.headers.accept = 'application/json';
            await auth.isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });

        it('should return 403 if user is bannato', async () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { id: 1, isBannato: () => true };
            await auth.isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(req.logout).toHaveBeenCalled();
        });

        it('should handle sospensione scaduta', async () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { id: 1, isBannato: () => false, isSospeso: () => true };
            
            const daoSospensioni = require("../src/features/users/services/dao-sospensioni");
            jest.mock("../src/features/users/services/dao-sospensioni", () => ({
                getByUtenteId: jest.fn().mockResolvedValue({ data_fine: new Date(Date.now() - 10000).toISOString() }),
                revocaSospensioneBan: jest.fn().mockResolvedValue(true)
            }));

            await auth.isLoggedIn(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if sospensione is still active', async () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { id: 1, isBannato: () => false, isSospeso: () => true };
            
            const daoSospensioni = require("../src/features/users/services/dao-sospensioni");
            daoSospensioni.getByUtenteId.mockResolvedValue({ data_fine: new Date(Date.now() + 10000).toISOString(), motivo: 'Test' });

            await auth.isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(req.logout).toHaveBeenCalled();
        });
    });

    describe('Role checks', () => {
        it('isAdmin should call next for admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { tipo_utente_id: 1 };
            auth.isAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('isAdmin should return 403 for non-admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { tipo_utente_id: 2 };
            auth.isAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('isDirigente should call next for dirigente', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { tipo_utente_id: 2 };
            auth.isDirigente(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('isAdminOrDirigente should allow both', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { tipo_utente_id: 1 };
            auth.isAdminOrDirigente(req, res, next);
            expect(next).toHaveBeenCalled();
            
            req.user = { tipo_utente_id: 2 };
            auth.isAdminOrDirigente(req, res, next);
            expect(next).toHaveBeenCalledTimes(2);
        });
    });

    describe('Complex permissions', () => {
        it('canManageCampi should allow multiple roles', () => {
            req.isAuthenticated.mockReturnValue(true);
            [1, 2, 3, 5, 6].forEach(roleId => {
                req.user = { tipo_utente_id: roleId };
                auth.canManageCampi(req, res, next);
            });
            expect(next).toHaveBeenCalledTimes(5);
        });

        it('isStaffOrAdmin should allow staff roles', () => {
            req.isAuthenticated.mockReturnValue(true);
            [1, 2, 3, 5].forEach(roleId => {
                req.user = { tipo_utente_id: roleId };
                auth.isStaffOrAdmin(req, res, next);
            });
            expect(next).toHaveBeenCalledTimes(4);
        });
    });
});
