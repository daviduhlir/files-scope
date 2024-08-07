"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_FILE_METHODS = exports.SUPPORTED_DIRECT_METHODS = exports.SUPPORTED_METHODS = void 0;
exports.SUPPORTED_METHODS = [
    'accessInSystemFs',
    'access',
    'appendFile',
    'copyFile',
    'utimes',
    'lstat',
    'mkdir',
    'readdir',
    'readFile',
    'rename',
    'rmdir',
    'rm',
    'stat',
    'unlink',
    'writeFile',
    'fileExists',
    'directoryExists',
];
exports.SUPPORTED_DIRECT_METHODS = ['createReadStream', 'createWriteStream', 'statSync'];
exports.SUPPORTED_FILE_METHODS = [
    'accessInSystemFs',
    'access',
    'appendFile',
    'copyFile',
    'readFile',
    'rename',
    'utimes',
    'stat',
    'unlink',
    'writeFile',
    'fileExists',
];
