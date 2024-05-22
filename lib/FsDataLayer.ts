import * as fs from 'fs'
import { link } from 'linkfs'
import { DataLayer } from './DataLayer'

/**
 * FS data layer is wrapper, where sourceFs is system files
 */
export class FsDataLayer extends DataLayer {
  constructor(readonly workingDir: string, writeAllowedPaths?: string[]) {
    super(link(fs, ['/', workingDir]), writeAllowedPaths)
  }
}
