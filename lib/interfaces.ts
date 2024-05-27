import { Dirent, MakeDirectoryOptions, NoParamCallback, RmDirOptions, RmOptions, StatOptions, Stats, WriteFileOptions } from 'fs'
import { Abortable } from 'events'

export interface DataLayerCallbackApi {
  access(path: string, mode: number | undefined, callback: NoParamCallback): void
  access(path: string, callback: NoParamCallback): void
  appendFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any
  appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any
  copyFile(src: string, dest: string, callback: NoParamCallback): any
  copyFile(src: string, dest: string, flags: number, callback: NoParamCallback): any
  lstat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void
  lstat(path: string, options: StatOptions & { bigint: true }, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void
  mkdir(path: string, callback: NoParamCallback): any
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }, callback: NoParamCallback): any
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any
  readdir(path: string, callback: (err: NodeJS.ErrnoException | null, data: string[]) => void)
  readdir(
    path: string,
    options: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, data: string[]) => void,
  )
  readdir(
    path: string,
    options: { encoding: BufferEncoding | null; withFileTypes: true } | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, data: Dirent[]) => void,
  )
  readFile(path: string, callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void): any
  readFile(
    path: string,
    options: ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined } & Abortable) | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void,
  ): any
  rename(oldPath: string, newPath: string, callback: NoParamCallback): void
  rmdir(path: string, callback: NoParamCallback): any
  rmdir(path: string, options: RmDirOptions, callback: NoParamCallback): any
  rm(path: string, callback: NoParamCallback): void
  rm(path: string, options: RmOptions, callback: NoParamCallback): void
  stat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void
  stat(
    path: string,
    options: (StatOptions & { bigint?: false | undefined }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void,
  ): void
  unlink(path: string, callback: NoParamCallback): void
  writeFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any
  writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any
}

export interface DataLayerPromiseSingleFileApi {
  access(mode: number | undefined): Promise<void>
  access(): Promise<void>
  appendFile(data: string | Uint8Array): Promise<void>
  appendFile(data: string | Uint8Array, options: WriteFileOptions): Promise<void>
  copyFile(dest: string): Promise<void>
  copyFile(dest: string, flags: number): Promise<void>
  readFile(): Promise<string | Buffer>
  readFile(
    options: ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined } & Abortable) | undefined | null,
  ): Promise<string | Buffer>
  rename(newPath: string): Promise<void>
  stat(): Promise<Stats>
  stat(options: (StatOptions & { bigint?: false | undefined }) | undefined): Promise<Stats>
  unlink(): Promise<void>
  writeFile(data: string | Uint8Array): Promise<void>
  writeFile(data: string | Uint8Array, options: WriteFileOptions): Promise<void>
  fileExists(): Promise<boolean>
}

export interface DataLayerPromiseApi {
  access(path: string, mode: number | undefined): Promise<void>
  access(path: string): Promise<void>
  appendFile(path: string, data: string | Uint8Array): Promise<void>
  appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>
  copyFile(src: string, dest: string): Promise<void>
  copyFile(src: string, dest: string, flags: number): Promise<void>
  lstat(path: string): Promise<Stats>
  lstat(path: string, options: StatOptions & { bigint: true }): Promise<Stats>
  mkdir(path: string): Promise<void>
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }): Promise<void>
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }): Promise<string | undefined>
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true }): Promise<string | undefined>
  readdir(path: string): Promise<string[]>
  readdir(
    path: string,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
  ): Promise<string[]>
  readdir(
    path: string,
    options?: { encoding: BufferEncoding | null | undefined; withFileTypes: true } | BufferEncoding | undefined | null,
  ): Promise<Dirent[]>
  readFile(path: string): Promise<string | Buffer>
  readFile(
    path: string,
    options: ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined } & Abortable) | undefined | null,
  ): Promise<string | Buffer>
  rename(oldPath: string, newPath: string): Promise<void>
  rmdir(path: string): Promise<void>
  rmdir(path: string, options: RmDirOptions): Promise<void>
  rm(path: string): Promise<void>
  rm(path: string, options: RmOptions): Promise<void>
  stat(path: string): Promise<Stats>
  stat(path: string, options: (StatOptions & { bigint?: false | undefined }) | undefined): Promise<Stats>
  unlink(path: string): Promise<void>
  writeFile(path: string, data: string | Uint8Array): Promise<void>
  writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>
}
