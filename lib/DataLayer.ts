import { IFs, Volume, createFsFromVolume } from 'memfs'
import { promisify } from 'util';
import * as path from 'path'
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types';
import Stats from 'memfs/lib/Stats';
import { Dirent, MakeDirectoryOptions, NoParamCallback, RmDirOptions, RmOptions, StatOptions, WriteFileOptions } from 'fs';
import { Abortable } from 'events';

export interface DataLayerCallbackApi {
  appendFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any;
  appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any;
  copyFile(src: string, dest: string, callback: NoParamCallback): any;
  copyFile(src: string, dest: string, flags: number, callback: NoParamCallback): any;
  lstat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
  lstat(path: string, options: StatOptions & { bigint: true; }, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
  mkdir(path: string, callback: NoParamCallback): any;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }, callback: NoParamCallback): any;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }, callback: (err: NodeJS.ErrnoException | null, path?: string) => void): any;
  readdir(path: string, callback: (err: NodeJS.ErrnoException | null, data: string[]) => void);
  readdir(path: string, options: | { encoding: BufferEncoding | null; withFileTypes?: false | undefined; } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException | null, data: string[]) => void);
  readdir(path: string, options: | { encoding: BufferEncoding | null; withFileTypes: true; } | BufferEncoding | undefined | null, callback: (err: NodeJS.ErrnoException | null, data: Dirent[]) => void);
  readFile(path: string, callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void): any;
  readFile(path: string, options: | ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined; } & Abortable) | undefined | null, callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void): any;
  rename(oldPath: string, newPath: string, callback: NoParamCallback): void;
  rmdir(path: string, callback: NoParamCallback): any;
  rmdir(path: string, options: RmDirOptions, callback: NoParamCallback): any;
  rm(path: string, callback: NoParamCallback): void;
  rm(path: string, options: RmOptions, callback: NoParamCallback): void;
  stat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
  stat(path: string, options: | (StatOptions & { bigint?: false | undefined; }) | undefined, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
  unlink(path: string, callback: NoParamCallback): void;
  writeFile(path: string, data: string | Uint8Array, callback: NoParamCallback): any;
  writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions, callback: NoParamCallback): any;
}

export interface DataLayerPromiseSingleFileApi {
  appendFile(data: string | Uint8Array): Promise<void>;
  appendFile(data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
  copyFile(dest: string): Promise<void>;
  copyFile(dest: string, flags: number): Promise<void>;
  readFile(): Promise<string | Buffer>;
  readFile(options: | ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined; } & Abortable) | undefined | null): Promise<string | Buffer>;
  rename(newPath: string): Promise<void>;
  stat(): Promise<Stats>;
  stat(options: | (StatOptions & { bigint?: false | undefined; }) | undefined): Promise<Stats>;
  unlink(): Promise<void>;
  writeFile(data: string | Uint8Array): Promise<void>;
  writeFile(data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
}
export interface DataLayerPromiseApi {
  appendFile(path: string, data: string | Uint8Array): Promise<void>;
  appendFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
  copyFile(src: string, dest: string): Promise<void>;
  copyFile(src: string, dest: string, flags: number): Promise<void>;
  lstat(path: string): Promise<Stats>;
  lstat(path: string, options: StatOptions & { bigint: true; }): Promise<Stats>;
  mkdir(path: string): Promise<void>;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }): Promise<void>;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }): Promise<string | undefined>;
  mkdir(path: string, mode: MakeDirectoryOptions & { recursive: true; }): Promise<string | undefined>;
  readdir(path: string): Promise<string[]>;
  readdir(path: string, options?: | { encoding: BufferEncoding | null; withFileTypes?: false | undefined; } | BufferEncoding | undefined | null): Promise<string[]>;
  readdir(path: string, options?: | { encoding: BufferEncoding | null; withFileTypes: true; } | BufferEncoding | undefined | null): Promise<Dirent[]>;
  readFile(path: string): Promise<string | Buffer>;
  readFile(path: string, options: | ({ encoding?: BufferEncoding | undefined | null; flag?: string | undefined; } & Abortable) | undefined | null): Promise<string | Buffer>;
  rename(oldPath: string, newPath: string): Promise<void>;
  rmdir(path: string): Promise<void>;
  rmdir(path: string, options: RmDirOptions): Promise<void>;
  rm(path: string): Promise<void>;
  rm(path: string, options: RmOptions): Promise<void>;
  stat(path: string): Promise<Stats>;
  stat(path: string, options: | (StatOptions & { bigint?: false | undefined; }) | undefined): Promise<Stats>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  writeFile(path: string, data: string | Uint8Array, options: WriteFileOptions): Promise<void>;
}

