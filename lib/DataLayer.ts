export type PathDefinition = string
export type Item = Data | Unlinked | List

export class Data {
  constructor(
    readonly content: Buffer
  ) {}
}

export class Unlinked {}

export class List {
  items: {[name: string]: Item }
}

export interface LayerAction {
  type: 'write' | 'createList' | 'unlink'
  path: string
  content?: Buffer
}

export interface ListItemDetails {
  name: string
  isList: () => Promise<boolean>
  isData: () => Promise<boolean>
}

export class DataLayer {
  protected data: Item | null = null
  constructor() {}

  protected async readData(path: PathDefinition): Promise<Buffer> {
    // override it!
    throw new Error('Not implemented')
  }

  protected async readIsData(path: PathDefinition): Promise<boolean> {
    // override it!
    throw new Error('Not implemented')
  }

  protected async readIsList(path: PathDefinition): Promise<boolean> {
    // override it!
    throw new Error('Not implemented')
  }

  protected async readList(path: PathDefinition): Promise<ListItemDetails[]> {
    // override it!
    throw new Error('Not implemented')
  }

  protected async commit(actions: LayerAction[]) {
    // override it!
    throw new Error('Not implemented')
  }

  /**
   * Read data from path
   */
  async read(path: PathDefinition): Promise<Buffer> {
    const pointer = this.getPointer(path)
    if (pointer?.item?.[pointer?.name] instanceof Data) {
      return pointer.item[pointer.name].content
    } else if (!pointer?.item?.[pointer?.name]) {
      return this.readData(path)
    } else {
      throw new Error(`DATA_LAYER :: Can not read data for path ${path}`)
    }
  }

  /**
   * Read list from path
   */
  async listItems(path: PathDefinition): Promise<ListItemDetails[] | null> {
    const pointer = this.getPointer(path)

    let cachedList: ListItemDetails[] = []
    let realList: ListItemDetails[] = []

    try {
      realList = await this.readList(path)
    } catch(e) {}

    if (pointer?.item?.[pointer?.name] instanceof List) {
      cachedList = Object.keys(pointer.item[pointer.name].items)
      .filter(name => !(pointer.item[pointer.name].items[name] instanceof Unlinked))
      .map(name => ({
        name,
        isData: async () => pointer.item[pointer.name].items[name] instanceof Data,
        isList: async () => pointer.item[pointer.name].items[name] instanceof List,
      }))
    }

    return [
      ...cachedList,
      ...realList.filter(item => !cachedList.find(cachedItem => cachedItem.name === item.name)),
    ]
  }

  /**
   * Is data
   */
  async isData(path: PathDefinition): Promise<boolean> {
    const pointer = this.getPointer(path)
    if (pointer?.item?.[pointer?.name] instanceof Data) {
      return true
    } else if (!pointer?.item?.[pointer?.name]) {
      return this.readIsData(path)
    }
    return false
  }

  /**
   * Is list
   */
  async isList(path: PathDefinition): Promise<boolean> {
    const pointer = this.getPointer(path)
    if (pointer?.item?.[pointer?.name] instanceof List) {
      return true
    } else if (!pointer?.item?.[pointer?.name]) {
      return this.readIsList(path)
    }
    return false
  }

  /**
   * Is data exists
   */
  async isDataExists(path: PathDefinition): Promise<boolean> {
    return this.isData(path)
  }

  /**
   * Write to path
   */
  async write(path: PathDefinition, content: Buffer): Promise<Data> {
    const pointer = this.getPointer(path, true)
    // can write only into list, if there wasn't list on the point we are trying to write
    if (
      pointer?.item instanceof List && (
        !pointer?.item?.[pointer?.name] ||
        pointer?.item?.[pointer?.name] instanceof Data ||
        pointer?.item?.[pointer?.name] instanceof Unlinked
    )) {
      pointer.item[pointer.name] = new Data(content)
      return pointer.item[pointer.name]
    } else {
      throw new Error(`DATA_LAYER :: Path ${path} not found`)
    }
  }

  /**
   * Remove anything on path
   */
  async remove(path: PathDefinition): Promise<void> {
    const pointer = this.getPointer(path, true)
    // unlinked can be anything, that exists
    if (pointer) {
      pointer.item[pointer.name] = new Unlinked()
    } else {
      throw new Error(`DATA_LAYER :: Path ${path} not found`)
    }
  }

  /**
   * Create list on path
   */
  async createList(path: PathDefinition): Promise<void> {
    const pointer = this.getPointer(path, true)
    // list can be created only in another list
    if (pointer?.item?.[pointer?.name] instanceof List) {
      pointer.item[pointer.name] = new List()
    } else {
      throw new Error(`DATA_LAYER :: Path ${path} not found`)
    }
  }

  /**
   * Dump storagy and flush its content
   */
  async flush(): Promise<LayerAction[]> {
    const actions = this.dumpStorage()
    await this.commit(actions)
    this.data = null
    return actions
  }

  /**
   * Dump storage as actions
   */
  protected dumpStorage(path: string = '', item: Item | null = this.data, accumulator: LayerAction[] = []): LayerAction[] {
    if (!item) {
      return accumulator
    }
    if (item instanceof List) {
      const itemsNames = Object.keys(item.items)
      if (itemsNames.length) {
        itemsNames.forEach(name => {
          this.dumpStorage(`${path}/${name}`, item.items[name], accumulator)
        })
      } else {
        accumulator.push({
          type: 'createList',
          path,
        })
      }
    } else if (item instanceof Data) {
      accumulator.push({
        type: 'write',
        path,
        content: item.content,
      })
    } else if (item instanceof Unlinked) {
      accumulator.push({
        type: 'unlink',
        path,
      })
    }
    return accumulator
  }

  /**
   * Get pointer by path
   */
  protected getPointer(path: PathDefinition, createPath?: boolean): {name: string; item: Item} | null {
    const pathParts = path.split('/').filter(Boolean)
    let item: Item | null = this.data
    if (!item) {
      return null
    }

    for(let i = 0; i < pathParts.length; i++) {
      const name = pathParts[i]
      if (i < pathParts.length - 1) {
        if (item instanceof List) {
          if (!item.items[name] && createPath) {
            item.items[name] = new List()
          }
          item = item.items[name]
        } else {
          throw new Error(`DATA_LAYER :: Path ${path} not found`)
        }
      } else {
        return {
          item,
          name,
        }
      }
    }
    return null
  }
}
