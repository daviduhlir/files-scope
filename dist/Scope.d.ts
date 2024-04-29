import { Dependency } from './Dependency';
import { MutexKeyItem } from './utils';
import { FsDependency } from './FsDependency';
export declare class Scope {
    static writeAccess(filePath: string, basePath?: string): FsDependency;
    static readAccess(filePath: string, basePath?: string): FsDependency;
    static open<T, K extends {
        [key: string]: Dependency;
    }>(mutexPrefix: string, dependeciesMap: K, handler: (dependecies: K) => Promise<T>, maxLockingTime?: number): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: (dependecies: K) => Promise<T>, maxLockingTime?: number): any;
}