export interface DataLayerPromisesFsApi extends DataLayerPromiseApi {
  unsafeFullFs: FsPromisesApi
}
export interface DataLayerFsApi extends DataLayerCallbackApi {
  promises: DataLayerPromisesFsApi
  unsafeFullFs: FsCallbackApi
}

export interface FsNode {[name: string]: FsNode | string | Buffer | null}

export class DataLayer {
  protected volume = new Volume()
  protected volumeFs: IFs
  protected unlinkedPaths: string[] = []

  constructor(readonly sourceFs: IFs, readonly writeAllowedPaths?: string[]) {
    this.volumeFs = createFsFromVolume(this.volume)
  }

  reset() {
    this.volume = new Volume()
    this.volumeFs = createFsFromVolume(this.volume)
    this.unlinkedPaths = []
  }

  get fs(): DataLayerFsApi {
    return new Proxy(this as any, {
      get:
        (target, propKey, receiver) => {
          if (propKey === 'promises') {
            return this.promises
          } else if (propKey === 'unsafeFullFs') {
            return this.fs
          }
          return (...args) => {
            const cb = args.pop()
            this.solveFsAction.apply(this, [propKey.toString(), args]).then((result, error) => cb(error, result))
          }
        }
    })
  }

  get promises(): FsPromisesApi {
    return new Proxy(this as any, {
      get:
        (target, propKey, receiver) => {
          if (propKey === 'unsafeFullFs') {
            return this.promises
          }
          return (...args) => this.solveFsAction.apply(this, [propKey.toString(), args])
        }
    })
  }

  dump() {
    const nodes = this.extractAllPaths(this.volume.toJSON())
    const nodesPaths = Object.keys(nodes)
    const unlinkedPaths = this.unlinkedPaths.filter(unlinkedPath => !nodesPaths.find(nodePath => nodePath.startsWith(unlinkedPath)))
    return {
      unlinkedPaths,
      nodes,
    }
  }

  async commit() {
    const dumped = this.dump()

    for (const unlinkedPath in dumped.unlinkedPaths) {
      try {
        const stat = await promisify(this.sourceFs.stat)(unlinkedPath) as Stats
        if (stat.isDirectory()) {
          await promisify(this.sourceFs.rm as any)(unlinkedPath, { recursive: true })
        } else {
          await promisify(this.sourceFs.unlink)(unlinkedPath)
        }
      } catch(e) {
        // TODO can't unlink, what to do ?
      }
    }

    for (const nodePath in dumped.nodes) {
      const node = dumped.nodes[nodePath]
      if (node === null) {
        await promisify(this.sourceFs.mkdir as any)(nodePath, { recursive: true })
      } else if (typeof node === 'string' || node instanceof Buffer) {
        const destPath = path.dirname(nodePath)

        let isDirectory = false
        try {
          isDirectory = ((await promisify(this.sourceFs.stat)(destPath)) as Stats).isDirectory()
        } catch(e) {
          await promisify(this.sourceFs.mkdir as any)(destPath, { recursive: true })
          isDirectory = true
        }
        if (isDirectory) {
          await promisify(this.sourceFs.writeFile)(nodePath, node)
        } else {
          throw new Error(`Can not write to ${nodePath}`)
        }
      }
    }

    this.reset()
  }

