import { DataLayer } from './DataLayer/DataLayer';
import { Dependency } from './Scope/Dependency';
import { Scope, ScopeOptions } from './Scope/Scope';
export declare class FileScope<T> extends Scope<T> {
    readonly workingDir: string;
    constructor(workingDir: string, options?: Partial<ScopeOptions>);
    protected createDatalayer(dependecies: Dependency[]): DataLayer;
    static prepare(workingDir: string, options?: Partial<ScopeOptions>): FileScope<unknown>;
}
