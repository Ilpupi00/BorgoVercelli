"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoUser = require('../src/features/users/services/dao-user');
const bcrypt = require('bcrypt');

jest.mock('../src/core/config/database');
jest.mock('bcrypt');
jest.mock('../../../shared/utils/file-helper', () => ({
    deleteImageFile: jest.fn()
}), { virtual: true });

describe('DAO User', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createUser should hash password and call db.run', async () => {
        bcrypt.hash.mockResolvedValue('hashed_pass');
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoUser.createUser({ email: 'test@test.com', password: 'password', nome: 'N', cognome: 'C' });
        expect(res.message).toBe('User created successfully');
        expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    });

    it('getUserById should return a User instance', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, email: 'test@test.com', nome: 'Test' }));
        const res = await daoUser.getUserById(1);
        expect(res.id).toBe(1);
        expect(res.email).toBe('test@test.com');
    });

    it('getUser should authenticate user correctly', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, email: 'test@test.com', password_hash: 'hashed' }));
        bcrypt.compare.mockResolvedValue(true);
        const res = await daoUser.getUser('test@test.com', 'password');
        expect(res.id).toBe(1);
        expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
    });

    it('getUser should reject invalid password', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, password_hash: 'hashed' }));
        bcrypt.compare.mockResolvedValue(false);
        await expect(daoUser.getUser('test@test.com', 'wrong')).rejects.toEqual({ error: 'Invalid password' });
    });

    it('getUserByEmail should return user or null', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, email: 'test@test.com' }));
        const res = await daoUser.getUserByEmail('TEST@TEST.COM');
        expect(res.id).toBe(1);
        
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const resNull = await daoUser.getUserByEmail('none@test.com');
        expect(resNull).toBeNull();
    });

    it('updateUser should update multiple fields', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoUser.updateUser(1, { nome: 'New', cognome: 'Name' });
        expect(res).toBe(true);
    });

    it('getTipiUtente should return all roles', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'Admin' }]));
        const res = await daoUser.getTipiUtente();
        expect(res).toHaveLength(1);
        expect(res[0].nome).toBe('Admin');
    });

    it('changePassword should verify old and set new', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { password_hash: 'old_hash' }));
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('new_hash');
        db.run.mockImplementation((sql, params, cb) => cb(null));
        
        const res = await daoUser.changePassword(1, 'old', 'new');
        expect(res.message).toContain('successo');
    });

    it('getStatistiche should return a complex object', async () => {
        db.query.mockImplementation((sql, cb) => cb(null, { rows: [{ count: 10 }] }));
        const stats = await daoUser.getStatistiche();
        expect(stats.utentiTotali).toBe(10);
        expect(stats.notizieTotali).toBe(10);
    });

    it('searchUsers should work with onlyDirigenti true/false', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'U' }]));
        const res1 = await daoUser.searchUsers('test', true);
        expect(res1).toHaveLength(1);
        const res2 = await daoUser.searchUsers('test', false);
        expect(res2).toHaveLength(1);
    });

    it('getGiocatoreByUserId should return player data', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, utente_id: 10, squadra_nome: 'S' }));
        const res = await daoUser.getGiocatoreByUserId(10);
        expect(res.squadra_nome).toBe('S');
    });

    it('updateProfilePicture should handle image replacement', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { url: '/old.jpg' }));
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 100 }], rowCount: 1 }));
        
        const res = await daoUser.updateProfilePicture(1, '/new.jpg');
        expect(res).toBe(true);
    });

    it('getImmagineProfiloByUserId should handle fallback to oauth', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }) // No image record
                .mockResolvedValueOnce({ rows: [{ foto_oauth: 'http://google.com/photo.jpg' }] });
        const res = await daoUser.getImmagineProfiloByUserId(1);
        expect(res).toBe('/api/proxy-image?url=http%3A%2F%2Fgoogle.com%2Fphoto.jpg');
    });

    it('getAllUsers should return all users', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
        const res = await daoUser.getAllUsers();
        expect(res).toHaveLength(1);
    });

    it('deleteUser should remove user', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoUser.deleteUser(1);
        expect(res.message).toContain('deleted successfully');
    });

    it('getUserStats should return user metrics', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { prenotazioni_totali: 5 }));
        const res = await daoUser.getUserStats(1);
        expect(res.prenotazioni_totali).toBe(5);
    });
});
