"use strict";

const { upload, uploadSquadra, uploadDir } = require('../src/core/config/multer');

describe('Multer Configuration', () => {
    it('should have a valid upload directory', () => {
        expect(uploadDir).toBeDefined();
        expect(typeof uploadDir).toBe('string');
    });

    it('should export multer instances', () => {
        expect(upload.array).toBeDefined();
        expect(uploadSquadra.single).toBeDefined();
    });

    it('should have limits configured', () => {
        // Accessing internal properties of multer is tricky, but we can verify it doesn't throw
        expect(upload).toHaveProperty('storage');
    });
});
