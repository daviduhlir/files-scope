import { DataLayer } from './DataLayer/DataLayer';
import { Dependency } from './Scope/Dependency';
import { Scope, ScopeOptions } from './Scope/Scope';
export declare class FileScope extends Scope {
    readonly workingDir: string;
    constructor(workingDir: string, options?: Partial<ScopeOptions>);
    subScope(subPath: string): FileScope;
    protected createDatalayer(dependecies: Dependency[]): DataLayer;
    static prepare(workingDir: string, options?: Partial<ScopeOptions>): FileScope;
}
