export declare function parsePath(path: string): string[];
export declare function allEqual(arr: any): any;
export declare type MutexKeyItem = {
    key: string[];
    singleAccess: boolean;
};
export declare function getAllMutexKeyItems(mutexPrefix: string, keys: [string, boolean][]): MutexKeyItem[];
