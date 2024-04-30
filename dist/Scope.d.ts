import { Dependency } from './Dependency';
import { KeysStrategy, MutexKeyItem } from './interfaces';
import { FsDependency } from './FsDependency';
export interface ScopeOptions {
    maxLockingTime?: number;
    strategy?: KeysStrategy;
}
export declare const DEFAULT_SCOPE_OPTIONS: ScopeOptions;
export declare class Scope {
    static writeAccess(filePath: string, basePath?: string): FsDependency;
    static readAccess(filePath: string, basePath?: string): FsDependency;
    static open<T, K extends {
        [key: string]: Dependency;
    }>(mutexPrefix: string, dependeciesMap: K, handler: (dependecies: K) => Promise<T>, options?: ScopeOptions): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: (dependecies: K) => Promise<T>, maxLockingTime?: number): any;
}
