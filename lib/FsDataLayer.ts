import * as fs from 'fs'
import { link } from 'linkfs';
import { DataLayer } from './DataLayer'

export class FsDataLayer extends DataLayer {
  constructor(readonly workingDir: string, writeAllowedPaths?: string[]) {
    super(link(fs, ['/', workingDir]), writeAllowedPaths)
  }
}