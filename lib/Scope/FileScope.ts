import { FsDataLayer } from '../DataLayer/FsDataLayer'
import { Dependency } from './Dependency'
import { Scope, ScopeOptions } from './Scope'

export class FileScope<T, K extends { [key: string]: Dependency }> extends Scope<T, K> {
  constructor(readonly workingDir: string, readonly dependeciesMap: K, options?: Partial<ScopeOptions>) {
    super(dependeciesMap)
    this.initializeDataLayer()
  }

  /**
   * Initialize data layer
   */
  protected initializeDataLayer() {
    this.dataLayer = new FsDataLayer(
      this.workingDir,
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
