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
}
export declare const DEFAULT_SCOPE_OPTIONS: ScopeOptions;
export declare class Scope<T, K extends {
    [key: string]: Dependency;
}> {
    readonly dependeciesMap: K;
    protected options: ScopeOptions;
    protected dataLayer: DataLayer;
    protected dependeciesList: Dependency[];
    protected opened: boolean;
    constructor(dependeciesMap: K, options?: Partial<ScopeOptions>);
    protected initialize(): void;
    get fs(): DataLayerFsApi;
    static prepare<K extends {
        [key: string]: Dependency;
    }>(workingDir: string, dependeciesMap: K, options?: Partial<ScopeOptions>): Scope<unknown, K>;
    open(handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: () => Promise<T>, maxLockingTime?: number): any;
}
