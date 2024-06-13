import { IFs, Volume, createFsFromVolume } from 'memfs'
import { promisify } from 'util'
import * as path from 'path'
import { FsCallbackApi, FsPromisesApi } from 'memfs/lib/node/types'
import Stats from 'memfs/lib/Stats'
import { DataLayerCallbackApi, DataLayerPromiseApi } from '../interfaces'
import { F_OK } from 'constants'
import { isSubpath, makeAbsolutePath, randomHash } from '../helpers'
import { SUPPORTED_DIRECT_METHODS, SUPPORTED_METHODS } from '../constants'
import { promises as systemFs } from 'fs'

export interface DataLayerPromisesFsApi extends DataLayerPromiseApi {
  unsafeFullFs: FsPromisesApi
}
export interface DataLayerFsApi extends DataLayerCallbackApi {
  promises: DataLayerPromisesFsApi
  unsafeFullFs: FsCallbackApi
  addExternal: (path: string, fs: IFs | DataLayerFsApi) => void
  statSync: (path: string) => Stats<number>
}

export interface FsNode {
  [name: string]: FsNode | string | Buffer | null
}

export interface ExternalFsLink {
  path: string
  fs: IFs | DataLayerFsApi
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
  protected tempFiles: string[] = []

  // /Users/daviduhlir/Documents/Work/zenoo/hub-design-studio/node_modules/@zenoo/hub-design-studio-core/build/graphql/utils/index.less
  protected externals: ExternalFsLink[] = []

  constructor(readonly sourceFs: IFs | DataLayerFsApi, readonly writeAllowedPaths?: string[]) {
    this.volumeFs = createFsFromVolume(this.volume)
  }

  /**
   * Add read callback alias for subpath
   */
  addExternal(path: string, fs: IFs | DataLayerFsApi) {
    this.externals.push({ path, fs })
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
        const stringPropKey = propKey.toString()
        if (stringPropKey === 'promises') {
          return this.promises
        } else if (stringPropKey === 'unsafeFullFs') {
          return this.fs
        } else if (stringPropKey === 'addExternal') {
          return (path: string, fs) => this.addExternal(path, fs)
        } else if (SUPPORTED_DIRECT_METHODS.includes(stringPropKey)) {
          return (...args) => this.solveDirectFsAction(stringPropKey, args)
        } else if (SUPPORTED_METHODS.includes(stringPropKey)) {
          return (...args) => {
            const cb = args.pop()
            this.solveFsAction(stringPropKey, args).then(
              result => cb(null, result),
              error => cb(error, null),
            )
          }
        }
        return undefined
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
        return (...args) => this.solveFsAction(propKey.toString(), args)
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
    for(const tempFile of this.tempFiles) {
      try {
        await systemFs.unlink(tempFile)
      } catch(e) {
        console.log(`[FILE-SCOPE] Remove temporary path on path ${tempFile} failed`, e)
      }
    }
    this.tempFiles = []

    this.reset()
    return Object.keys(dumped.nodes).concat(dumped.unlinkedPaths)
  }

  /**
   * Solve direct fs actions
   */
  protected solveDirectFsAction(method: string, args: any[]) {
    let external: ExternalFsLink
    switch (method) {
      case 'statSync':
        external = this.getExternalPath(args[0])
        if (external) {
          return external.fs.statSync.apply(this, args)
        }
        try {
          return this.volumeFs.statSync.apply(this, args)
        } catch (e) {
          if (this.checkIsUnlinked(args[0] as string)) {
            throw new Error(`No such file on path ${args[0]}`)
          }
          return this.sourceFs.statSync.apply(this, args)
        }
      case 'createReadStream':
        external = this.getExternalPath(args[0])
        if (external) {
          return external.fs.createReadStream.apply(this, args)
        }
        try {
          this.volumeFs.statSync(args[0])
          return this.volumeFs.createReadStream.apply(this, args)
        } catch (e) {
          if (this.checkIsUnlinked(args[0] as string)) {
            throw new Error(`No such file on path ${args[0]}`)
          }
          this.sourceFs.statSync(args[0])
          return this.sourceFs.createReadStream.apply(this, args)
        }
      case 'createWriteStream':
        this.checkWriteAllowed(args[0])
        this.volumeFs.mkdirSync(path.dirname(args[0]), { recursive: true })
        return this.volumeFs.createWriteStream.apply(this, args)
      default:
        throw new Error(`Method ${method} is not implemented.`)
    }
  }

