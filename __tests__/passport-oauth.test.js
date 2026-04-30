"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
process.env.GOOGLE_CLIENT_ID = 'g-id';
process.env.GOOGLE_CLIENT_SECRET = 'g-secret';
process.env.FACEBOOK_APP_ID = 'f-id';
process.env.FACEBOOK_APP_SECRET = 'f-secret';

const db = require('../src/core/config/database');
const passport = require('passport');

jest.mock('../src/core/config/database');
jest.mock('passport', () => ({
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn()
}));

// Mock strategies to avoid real initialization
jest.mock('passport-google-oauth20', () => ({
    Strategy: jest.fn()
}));
jest.mock('passport-facebook', () => ({
    Strategy: jest.fn()
}));
jest.mock('passport-apple', () => jest.fn());

const { initOAuth } = require('../src/core/config/passport-oauth');

describe('Passport OAuth Config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initOAuth should initialize Google and Facebook if env vars are set', () => {
        initOAuth();
        // passport.use should be called twice (Google + Facebook)
        // Apple is missing mandatory vars so it won't be called
        expect(passport.use).toHaveBeenCalledTimes(2);
    });

    it('initOAuth should not initialize strategies if env vars are missing', () => {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.FACEBOOK_APP_ID;
        
        initOAuth();
        expect(passport.use).not.toHaveBeenCalled();
    });
});
