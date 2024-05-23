/// <reference types="node" />
import { IFs } from 'memfs';
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types';
import { DataLayerCallbackApi, DataLayerPromiseApi } from '../interfaces';
export interface DataLayerPromisesFsApi extends DataLayerPromiseApi {
    unsafeFullFs: FsPromisesApi;
}
export interface DataLayerFsApi extends DataLayerCallbackApi {
    promises: DataLayerPromisesFsApi;
    unsafeFullFs: FsCallbackApi;
}
export interface FsNode {
    [name: string]: FsNode | string | Buffer | null;
}
export declare class DataLayer {
    readonly sourceFs: IFs;
    readonly writeAllowedPaths?: string[];
    protected volume: import("memfs/lib/volume").Volume;
    protected volumeFs: IFs;
    protected unlinkedPaths: string[];
    constructor(sourceFs: IFs, writeAllowedPaths?: string[]);
    reset(): void;
    get fs(): DataLayerFsApi;
    get promises(): FsPromisesApi;
    dump(): {
        unlinkedPaths: string[];
        nodes: {
            [path: string]: string | Buffer;
        };
    };
    commit(ignoreErrors?: boolean): Promise<void>;
    protected solveFsAction(method: string, args: any[]): Promise<any>;
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
