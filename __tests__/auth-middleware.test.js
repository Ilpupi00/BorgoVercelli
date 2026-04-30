"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const { isLoggedIn, isAdmin, isDirigente, isAdminOrDirigente, canManageCampi, isStaffOrAdmin, isGestoreCampo } = require('../src/core/middlewares/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            isAuthenticated: jest.fn().mockReturnValue(true),
            user: { 
                id: 1, 
                tipo_utente_id: 1, 
                isBannato: jest.fn().mockReturnValue(false), 
                isSospeso: jest.fn().mockReturnValue(false) 
            },
            headers: {},
            logout: jest.fn((cb) => cb())
        };
        res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('isLoggedIn', () => {
        it('should call next if authenticated and active', async () => {
            await isLoggedIn(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if not authenticated', async () => {
            req.isAuthenticated.mockReturnValue(false);
            await isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.render).toHaveBeenCalledWith('error', expect.any(Object));
        });

        it('should return 403 and logout if bannato', async () => {
            req.user.isBannato.mockReturnValue(true);
            await isLoggedIn(req, res, next);
            expect(req.logout).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should handle sospeso with daoSospensioni', async () => {
            req.user.isSospeso.mockReturnValue(true);
            // Mock daoSospensioni
            jest.mock('../../src/features/users/services/dao-sospensioni', () => ({
                getByUtenteId: jest.fn().mockResolvedValue({ data_fine: new Date(Date.now() + 100000), motivo: 'Test' }),
                revocaSospensioneBan: jest.fn().mockResolvedValue({})
            }), { virtual: true });

            await isLoggedIn(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('Role Based Access', () => {
        it('isAdmin should allow admin', () => {
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('isDirigente should allow dirigente', () => {
            req.user.tipo_utente_id = 2;
            isDirigente(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('isAdminOrDirigente should allow both', () => {
            req.user.tipo_utente_id = 2;
            isAdminOrDirigente(req, res, next);
            expect(next).toHaveBeenCalled();
            
            req.user.tipo_utente_id = 1;
            isAdminOrDirigente(req, res, next);
            expect(next).toHaveBeenCalledTimes(2);
        });

        it('isGestoreCampo should allow type 6', () => {
            req.user.tipo_utente_id = 6;
            isGestoreCampo(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('isStaffOrAdmin should allow types 1,2,3,5', () => {
            [1, 2, 3, 5].forEach(type => {
                req.user.tipo_utente_id = type;
                isStaffOrAdmin(req, res, next);
            });
            expect(next).toHaveBeenCalledTimes(4);
        });

        it('canManageCampi should allow types 1,2,3,5,6', () => {
            [1, 2, 3, 5, 6].forEach(type => {
                req.user.tipo_utente_id = type;
                canManageCampi(req, res, next);
            });
            expect(next).toHaveBeenCalledTimes(5);
        });
    });
});
