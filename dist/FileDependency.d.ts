/// <reference types="node" />
import { Abortable } from 'events';
import { Dependency } from './Dependency';
import { Mode, ObjectEncodingOptions, OpenMode } from 'fs';
import { Stream } from 'stream';
export declare class FileDependency extends Dependency {
    readonly filePath: string;
    readonly writeAccess?: boolean;
    readonly basePath: string;
    static prepare(filePath: string, writeAccess?: boolean, basePath?: string): FileDependency;
    constructor(filePath: string, writeAccess?: boolean, basePath?: string);
    getKey(): Promise<string>;
    isSingleAccess(): Promise<boolean>;
    getFullPath(): string;
    read(options?: ({
        encoding?: null | undefined;
        flag?: OpenMode | undefined;
    } & Abortable) | null): Promise<Buffer>;
    write(data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream, options?: (ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
    } & Abortable) | BufferEncoding | null): Promise<void>;
}
