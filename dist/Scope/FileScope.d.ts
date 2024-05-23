import { Dependency } from './Dependency';
import { Scope, ScopeOptions } from './Scope';
export declare class FileScope<T, K extends {
    [key: string]: Dependency;
}> extends Scope<T, K> {
    readonly workingDir: string;
    readonly dependeciesMap: K;
    constructor(workingDir: string, dependeciesMap: K, options?: Partial<ScopeOptions>);
    protected initializeDataLayer(): void;
    static prepare<K extends {
        [key: string]: Dependency;
    }>(workingDir: string, dependeciesMap: K, options?: Partial<ScopeOptions>): FileScope<unknown, K>;
}
