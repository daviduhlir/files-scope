import * as fs from 'fs'
import { DataLayer } from './DataLayer/DataLayer'
import { Dependency } from './Scope/Dependency'
import { Scope, ScopeOptions } from './Scope/Scope'
import { link } from 'linkfs'

export class FileScope extends Scope {
  static dumpStats: boolean
  /**
   * Initialize data layer
   */
  protected createDatalayer(dependecies: Dependency[]): DataLayer {
    return new DataLayer(
      { ...link(fs, ['/', this.workingDir]), promises: link(fs.promises, ['/', this.workingDir]) },
      dependecies.filter(key => key.writeAccess).map(key => key.path),
      FileScope.dumpStats ? this.workingDir : undefined,
    )
  }

  /**
   * Scope prepare factory
   */
  static prepare(workingDir: string, options?: Partial<ScopeOptions>) {
    return new FileScope(workingDir, options)
  }
}
