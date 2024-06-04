"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_FILE_METHODS = exports.SUPPORTED_DIRECT_METHODS = exports.SUPPORTED_METHODS = void 0;
exports.SUPPORTED_METHODS = [
    'access',
    'appendFile',
    'copyFile',
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
exports.SUPPORTED_DIRECT_METHODS = ['createReadStream', 'createWriteStream'];
exports.SUPPORTED_FILE_METHODS = ['access', 'appendFile', 'copyFile', 'readFile', 'rename', 'stat', 'unlink', 'writeFile', 'fileExists'];
