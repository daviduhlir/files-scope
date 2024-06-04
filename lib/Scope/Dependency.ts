import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from '../interfaces'
import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer'
import { createSubpath } from '../utils'
import { SUPPORTED_METHODS, SUPPORTED_FILE_METHODS, SUPPORTED_DIRECT_METHODS } from '../constants'
import { IFs } from 'memfs'
import * as systemFs from 'fs'

export const SYSTEM_FS: IFs | DataLayerFsApi = systemFs as any

/**
 * Dependency representation with own fs api
 */
export const dependencyFsInjector = '__dependencyFsInjector__'
export class Dependency {
  protected dataLayer: DataLayer = null
  constructor(readonly path: string, readonly writeAccess?: boolean) {}
  [dependencyFsInjector] = (dataLayer: DataLayer) => {
    if (this.dataLayer) {
      throw new Error('Dependency can not be used multiple times in scope.')
    }
    this.dataLayer = dataLayer
  }

  protected getFsProxy() {
    return new Proxy(this as any, {
      get: (target, propKey, receiver) => {
        const stringPropKey = propKey.toString()
        if (SUPPORTED_DIRECT_METHODS.includes(stringPropKey)) {
          return (...args) => this.dataLayer.fs[stringPropKey].apply(this, [this.path, ...args])
        } else if (SUPPORTED_FILE_METHODS.includes(stringPropKey)) {
          return (...args) => this.dataLayer.fs.promises[stringPropKey].apply(this, [this.path, ...args])
        }
        return undefined
      },
    })
  }

  needsLock() {
    return true
  }

  initialize() {
    // TODO
  }

  /**
   * Factory
   */
  static writeFileAccess(filePath: string): DependencyFile {
    return new DependencyFile(filePath, true)
  }

  static readFileAccess(filePath: string): DependencyFile {
    return new DependencyFile(filePath, false)
  }

  static writeFolderAccess(filePath: string): DependencyFolder {
    return new DependencyFolder(filePath, true)
  }

  static readFolderAccess(filePath: string): DependencyFolder {
    return new DependencyFolder(filePath, false)
  }

  static readExternalAccess(filePath: string, alternativeFs: IFs | DataLayerFsApi = SYSTEM_FS): DependencyExternal {
    return new DependencyExternal(filePath, alternativeFs)
  }
}

/**
 * File dependency
 */
export class DependencyFile extends Dependency {
  get fs(): DataLayerPromiseSingleFileApi {
    return this.getFsProxy()
  }
}

export class DependencyFolder extends Dependency {
  relativizePath(requestedPath: any): string {
    throw new Error('Method not implemented.')
  }
  get fs(): DataLayerPromiseApi {
    return new Proxy(this as any, {
      get: (target, propKey, receiver) => {
        const stringPropKey = propKey.toString()
        if (SUPPORTED_METHODS.includes(stringPropKey)) {
          return (...args) => {
            const requestedPath = args.shift()
            const callPath = createSubpath(this.path, requestedPath)
            return this.dataLayer.fs.promises[stringPropKey].apply(this, [callPath, ...args])
          }
        }
        return undefined
      },
    })
  }
}

export class DependencyExternal extends Dependency {
  constructor(readonly path: string, readonly alternativeFs: IFs | DataLayerFsApi = SYSTEM_FS) {
    super(path)
  }
  needsLock() {
    return false
  }
  initialize() {
    this.dataLayer.addExternal(this.path, this.alternativeFs)
  }
}
