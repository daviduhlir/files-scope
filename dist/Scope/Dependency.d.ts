import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from '../interfaces';
import { DataLayer } from '../DataLayer/DataLayer';
export declare const dependencyFsInjector: unique symbol;
export declare class Dependency {
    readonly path: string;
    readonly writeAccess?: boolean;
    protected dataLayer: DataLayer;
    constructor(path: string, writeAccess?: boolean);
    [dependencyFsInjector]: (dataLayer: DataLayer) => void;
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
    relativizePath(requestedPath: any): string;
    get fs(): DataLayerPromiseApi;
}
