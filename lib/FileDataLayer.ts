import { DataLayer, LayerAction, ListItemDetails, PathDefinition } from './DataLayer'
import { promises as fs } from 'fs'
import * as Path from 'path'

export class FileDataLayer extends DataLayer {
  constructor(readonly fsPath: string) {
    super()
  }

  protected async readData(fsPath: PathDefinition): Promise<Buffer> {
    return fs.readFile(Path.resolve(this.fsPath, fsPath))
  }

  protected async readIsData(fsPath: PathDefinition): Promise<boolean> {
    const stat = await fs.stat(Path.resolve(this.fsPath, fsPath))
    return stat.isFile()
  }

  protected async readIsList(fsPath: PathDefinition): Promise<boolean> {
    const stat = await fs.stat(Path.resolve(this.fsPath, fsPath))
    return stat.isDirectory()
  }

  protected async readList(fsPath: PathDefinition): Promise<ListItemDetails[]> {
    return (await fs.readdir(Path.resolve(this.fsPath, fsPath), { withFileTypes: true })).map(dirent => ({
      name: dirent.name,
      isData: async () => dirent.isFile(),
      isList: async () => dirent.isDirectory(),
    }))
  }

  protected async commit(actions: LayerAction[]) {
    for (const action of actions) {
      const fsPath = Path.resolve(this.fsPath, action.path)
      switch(action.type) {
        case 'write': {
          if (action.content) {
            await fs.writeFile(fsPath, action.content)
          }
        }
        case 'createList': {
          try {
            const stat = await fs.stat(fsPath)
            if (stat.isFile()) {
              throw new Error(`FILE_DATA_LAYER :: Create list failed, file with name ${action.path} exists on this path`)
            }
          } catch(e) {
            await fs.mkdir(fsPath)
          }
          break;
        }
        case 'unlink': {
          try {
            const stat = await fs.stat(fsPath)
            if (stat.isFile()) {
              await fs.unlink(fsPath)
            } else if (stat.isDirectory()) {
              await fs.rm(fsPath, { recursive: true })
            }
          } catch(e) {
            // file was already removed
          }
          break;
        }
        default: {
          throw new Error(`FILE_DATA_LAYER :: Commit action type ${action.type} is not implemented.`)
        }
      }
    }
  }
}
