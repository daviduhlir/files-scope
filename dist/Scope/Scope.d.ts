import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer';
import { Dependency } from './Dependency';
export declare type MutexKeyItem = {
    key: string;
    singleAccess: boolean;
};
export interface ScopeOptions {
    mutexPrefix: string;
    maxLockingTime?: number;
    commitIfFail?: boolean;
    beforeRootScopeOpen?: () => Promise<void>;
    afterRootScopeDone?: (changedPaths: string[]) => Promise<void>;
    beforeScopeOpen?: () => Promise<void>;
    afterScopeDone?: (changedPaths: string[]) => Promise<void>;
    readonly?: boolean;
}
export declare const DEFAULT_SCOPE_OPTIONS: ScopeOptions;
export declare class Scope {
    readonly workingDir: string;
    protected stackStorage: import("../helpers/AsyncLocalStorage").AsyncLocalStorageMock<{
        layer: DataLayer;
        mutexKeys: MutexKeyItem[];
    }[]>;
    protected options: ScopeOptions;
    constructor(workingDir: string, options?: Partial<ScopeOptions>);
    static prepare(workingDir: string, options?: Partial<ScopeOptions>): Scope;
    protected createDatalayer(dependecies: Dependency[]): DataLayer;
    open<T, K extends {
        [key: string]: Dependency;
    }>(dependeciesMap: K, handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: () => Promise<T>, maxLockingTime?: number): any;
}