  /**
   * Solve fs actions, that is called from fs proxy
   */
  protected async solveFsAction(method: string, args: any[]) {
    let external: ExternalFsLink
    switch (method) {
      // Access file in systemFS
      case 'accessInSystemFs': {
        const srcPath: string = args[0]
        const dstTempPath: string = args[1]
        if (!(await this.fs.promises.fileExists(srcPath))) {
          throw new Error(`No such file on path ${srcPath}`)
        }
        const content = await this.fs.promises.readFile(srcPath)
        const dstPath = path.resolve(dstTempPath, randomHash())
        // TODO check if already exists??
        await systemFs.writeFile(dstPath, content)
        this.tempFiles.push(dstPath)
        return dstPath
      }
      case 'copyFromFs':
        const srcPath: string = args[0]
        const externalFs: DataLayerCallbackApi = args[1]
        const dstPath: string = args[2]
        const content = await externalFs.promises.readFile(srcPath)
        return this.fs.promises.writeFile(dstPath, content)
      // read operations
      case 'fileExists':
        // resolve alias
        external = this.getExternalPath(args[0])
        if (external) {
          try {
            await external.fs.promises.access(args[0], F_OK)
            return true
          } catch (e) {
            return false
          }
        }

        try {
          await this.volumeFs.promises.access(args[0], F_OK)
          return true
        } catch (e) {
          try {
            if (this.checkIsUnlinked(args[0] as string)) {
              throw new Error(`No such file on path ${args[0]}`)
            }
            await promisify(this.sourceFs.access as any)(args[0], F_OK)
            return true
          } catch (e) {}
        }
        return false
      case 'directoryExists':
        external = this.getExternalPath(args[0])
        if (external) {
          try {
            return (await external.fs.promises.stat(args[0])).isDirectory()
          } catch (e) {
            return false
          }
        }

        try {
          return (await this.volumeFs.promises.stat(args[0])).isDirectory()
        } catch (e) {
          try {
            if (this.checkIsUnlinked(args[0] as string)) {
              throw new Error(`No such directory on path ${args[0]}`)
            }
            if (((await promisify(this.sourceFs.stat)(args[0])) as any).isDirectory()) {
              return true
            }
          } catch (e) {}
        }
        return false
      case 'readFile':
      case 'lstat':
      case 'stat':
      case 'access':
      case 'createReadStream':
        external = this.getExternalPath(args[0])
        if (external) {
          return external.fs.promises[method].apply(this, args)
        }

        try {
          return await this.volumeFs.promises[method].apply(this, args)
        } catch (e) {
          if (this.checkIsUnlinked(args[0] as string)) {
            throw new Error(`No such file on path ${args[0]}`)
          }
          return promisify(this.sourceFs[method]).apply(this, args)
        }
      case 'readdir': {
        external = this.getExternalPath(args[0])
        if (external) {
          return external.fs.promises.readdir.apply(this, args)
        }

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
      case 'createWriteStream':
        this.checkWriteAllowed(args[0])
        await this.volumeFs.promises.mkdir(path.dirname(args[0]), { recursive: true })
        return this.volumeFs.promises[method].apply(this, args)
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
   * Get absolute alias path, if match
   */
  protected getExternalPath(fsPath: string): ExternalFsLink {
    return this.externals.find(item => isSubpath(fsPath, item.path))
  }

  /**
   * Check if write is allowed by wroteAllowedPaths
   */
  protected checkWriteAllowed(fsPath: string) {
    if (this.writeAllowedPaths && !this.writeAllowedPaths.find(allowedPath => isSubpath(fsPath, allowedPath))) {
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
    const fsPathRelative = makeAbsolutePath(fsPath)
    return this.unlinkedPaths.find(unlinked => fsPathRelative.startsWith(makeAbsolutePath(unlinked)))
  }
}
