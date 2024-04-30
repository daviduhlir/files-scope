import { Abortable } from 'events'
import { Dependency } from './Dependency'
import { Mode, ObjectEncodingOptions, OpenMode, StatOptions, Stats, promises as fs } from 'fs'
import * as path from 'path'
import { Stream } from 'stream'

export class FsDependency extends Dependency {
  /**
   * Factory
   * @param filePath
   * @param writeAccess
   * @param basePath
   * @returns
   */
  static access(filePath: string, writeAccess?: boolean, basePath: string = './') {
    return new FsDependency(filePath, writeAccess, basePath)
  }

  constructor(public readonly filePath: string, public readonly writeAccess?: boolean, public readonly basePath: string = './') {
    super()
  }

  /**
   * Dependency functions
   */
  async getKey() {
    return this.filePath
  }

  async isSingleAccess(): Promise<boolean> {
    return !!this.writeAccess
  }

  /**
   * Get path to file content
   */
  getFullPath() {
    return path.resolve(this.basePath, this.filePath)
  }

  /**
   * Read file contents
   */
  async read(
    options?:
      | ({
          encoding?: null | undefined
          flag?: OpenMode | undefined
        } & Abortable)
      | null,
  ): Promise<Buffer> {
    return fs.readFile(this.getFullPath(), options)
  }

  /**
   * Write file contents
   */
  async write(
    data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream,
    options?:
      | (ObjectEncodingOptions & {
          mode?: Mode | undefined
          flag?: OpenMode | undefined
        } & Abortable)
      | BufferEncoding
      | null,
  ): Promise<void> {
    if (!this.writeAccess) {
      throw new Error('Write to read access only file in scope is not allowed')
    }
    return fs.writeFile(this.getFullPath(), data, options)
  }

  /**
   * Stat file
   */
  async stat(
    opts?: StatOptions & {
      bigint?: false | undefined
    },
  ): Promise<Stats> {
    return fs.stat(this.getFullPath(), opts)
  }

  /**
   * LStat file
   */
  async lstat(
    opts?: StatOptions & {
      bigint?: false | undefined
    },
  ): Promise<Stats> {
    return fs.lstat(this.getFullPath(), opts)
  }

  /**
   * Unlink file
   */
  async unlink(): Promise<void> {
    if (!this.writeAccess) {
      throw new Error('Write to read access only file in scope is not allowed')
    }
    return fs.unlink(this.getFullPath())
  }

  /**
   * Is directory
   */
  async isDirectory(): Promise<boolean> {
    return (await this.lstat()).isDirectory()
  }

  /**
   * Is file
   */
  async isFile(): Promise<boolean> {
    return (await this.lstat()).isFile()
  }

  /**
   * Read directory
   */
  async readdir(
    options?:
      | (ObjectEncodingOptions & {
          withFileTypes?: false | undefined
        })
      | BufferEncoding
      | null,
  ): Promise<string[]> {
    return fs.readdir(this.getFullPath(), options)
  }

  /**
   * File exists
   */
  async exists(): Promise<boolean> {
    try {
      await this.stat()
      return true
    } catch (e) {
      return false
    }
  }
}
