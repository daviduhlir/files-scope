import { DataLayerFsApi } from './DataLayer';
export declare type MutexKeyItem = {
    key: string;
    singleAccess: boolean;
};
export interface FileScopeOptions {
    mutexPrefix: string;
    maxLockingTime?: number;
    commitIfFail?: boolean;
}
export declare const DEFAULT_SCOPE_OPTIONS: FileScopeOptions;
export interface Dependency {
    filePath: string;
    writeAccess: boolean;
}
export declare class FileScope<T, K extends {
    [key: string]: Dependency;
}> {
    readonly workingDir: string;
    readonly dependeciesMap: K;
    protected options: FileScopeOptions;
    constructor(workingDir: string, dependeciesMap: K, options?: Partial<FileScopeOptions>);
    static writeAccess(filePath: string): Dependency;
    static readAccess(filePath: string): {
        filePath: string;
        writeAccess: boolean;
    };
    open(handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: () => Promise<T>, maxLockingTime?: number): any;
}
