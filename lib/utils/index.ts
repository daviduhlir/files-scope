import { Stats, constants as fsConstants } from 'fs'
import { DataLayerFsApi } from '../DataLayer/DataLayer'
import * as path from 'path'
export interface CopyResourcesOptions {
  skipExisting?: boolean
  exclude?: string[]
  include?: string[]
}

export const matchPathFilter = (fsPath: string, matchers: string[]) => {
  const fsPathParts = fsPath.split('/')
  for (const matcher of matchers) {
    const matcherParts = matcher.split('/')
    const partsMax = Math.min(fsPathParts.length, matcherParts.length)
    let matched = true
    for (let i = 0; i < partsMax; i++) {
      if (fsPathParts[i] !== partsMax[i]) {
        matched = false
        break
      }
    }
    if (matched) {
      return true
    }
  }
  return false
}

export const copyFs = async (
  sourcePath: string,
  destinationPath: string,
  sourceFs: DataLayerFsApi,
  destinationFs: DataLayerFsApi,
  options: CopyResourcesOptions = {},
): Promise<void> => {
  // skip excluded
  if (options.exclude?.length && matchPathFilter(sourcePath, options.exclude)) {
    return
  }

  if (options.include?.length && !matchPathFilter(sourcePath, options.include)) {
    return
  }

  const sourceStat = await sourceFs.promises.stat(sourcePath)

  if (sourceStat.isDirectory()) {
    const dirents = await sourceFs.promises.readdir(sourcePath)
    for (const dirent of dirents) {
      await copyFs(path.resolve(sourcePath, dirent), path.resolve(destinationPath, dirent), sourceFs, destinationFs, options)
    }
  } else {
    if (options.skipExisting) {
      try {
        await destinationFs.promises.access(destinationPath, fsConstants.F_OK)
        return
      } catch (e) {}
    }

    const destinationDirname = path.dirname(destinationPath)
    let destinationStat: Stats
    try {
      destinationStat = await destinationFs.promises.stat(destinationDirname)
      if (destinationStat.isFile()) {
        await destinationFs.promises.rm(destinationDirname, { recursive: true })
        await destinationFs.promises.mkdir(destinationDirname, { recursive: true })
      }
    } catch (e) {
      await destinationFs.promises.mkdir(destinationDirname, { recursive: true })
    }
    await destinationFs.promises.writeFile(destinationPath, await sourceFs.promises.readFile(sourcePath))
  }
}
