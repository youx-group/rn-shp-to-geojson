import { Buffer } from 'buffer'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { readdir } from 'react-native-fs'

import { Configuration, GeoJSON } from './types'
import Parser from './Parser'
import { joinPaths } from './utils'

/**
 * Parses a folder path containing a `shp` & `dbf` file pair into a GeoJSON object.
 * @param folder The path to the folder containing the `shp` & `dbf` file.
 * @param configuration The configuration settings to use.
 * @returns A promise containing the GeoJSON object.
 */
export const parseFolder = async (
  folder: string,
  configuration?: Configuration,
): Promise<GeoJSON> => {
  const files = await readdir(folder)
  const shpFiles = files.filter(file => file.endsWith('.shp'))
  const dbfFiles = files.filter(file => file.endsWith('.dbf'))
  const prjFiles = files.filter(file => file.endsWith('.prj'))

  if (shpFiles.length > 1) {
    throw new Error('Multiple shapefiles found.')
  }
  if (dbfFiles.length > 1) {
    throw new Error('Multiple dbf files found.')
  }
  if (shpFiles.length === 0) {
    throw new Error('No shapefiles found.')
  }
  if (dbfFiles.length === 0) {
    throw new Error('No dbf files found.')
  }

  const shpPath = joinPaths(folder, shpFiles[0])
  const dbfPath = joinPaths(folder, dbfFiles[0])
  const prjPath =
    prjFiles.length > 0 ? joinPaths(folder, prjFiles[0]) : undefined

  const prjContent = prjPath
    ? await ReactNativeBlobUtil.fs.readFile(prjPath, 'utf8')
    : undefined

  return parseFiles(shpPath, dbfPath, configuration, prjContent)
}

/**
 * Parses `shp` & `dbf` files into a GeoJSON object.
 * @param shpFile The path to the `shp` file.
 * @param dbfFile The path to the `dbf` file.
 * @param prjContent The path to the `prj` file.
 * @param configuration The configuration settings to use.
 * @returns A promise containing the GeoJSON object.
 */
export const parseFiles = async (
  shpFile: string | Buffer,
  dbfFile: string | Buffer,
  configuration?: Configuration,
  prjContent?: string | Buffer,
): Promise<GeoJSON> => {
  // Lê e converte o .shp
  if (typeof shpFile === 'string') {
    const shpBase64 = await ReactNativeBlobUtil.fs.readFile(shpFile, 'base64')
    shpFile = Buffer.from(shpBase64, 'base64')
  }

  // Lê e converte o .dbf
  if (typeof dbfFile === 'string') {
    const dbfBase64 = await ReactNativeBlobUtil.fs.readFile(dbfFile, 'base64')
    dbfFile = Buffer.from(dbfBase64, 'base64')
  }

  let prjString: string | undefined

  if (typeof prjContent === 'string') {
    if (prjContent.endsWith('.prj') || prjContent.includes('/')) {
      prjString = await ReactNativeBlobUtil.fs.readFile(prjContent, 'utf8')
    } else {
      prjString = prjContent
    }
  } else if (Buffer.isBuffer(prjContent)) {
    prjString = prjContent.toString('utf8')
  }

  return new Parser(shpFile, dbfFile, prjString, configuration).parse()
}
