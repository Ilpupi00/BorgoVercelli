"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const { generateToken, verifyToken, jwtAuth } = require('../src/core/middlewares/jwt');
const jwt = require('jsonwebtoken');
const userDao = require('../src/features/users/services/dao-user');

jest.mock('../src/features/users/services/dao-user');

describe('JWT Middleware', () => {
    const mockUser = { id: 1, email: 'test@test.com', tipo_utente_id: 1 };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('generateToken should create a valid JWT', () => {
        const token = generateToken(mockUser);
        expect(typeof token).toBe('string');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-this-in-production");
        expect(decoded.id).toBe(mockUser.id);
        expect(decoded.email).toBe(mockUser.email);
    });

    it('verifyToken should decode valid token', () => {
        const token = generateToken(mockUser);
        const decoded = verifyToken(token);
        expect(decoded.id).toBe(mockUser.id);
    });

    it('verifyToken should return null for invalid token', () => {
        expect(verifyToken('not-a-token')).toBeNull();
    });

    describe('jwtAuth middleware', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                isAuthenticated: jest.fn().mockReturnValue(false),
                cookies: {},
                path: '/dashboard',
                logIn: jest.fn((user, cb) => cb(null))
            };
            res = {
                clearCookie: jest.fn()
            };
            next = jest.fn();
        });

        it('should continue if already authenticated', async () => {
            req.isAuthenticated.mockReturnValue(true);
            await jwtAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.logIn).not.toHaveBeenCalled();
        });

        it('should continue if no rememberToken cookie', async () => {
            await jwtAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.logIn).not.toHaveBeenCalled();
        });

        it('should skip for logout path', async () => {
            req.path = '/Logout';
            req.cookies.rememberToken = 'some-token';
            await jwtAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.logIn).not.toHaveBeenCalled();
        });

        it('should login user if token is valid and user exists', async () => {
            const token = generateToken(mockUser);
            req.cookies.rememberToken = token;
            userDao.getUserById.mockResolvedValue(mockUser);
            
            await jwtAuth(req, res, next);
            
            expect(userDao.getUserById).toHaveBeenCalledWith(mockUser.id);
            expect(req.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
            expect(next).toHaveBeenCalled();
        });

        it('should clear cookie and continue if token is invalid', async () => {
            req.cookies.rememberToken = 'invalid-token';
            await jwtAuth(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith('rememberToken');
            expect(next).toHaveBeenCalled();
        });

        it('should clear cookie if user does not exist', async () => {
            const token = generateToken(mockUser);
            req.cookies.rememberToken = token;
            userDao.getUserById.mockResolvedValue(null);
            
            await jwtAuth(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith('rememberToken');
            expect(next).toHaveBeenCalled();
        });

        it('should handle logIn errors', async () => {
            const token = generateToken(mockUser);
            req.cookies.rememberToken = token;
            userDao.getUserById.mockResolvedValue(mockUser);
            req.logIn.mockImplementation((user, cb) => cb(new Error('Login fail')));
            
            await jwtAuth(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith('rememberToken');
            expect(next).toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            const token = generateToken(mockUser);
            req.cookies.rememberToken = token;
            userDao.getUserById.mockRejectedValue(new Error('DB error'));
            
            await jwtAuth(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith('rememberToken');
            expect(next).toHaveBeenCalled();
        });
    });
});
