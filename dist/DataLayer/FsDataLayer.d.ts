import { DataLayer } from './DataLayer';
export declare class FsDataLayer extends DataLayer {
    readonly workingDir: string;
    constructor(workingDir: string, writeAllowedPaths?: string[]);
}
