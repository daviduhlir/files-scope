import { DataLayer } from './DataLayer/DataLayer';
import { Dependency } from './Scope/Dependency';
import { Scope, ScopeOptions } from './Scope/Scope';
export declare class FileScope extends Scope {
    protected createDatalayer(dependecies: Dependency[]): DataLayer;
    static prepare(workingDir: string, options?: Partial<ScopeOptions>): FileScope;
}
