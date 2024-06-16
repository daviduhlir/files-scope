/// <reference types="node" />
import { IFs } from 'memfs';
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types';
import Stats from 'memfs/lib/Stats';
import { DataLayerCallbackApi, DataLayerPromiseApi } from '../interfaces';
export interface DataLayerPromisesFsApi extends DataLayerPromiseApi {
    unsafeFullFs: FsPromisesApi;
}
export interface DataLayerFsApi extends DataLayerCallbackApi {
    promises: DataLayerPromisesFsApi;
    unsafeFullFs: FsCallbackApi;
    addExternal: (path: string, fs: IFs | DataLayerFsApi) => void;
    statSync: (path: string) => Stats<number>;
}
export interface FsNode {
    [name: string]: FsNode | string | Buffer | null;
}
export interface ExternalFsLink {
    path: string;
    fs: IFs | DataLayerFsApi;
}
export declare class DataLayer {
    readonly sourceFs: IFs | DataLayerFsApi;
    readonly writeAllowedPaths?: string[];
    protected volume: import("memfs/lib/volume").Volume;
    protected volumeFs: IFs;
    protected unlinkedPaths: string[];
    protected tempFiles: string[];
    protected externals: ExternalFsLink[];
    constructor(sourceFs: IFs | DataLayerFsApi, writeAllowedPaths?: string[]);
    addExternal(path: string, fs: IFs | DataLayerFsApi): void;
    reset(): void;
    get fs(): DataLayerFsApi;
    get promises(): FsPromisesApi;
    dump(): {
        unlinkedPaths: string[];
        nodes: {
            [path: string]: string | Buffer;
        };
    };
    commit(ignoreErrors?: boolean): Promise<string[]>;
    protected solveDirectFsAction(method: string, args: any[]): any;
    protected solveFsAction(method: string, args: any[]): Promise<any>;
    protected getExternalPath(fsPath: string): ExternalFsLink;
    protected checkWriteAllowed(fsPath: string): void;
    protected pathFromReaddirEntry(readdirEntry: any): string;
    protected sortedArrayFromReaddirResult(readdirResult: Map<string, any>): any[];
    protected prepareInFs(fsPath: string, destinationPath?: string): Promise<void>;
    protected extractAllPaths(obj: FsNode, prefix?: string, accumulator?: {
        [path: string]: string | Buffer | null;
    }): {
        [path: string]: string | Buffer;
    };
    protected checkIsUnlinked(fsPath: string): string;
}
