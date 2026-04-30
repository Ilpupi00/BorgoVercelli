"use strict";

const fs = require('fs');
const path = require('path');
const { deleteImageFile, imageFileExists } = require('../src/shared/utils/file-helper');

jest.mock('fs');

describe('File Helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RAILWAY_ENVIRONMENT = '';
    });

    it('imageFileExists should return true if file exists in one of the candidate paths', () => {
        fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
        expect(imageFileExists('/uploads/test.jpg')).toBe(true);
        expect(fs.existsSync).toHaveBeenCalled();
    });

    it('imageFileExists should return false if file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        expect(imageFileExists('/uploads/none.jpg')).toBe(false);
    });

    it('deleteImageFile should call unlinkSync if file is found', () => {
        fs.existsSync.mockReturnValue(true);
        const result = deleteImageFile('/uploads/delete-me.jpg');
        expect(fs.unlinkSync).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('deleteImageFile should handle unlinkSync errors gracefully', () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => { throw new Error('Permission denied'); });
        const result = deleteImageFile('/uploads/error.jpg');
        expect(result).toBe(false);
    });

    it('deleteImageFile should use /data path if RAILWAY_ENVIRONMENT is set', () => {
        process.env.RAILWAY_ENVIRONMENT = 'prod';
        fs.existsSync.mockImplementation((p) => p.includes('data'));
        deleteImageFile('test.jpg');
        expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should return false if no imageUrl provided', () => {
        expect(imageFileExists(null)).toBe(false);
        expect(deleteImageFile('')).toBe(false);
    });
});
