import * as fs from 'fs'
import { DataLayer } from './DataLayer/DataLayer'
import { Dependency } from './Scope/Dependency'
import { Scope, ScopeOptions } from './Scope/Scope'
import { link } from 'linkfs'
import { createSubpath } from './utils'

export class FileScope<T> extends Scope<T> {
  constructor(readonly workingDir: string, options?: Partial<ScopeOptions>) {
    super(options)
  }

  public subScope(subPath: string) {
    return FileScope.prepare(createSubpath(this.workingDir, subPath))
  }

  /**
   * Initialize data layer
   */
  protected createDatalayer(dependecies: Dependency[]): DataLayer {
    return new DataLayer(
      link(fs, ['/', this.workingDir]),
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
