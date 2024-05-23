import * as fs from 'fs'
import { DataLayer } from './DataLayer/DataLayer'
import { Dependency } from './Scope/Dependency'
import { Scope, ScopeOptions } from './Scope/Scope'
import { link } from 'linkfs'

export class FileScope<T, K extends { [key: string]: Dependency }> extends Scope<T, K> {
  constructor(readonly workingDir: string, readonly dependeciesMap: K, options?: Partial<ScopeOptions>) {
    super(dependeciesMap)
    this.initializeDataLayer()
  }

  /**
   * Initialize data layer
   */
  protected initializeDataLayer() {
    this.dataLayer = new DataLayer(
      link(fs, ['/', this.workingDir]),
      this.dependeciesList.filter(key => key.writeAccess).map(key => key.path),
    )
  }

  /**
   * Scope prepare factory
   */
  static prepare<K extends { [key: string]: Dependency }>(workingDir: string, dependeciesMap: K, options?: Partial<ScopeOptions>) {
    return new FileScope(workingDir, dependeciesMap, options)
  }
}
