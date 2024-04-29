import { Dependency } from './Dependency';
import { MutexKeyItem } from './utils';
import { FileDependency } from './FileDependency';
export declare class Scope {
    static writeAccess(filePath: string, basePath?: string): FileDependency;
    static readAccess(filePath: string, basePath?: string): FileDependency;
    static open<T, K extends {
        [key: string]: Dependency;
    }>(mutexPrefix: string, dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number): any;
}
