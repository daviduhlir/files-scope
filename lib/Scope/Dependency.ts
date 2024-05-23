import { DataLayerPromiseApi, DataLayerPromiseSingleFileApi } from '../interfaces'
import * as path from 'path'
import { DataLayer } from '../DataLayer/DataLayer'

/**
 * Dependency representation with own fs api
 */
export const dependencyFsInjector = Symbol()
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
        return (...args) => {
          return this.dataLayer.fs.promises[propKey.toString()].apply(this, [this.path, ...args])
        }
      },
    })
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
  protected relativizePath(inputPath: string) {
    return inputPath.startsWith('/') ? `.${inputPath}` : inputPath
  }
  get fs(): DataLayerPromiseApi {
    return new Proxy(this as any, {
      get: (target, propKey, receiver) => {
        return (...args) => {
          const requestedPath = args.shift()
          const callPath = path.resolve(this.path, this.relativizePath(requestedPath))
          return this.dataLayer.fs.promises[propKey.toString()].apply(this, [callPath, ...args])
        }
      },
    })
  }
}
