/// <reference types="node" />
import { Abortable } from 'events';
import { Dependency } from './Dependency';
import { Mode, ObjectEncodingOptions, OpenMode, StatOptions, Stats } from 'fs';
import { Stream } from 'stream';
export declare class FsDependency extends Dependency {
    readonly filePath: string;
    readonly writeAccess?: boolean;
    readonly basePath: string;
    static access(filePath: string, writeAccess?: boolean, basePath?: string): FsDependency;
    constructor(filePath: string, writeAccess?: boolean, basePath?: string);
    getKey(): Promise<string>;
    isSingleAccess(): Promise<boolean>;
    getFullPath(): string;
    read(options?: (ObjectEncodingOptions & Abortable & {
        flag?: OpenMode | undefined;
    }) | BufferEncoding | null): Promise<string | Buffer>;
    write(data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream, options?: (ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
    } & Abortable) | BufferEncoding | null): Promise<void>;
    stat(opts?: StatOptions & {
        bigint?: false | undefined;
    }): Promise<Stats>;
    lstat(opts?: StatOptions & {
        bigint?: false | undefined;
    }): Promise<Stats>;
    unlink(): Promise<void>;
    isDirectory(): Promise<boolean>;
    isFile(): Promise<boolean>;
    readdir(options?: (ObjectEncodingOptions & {
        withFileTypes?: false | undefined;
    }) | BufferEncoding | null): Promise<string[]>;
    exists(): Promise<boolean>;
}
