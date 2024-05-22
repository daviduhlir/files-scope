/// <reference types="node" />
import { IFs } from 'memfs';
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types';
import Stats from 'memfs/lib/Stats';
import { MakeDirectoryOptions, NoParamCallback, RmDirOptions, RmOptions, StatOptions, WriteFileOptions } from 'fs';
import { Abortable } from 'events';
export interface DataLayerCallbackApi {
    appendFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any;
    appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any;
    copyFile(src: string, dest: string, callback: NoParamCallback): any;
    copyFile(src: string, dest: string, flags: number, callback: NoParamCallback): any;
    lstat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    lstat(path: string, options: StatOptions & {
        bigint: true;
    }, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    mkdir(path: string, callback: NoParamCallback): any;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }, callback: NoParamCallback): any;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any;
    readFile(path: string, callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void): any;
    readFile(path: string, options: ({
        encoding?: BufferEncoding | undefined | null;
        flag?: string | undefined;
    } & Abortable) | undefined | null, callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void): any;
    rename(oldPath: string, newPath: string, callback: NoParamCallback): void;
    rmdir(path: string, callback: NoParamCallback): any;
    rmdir(path: string, options: RmDirOptions, callback: NoParamCallback): any;
    rm(path: string, callback: NoParamCallback): void;
    rm(path: string, options: RmOptions, callback: NoParamCallback): void;
    stat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    stat(path: string, options: (StatOptions & {
        bigint?: false | undefined;
    }) | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    unlink(path: string, callback: NoParamCallback): void;
    writeFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any;
    writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any;
}
export interface DataLayerPromiseApi {
    appendFile(path: string, data: string | Uint8Array): Promise<void>;
    appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
    copyFile(src: string, dest: string): Promise<void>;
    copyFile(src: string, dest: string, flags: number): Promise<void>;
    lstat(path: string): Promise<Stats>;
    lstat(path: string, options: StatOptions & {
        bigint: true;
    }): Promise<Stats>;
    mkdir(path: string): Promise<void>;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }): Promise<void>;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }): Promise<string | undefined>;
    mkdir(path: string, mode: MakeDirectoryOptions & {
        recursive: true;
    }): Promise<string | undefined>;
    readFile(path: string): Promise<string | Buffer>;
    readFile(path: string, options: ({
        encoding?: BufferEncoding | undefined | null;
        flag?: string | undefined;
    } & Abortable) | undefined | null): Promise<string | Buffer>;
    rename(oldPath: string, newPath: string): Promise<void>;
    rmdir(path: string): Promise<void>;
    rmdir(path: string, options: RmDirOptions): Promise<void>;
    rm(path: string): Promise<void>;
    rm(path: string, options: RmOptions): Promise<void>;
    stat(path: string): Promise<Stats>;
    stat(path: string, options: (StatOptions & {
        bigint?: false | undefined;
    }) | undefined): Promise<Stats>;
    unlink(path: string): Promise<void>;
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
}
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
    commit(): Promise<void>;
    protected solveFsAction(method: string, args: any[]): Promise<any>;
    protected checkWriteAllowed(fsPath: string): void;
    protected pathFromReaddirEntry(readdirEntry: any): string;
    protected sortedArrayFromReaddirResult(readdirResult: Map<string, any>): any[];
    protected prepareInFs(fsPath: string, destinationPath?: string): Promise<void>;
    protected extractAllPaths(obj: FsNode, prefix?: string, accumulator?: {
        [path: string]: (string | Buffer | null);
    }): {
        [path: string]: string | Buffer;
    };
    protected checkIsUnlinked(fsPath: string): string;
}
