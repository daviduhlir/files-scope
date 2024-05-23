import { IFs, Volume, createFsFromVolume } from 'memfs'
import { promisify } from 'util'
import * as path from 'path'
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types'
import Stats from 'memfs/lib/Stats'
import { DataLayerCallbackApi, DataLayerPromiseApi } from '../interfaces'

export interface DataLayerPromisesFsApi extends DataLayerPromiseApi {
  unsafeFullFs: FsPromisesApi
}
export interface DataLayerFsApi extends DataLayerCallbackApi {
  promises: DataLayerPromisesFsApi
  unsafeFullFs: FsCallbackApi
}

export interface FsNode {
  [name: string]: FsNode | string | Buffer | null
}

/**
 * Data layer
 * Provides fs api, and store changes in memfs
 *
 * Provides also commit data to sourceFs
 */
export class DataLayer {
  protected volume = new Volume()
  protected volumeFs: IFs
  protected unlinkedPaths: string[] = []

  constructor(readonly sourceFs: IFs, readonly writeAllowedPaths?: string[]) {
    this.volumeFs = createFsFromVolume(this.volume)
  }

  /**
   * Reset all changes
   */
  reset() {
    this.volume = new Volume()
    this.volumeFs = createFsFromVolume(this.volume)
    this.unlinkedPaths = []
  }

  /**
   * Get fs api
   */
  get fs(): DataLayerFsApi {
    return new Proxy(this as any, {
      get: (target, propKey, receiver) => {
        if (propKey === 'promises') {
          return this.promises
        } else if (propKey === 'unsafeFullFs') {
          return this.fs
        }
        return (...args) => {
          const cb = args.pop()
          this.solveFsAction.apply(this, [propKey.toString(), args]).then((result, error) => cb(error, result))
        }
      },
    })
  }

  /**
   * Get promises fs api
   */
  get promises(): FsPromisesApi {
    return new Proxy(this as any, {
      get: (target, propKey, receiver) => {
        if (propKey === 'unsafeFullFs') {
          return this.promises
        }
        return (...args) => this.solveFsAction.apply(this, [propKey.toString(), args])
      },
    })
  }

  /**
   * Dump data from fs
   */
  dump() {
    const volumeJson = this.volume.toJSON()
    const nodes = this.extractAllPaths(volumeJson)
    const nodesPaths = Object.keys(nodes)
    const unlinkedPaths = this.unlinkedPaths.filter(unlinkedPath => !nodesPaths.find(nodePath => nodePath.startsWith(unlinkedPath)))
    return {
      unlinkedPaths,
      nodes,
    }
  }

  /**
   * Commit files changes into FS system
   */
  async commit(ignoreErrors?: boolean) {
    const dumped = this.dump()

    for (const unlinkedPath of dumped.unlinkedPaths) {
      try {
        const stat = (await promisify(this.sourceFs.stat)(unlinkedPath)) as Stats
        if (stat.isDirectory()) {
          await promisify(this.sourceFs.rm as any)(unlinkedPath, { recursive: true })
        } else {
          await promisify(this.sourceFs.unlink)(unlinkedPath)
        }
      } catch (e) {
        if (!ignoreErrors) {
          throw new Error(`Can not unlink ${unlinkedPath}`)
        }
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
        } catch (e) {
          await promisify(this.sourceFs.mkdir as any)(destPath, { recursive: true })
          isDirectory = true
        }
        if (isDirectory) {
          await promisify(this.sourceFs.writeFile)(nodePath, node)
        } else {
          if (!ignoreErrors) {
            throw new Error(`Can not write to ${nodePath}`)
          }
        }
      }
    }
    this.reset()
  }

  /**
   * Solve fs actions, that is called from fs proxy
   */
  protected async solveFsAction(method: string, args: any[]) {
    switch (method) {
      // read operations
      case 'readFile':
      case 'lstat':
      case 'stat':
        try {
          return await this.volumeFs.promises[method].apply(this, args)
        } catch (e) {
          if (this.checkIsUnlinked(args[0] as string)) {
            throw new Error(`No such file on path ${args[0]}`)
          }
          return promisify(this.sourceFs[method]).apply(this, args)
        }
      case 'readdir': {
        let memResult = []
        try {
          memResult = await this.volumeFs.promises.readdir.apply(this, args)
        } catch (e) {}
        let fsResult = []
        try {
          const wasUnlinkedInFs = this.checkIsUnlinked(args[0])
          fsResult = wasUnlinkedInFs ? [] : await promisify(this.sourceFs.readdir).apply(this, args)
        } catch (e) {}

        const result = new Map<string, any>()
        for (const dirent of fsResult) {
          const direntPath = this.pathFromReaddirEntry(dirent)
          if (!this.checkIsUnlinked(path.resolve(args[0], direntPath))) {
            result.set(direntPath, dirent)
          }
        }
        for (const dirent of memResult) {
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
          // TODO why is this not working as [method] ???
          if (method === 'unlink') {
            return await this.volumeFs.promises.unlink.apply(this, args)
          }
          return this.volumeFs.promises[method].apply(this, args)
        } catch (e) {}
        break
      case 'mkdir':
        this.checkWriteAllowed(args[0])
        return this.volumeFs.promises[method].apply(this, args)
      default:
        throw new Error(`Method ${method} is not implemented.`)
    }
  }

  /**
   * Check if write is allowed by wroteAllowedPaths
   */
  protected checkWriteAllowed(fsPath: string) {
    if (this.writeAllowedPaths && !this.writeAllowedPaths.find(allowedPath => fsPath.startsWith(allowedPath))) {
      throw new Error(`Write to path ${fsPath} is not allowed in layer.`)
    }
  }

  /**
   * Extract readdir entry from readdir
   */
  protected pathFromReaddirEntry(readdirEntry): string {
    if (readdirEntry instanceof Buffer || typeof readdirEntry === 'string') {
      return String(readdirEntry)
    }
    return readdirEntry.name
  }

  /**
   * Sort map result from readdir
   */
  protected sortedArrayFromReaddirResult(readdirResult: Map<string, any>) {
    const array: any[] = []
    for (const key of Array.from(readdirResult.keys()).sort()) {
      const value = readdirResult.get(key)
      if (value !== undefined) array.push(value)
    }
    return array
  }

  /**
   * Prepare file from fs in memfs
   */
  protected async prepareInFs(fsPath: string, destinationPath?: string) {
    if (!destinationPath) {
      destinationPath = fsPath
    }
    try {
      ;(await this.volumeFs.promises.stat(destinationPath)).isFile()
    } catch (e) {
      if (this.checkIsUnlinked(fsPath)) {
        return
      }
      try {
        const content = (await promisify(this.sourceFs.readFile)(fsPath)) as Buffer
        await this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true })
        await this.volumeFs.promises.writeFile(destinationPath, content)
      } catch (e) {
        await this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true })
      }
    }
  }

  /**
   * Extract all paths for dump
   */
  protected extractAllPaths(obj: FsNode, prefix: string = '', accumulator: { [path: string]: string | Buffer | null } = {}) {
    Object.keys(obj).forEach(name => {
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

  /**
   * Check if paths is in unlinked array
   */
  protected checkIsUnlinked(fsPath: string) {
    return this.unlinkedPaths.find(unlinked => fsPath.startsWith(unlinked))
  }
}
