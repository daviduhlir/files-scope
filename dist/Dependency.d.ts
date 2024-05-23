import { DataLayerFsApi } from './DataLayer';
import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from './interfaces';
export declare const dependencyFsInjector: unique symbol;
export declare class Dependency {
    readonly path: string;
    readonly writeAccess?: boolean;
    protected _fs: DataLayerFsApi;
    constructor(path: string, writeAccess?: boolean);
    [dependencyFsInjector]: (fs: DataLayerFsApi) => void;
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
