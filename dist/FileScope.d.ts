import { Scope, ScopeOptions } from './Scope/Scope';
export declare class FileScope<T> extends Scope<T> {
    readonly workingDir: string;
    constructor(workingDir: string, options?: Partial<ScopeOptions>);
    protected beforeOpen(): void;
    static prepare(workingDir: string, options?: Partial<ScopeOptions>): FileScope<unknown>;
}
