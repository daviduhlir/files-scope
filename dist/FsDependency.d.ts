/// <reference types="node" />
import { Abortable } from 'events';
import { Dependency } from './Dependency';
import { BigIntStats, Dirent, Mode, ObjectEncodingOptions, OpenMode, StatOptions, Stats } from 'fs';
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
    read(options?: ({
        encoding?: null | undefined;
        flag?: OpenMode | undefined;
    } & Abortable) | null): Promise<Buffer>;
    read(options: ({
        encoding: BufferEncoding;
        flag?: OpenMode | undefined;
    } & Abortable) | BufferEncoding): Promise<string>;
    write(data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream, options?: (ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
    } & Abortable) | BufferEncoding | null): Promise<void>;
    stat(opts?: StatOptions & {
        bigint?: false | undefined;
    }): Promise<Stats>;
    stat(opts: StatOptions & {
        bigint: true;
    }): Promise<BigIntStats>;
    lstat(opts?: StatOptions & {
        bigint?: false | undefined;
    }): Promise<Stats>;
    lstat(opts: StatOptions & {
        bigint: true;
    }): Promise<BigIntStats>;
    unlink(): Promise<void>;
    isDirectory(): Promise<boolean>;
    isFile(): Promise<boolean>;
    readdir(options?: (ObjectEncodingOptions & {
        withFileTypes?: false | undefined;
    }) | BufferEncoding | null): Promise<string[]>;
    readdir(options: {
        encoding: 'buffer';
        withFileTypes?: false | undefined;
    } | 'buffer'): Promise<Buffer[]>;
    readdir(options: ObjectEncodingOptions & {
        withFileTypes: true;
    }): Promise<Dirent[]>;
    exists(): Promise<boolean>;
}
