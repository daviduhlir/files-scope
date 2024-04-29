import { Abortable } from 'events'
import { Dependency } from './Dependency'
import { Mode, ObjectEncodingOptions, OpenMode, promises as fs } from 'fs'
import * as path from 'path'
import { Stream } from 'stream'

export class FileDependency extends Dependency {
  constructor(public readonly filePath: string, public readonly writeAccess?: boolean, public readonly basePath: string = '') {
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
            encoding?: null | undefined;
            flag?: OpenMode | undefined;
        } & Abortable)
        | null,
  ): Promise<Buffer> {
    return fs.readFile(this.getFullPath(), options)
  }

  /**
   * Write file contents
   */
  async write(
    data:
      | string
      | NodeJS.ArrayBufferView
      | Iterable<string | NodeJS.ArrayBufferView>
      | AsyncIterable<string | NodeJS.ArrayBufferView>
      | Stream,
    options?:
      | (ObjectEncodingOptions & {
          mode?: Mode | undefined;
          flag?: OpenMode | undefined;
      } & Abortable)
      | BufferEncoding
      | null,
  ): Promise<void> {
    return fs.writeFile(this.getFullPath(), data, options)
  }
}