import { Dependency } from './Dependency';
export declare class Scope {
    static open<T, K extends {
        [key: string]: Dependency;
    }>(dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number): Promise<T>;
}
