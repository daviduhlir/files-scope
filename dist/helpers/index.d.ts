export declare function makeRelativePath(inputPath: string): string;
export declare function makeAbsolutePath(inputPath: string): string;
export declare function createSubpath(parentPath: string, subpath: string): string;
export declare function isSubpath(testedPath: string, startsWith: string): boolean;
export declare function randomHash(): string;
export declare function concatMutexKey(...parts: string[]): string;
