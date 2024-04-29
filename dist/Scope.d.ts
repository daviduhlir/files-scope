import { Dependency } from './Dependency';
import { MutexKeyItem } from './utils';
export declare class Scope {
    static open<T, K extends {
        [key: string]: Dependency;
    }>(mutexPrefix: string, dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number): Promise<T>;
    protected static lockScope<T, K extends {
        [key: string]: Dependency;
    }>(mutexes: MutexKeyItem[], dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number): any;
}
