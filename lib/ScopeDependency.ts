export class ScopeDependency {
  async getKey() {
    return ''
  }

  async initialize() {
    // TODO
  }

  async finish() {
    // TODO
  }

  async isSingleAccess(): Promise<boolean> {
    return false
  }
}