export type PathDefinition = string
export type Item = Data | Unlinked | List

export class Data {
  constructor(
    readonly content: Buffer
  ) {}
}

export class Unlinked {
  content: Buffer
}

export class List {
  items: {[name: string]: Item }
}

export interface LayerAction {
  type: 'write' | 'createList' | 'unlink'
  path: string
  content?: Buffer
}

export class DataLayer {
  protected data: Item | null = null
  constructor() {}

  protected async readData(path: PathDefinition): Promise<Buffer | null> {
    // TODO override it!
    return null
  }

  protected async readList(path: PathDefinition): Promise<string[] | null> {
    // TODO override it!
    return null
  }

  /**
   * Read data from path
   */
  async read(path: PathDefinition): Promise<Buffer | null> {
    const pointer = this.getPointer(path)
    if (pointer?.item?.[pointer?.name] instanceof Data) {
      return pointer.item[pointer.name].content
    } else {
      // TODO read from different place!
      // TODO use this.readData(path) ...
    }
    return null
  }

  /**
   * Read list from path
   */
  async list(path: PathDefinition): Promise<string[] | null> {
    const pointer = this.getPointer(path)
    if (pointer?.item?.[pointer?.name] instanceof List) {
      return Object.keys(pointer.item[pointer.name].items)
    } else {
      // TODO read from different place!
      // TODO use this.readList(path) ...
    }
    return null
  }

  /**
   * Write to path
   */
  async write(path: PathDefinition, content: Buffer): Promise<void> {
    const pointer = this.getPointer(path, true)
    // can write only into list, if there wasn't list on the point we are trying to write
    if (
      pointer?.item instanceof List && (
        !pointer?.item?.[pointer?.name] ||
        pointer?.item?.[pointer?.name] instanceof Data ||
        pointer?.item?.[pointer?.name] instanceof Unlinked
    )) {
      pointer.item[pointer.name] = new Data(content)
    } else {
      throw new Error('Path not found')
    }
  }

  /**
   * Remove anything on path
   */
  async remove(path: PathDefinition): Promise<void> {
    const pointer = this.getPointer(path)
    // unlinked can be anything, that exists
    if (pointer?.item?.[pointer?.name]) {
      pointer.item[pointer.name] = new Unlinked()
    } else {
      throw new Error('Path not found')
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
      throw new Error('Path not found')
    }
  }

  flush(): LayerAction[] {
    const actions = this.dumpStorage()
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
          throw new Error('Path not found')
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
