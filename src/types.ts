// TODO: fix this to be more specific
export type GeoJSON = any

export interface Configuration {
  /**
   * If property values should be trimmed.
   * @default true
   */
  trim?: boolean
  projection?: string
}

export type ShpByteInfo = {
  fileCode: number
  wordLength: number
  byteLength: number
  version: number
  shapeType: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  minZ: number
  maxZ: number
  minM: number
  maxM: number
}
