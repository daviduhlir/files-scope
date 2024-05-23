import * as fs from 'fs'
import { DataLayer } from './DataLayer/DataLayer'
import { Dependency } from './Scope/Dependency'
import { Scope, ScopeOptions } from './Scope/Scope'
import { link } from 'linkfs'

export class FileScope<T> extends Scope<T> {
  constructor(readonly workingDir: string, options?: Partial<ScopeOptions>) {
    super(options)
  }

  /**
   * Initialize data layer
   */
  protected beforeOpen() {
    this.dataLayer = new DataLayer(
      link(fs, ['/', this.workingDir]),
      this.dependeciesList.filter(key => key.writeAccess).map(key => key.path),
    )
  }

  /**
   * Scope prepare factory
   */
  static prepare(workingDir: string, options?: Partial<ScopeOptions>) {
    return new FileScope(workingDir, options)
  }
}
