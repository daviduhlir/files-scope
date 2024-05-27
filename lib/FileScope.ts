import * as fs from 'fs'
import { DataLayer } from './DataLayer/DataLayer'
import { Dependency } from './Scope/Dependency'
import { Scope, ScopeOptions } from './Scope/Scope'
import { link } from 'linkfs'
import { createSubpath } from './utils'

export class FileScope extends Scope {
  /**
   * Initialize data layer
   */
  protected createDatalayer(parentDataLayer: DataLayer, dependecies: Dependency[]): DataLayer {
    return new DataLayer(
      parentDataLayer ? parentDataLayer.fs : link(fs, ['/', this.workingDir]),
      dependecies.filter(key => key.writeAccess).map(key => key.path),
    )
  }

  /**
   * Scope prepare factory
   */
  static prepare(workingDir: string, options?: Partial<ScopeOptions>) {
    return new FileScope(workingDir, options)
  }
}
