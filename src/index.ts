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

  return parseFiles(
    joinPaths(folder, shpFiles[0]),
    joinPaths(folder, dbfFiles[0]),
    configuration,
  )
}

/**
 * Parses `shp` & `dbf` files into a GeoJSON object.
 * @param shpFile The path to the `shp` file.
 * @param dbfFile The path to the `dbf` file.
 * @param configuration The configuration settings to use.
 * @returns A promise containing the GeoJSON object.
 */
export const parseFiles = async (
  shpFile: string | Buffer,
  dbfFile: string | Buffer,
  configuration?: Configuration,
): Promise<GeoJSON> => {
  console.log('pegando do github')
  if (typeof shpFile === 'string') {
    const shpReaded = await ReactNativeBlobUtil.fs.readFile(shpFile, 'base64')
    shpFile = Buffer.from(shpReaded, 'base64')
  }
  if (typeof dbfFile === 'string') {
    const dbfReaded = await ReactNativeBlobUtil.fs.readFile(dbfFile, 'base64')
    dbfFile = Buffer.from(dbfReaded, 'base64')
  }

  return new Parser(shpFile, dbfFile, configuration).parse()
}
