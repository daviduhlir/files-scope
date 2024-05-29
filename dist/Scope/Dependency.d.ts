import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from '../interfaces';
import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer';
import { IFs } from 'memfs';
export declare const SYSTEM_FS: IFs | DataLayerFsApi;
export declare const dependencyFsInjector = "__dependencyFsInjector__";
export declare class Dependency {
    readonly path: string;
    readonly writeAccess?: boolean;
    protected dataLayer: DataLayer;
    constructor(path: string, writeAccess?: boolean);
    [dependencyFsInjector]: (dataLayer: DataLayer) => void;
    protected getFsProxy(): any;
    needsLock(): boolean;
    initialize(): void;
    static writeFileAccess(filePath: string): DependencyFile;
    static readFileAccess(filePath: string): DependencyFile;
    static writeFolderAccess(filePath: string): DependencyFolder;
    static readFolderAccess(filePath: string): DependencyFolder;
    static readExternalAccess(filePath: string, alternativeFs?: IFs | DataLayerFsApi): DependencyExternal;
}
export declare class DependencyFile extends Dependency {
    get fs(): DataLayerPromiseSingleFileApi;
}
export declare class DependencyFolder extends Dependency {
    relativizePath(requestedPath: any): string;
    get fs(): DataLayerPromiseApi;
}
export declare class DependencyExternal extends Dependency {
    readonly path: string;
    readonly alternativeFs: IFs | DataLayerFsApi;
    constructor(path: string, alternativeFs?: IFs | DataLayerFsApi);
    needsLock(): boolean;
    initialize(): void;
}
