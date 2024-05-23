import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from '../interfaces';
import { Scope } from './Scope';
export declare const dependencyFsInjector: unique symbol;
export declare class Dependency {
    readonly path: string;
    readonly writeAccess?: boolean;
    protected scope: Scope<any, any>;
    constructor(path: string, writeAccess?: boolean);
    [dependencyFsInjector]: (scope: Scope<any, any>) => void;
    protected getFsProxy(): any;
    static writeFileAccess(filePath: string): DependencyFile;
    static readFileAccess(filePath: string): DependencyFile;
    static writeFolderAccess(filePath: string): DependencyFolder;
    static readFolderAccess(filePath: string): DependencyFolder;
}
export declare class DependencyFile extends Dependency {
    get fs(): DataLayerPromiseSingleFileApi;
}
export declare class DependencyFolder extends Dependency {
    protected relativizePath(inputPath: string): string;
    get fs(): DataLayerPromiseApi;
}