  protected async solveFsAction(method: string, args: any[]) {
    switch(method) {
      // read operations
      case 'readFile':
      case 'lstat':
      case 'stat':
        try {
          return await this.volumeFs.promises[method].apply(this, args)
        } catch(e) {
          if (this.checkIsUnlinked(args[0] as string)) {
            throw new Error(`No such file on path ${args[0]}`)
          }
          return promisify(this.sourceFs[method]).apply(this, args)
        }
      case 'readdir': {
        let memResult = []
        try {
          memResult = await this.volumeFs.promises.readdir.apply(this, args)
        } catch(e) {}
        let fsResult = []
        try {
          const wasUnlinkedInFs = this.checkIsUnlinked(args[0])
          fsResult = wasUnlinkedInFs ? [] : await promisify(this.sourceFs.readdir).apply(this, args)
        } catch(e) {}

        const result = new Map<string, any>()
        for(const dirent of fsResult) {
          const direntPath = this.pathFromReaddirEntry(dirent)
          if (!this.checkIsUnlinked(path.resolve(args[0], direntPath))) {
            result.set(direntPath, dirent)
          }
        }
        for(const dirent of memResult) {
          result.set(this.pathFromReaddirEntry(dirent), dirent)
        }
        return this.sortedArrayFromReaddirResult(result)
      }
      // write oprations
      case 'writeFile':
        this.checkWriteAllowed(args[0])
        await this.volumeFs.promises.mkdir(path.dirname(args[0]), { recursive: true })
        return this.volumeFs.promises.writeFile.apply(this, args)
      case 'appendFile':
        this.checkWriteAllowed(args[0])
        await this.prepareInFs(args[0])
        return this.volumeFs.promises.appendFile.apply(this, args)
      case 'rename':
        this.checkWriteAllowed(args[0])
        this.checkWriteAllowed(args[1])
        await this.prepareInFs(args[0])
        this.unlinkedPaths.push(args[0])
        return this.volumeFs.promises.rename.apply(this, args)
      case 'copyFile':
        await this.prepareInFs(args[0])
        return this.volumeFs.promises.copyFile.apply(this, args)
      case 'unlink':
      case 'rm':
      case 'rmdir':
        this.checkWriteAllowed(args[0])
        this.unlinkedPaths.push(args[0])
        try {
          return this.volumeFs.promises[method].apply(this, args)
        } catch(e) {}
        break
      case 'mkdir':
        this.checkWriteAllowed(args[0])
        return this.volumeFs.promises[method].apply(this, args)
      default:
        throw new Error(`Method ${method} is not implemented.`)
    }
  }

  protected checkWriteAllowed(fsPath: string) {
    if (this.writeAllowedPaths && !this.writeAllowedPaths.find(allowedPath => fsPath.startsWith(allowedPath))) {
      throw new Error(`Write to path ${fsPath} is not allowed in layer.`)
    }
  }

  protected pathFromReaddirEntry(readdirEntry): string {
    if (readdirEntry instanceof Buffer || typeof readdirEntry === 'string') {
      return String(readdirEntry);
    }
    return readdirEntry.name;
  }

  protected sortedArrayFromReaddirResult(readdirResult: Map<string, any>) {
    const array: any[] = [];
    for (const key of Array.from(readdirResult.keys()).sort()) {
      const value = readdirResult.get(key);
      if (value !== undefined) array.push(value);
    }
    return array;
  }

  protected async prepareInFs(fsPath: string, destinationPath?: string) {
    if (!destinationPath) {
      destinationPath = fsPath
    }
    try {
      (await this.volumeFs.promises.stat(destinationPath)).isFile()
    } catch(e) {
      if (this.checkIsUnlinked(fsPath)) {
        return
      }
      try {
        const content = await promisify(this.sourceFs.readFile)(fsPath) as Buffer
        await this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true })
        await this.volumeFs.promises.writeFile(destinationPath, content)
      } catch(e) {
        await this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true })
      }
    }
  }

  protected extractAllPaths(obj: FsNode, prefix: string = '', accumulator: {[path: string]: (string | Buffer | null)} = {}) {
    Object.keys(obj).forEach((name) => {
      const fullPath = path.resolve(prefix, name).toString()
      if (typeof obj[name] === 'string' || obj[name] instanceof Buffer) {
        accumulator[fullPath] = obj[name] as any
      } else if (obj[name] && typeof obj[name] === 'object') {
        this.extractAllPaths(obj[name] as FsNode, fullPath, accumulator)
      } else {
        accumulator[fullPath] = null
      }
    })
    return accumulator
  }

  protected checkIsUnlinked(fsPath: string) {
    return this.unlinkedPaths.find(unlinked => fsPath.startsWith(unlinked))
  }
}