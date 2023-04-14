import { ShpByteInfo } from './types'

const joinPaths = (...paths: string[]): string => {
  return paths
    .map((part, i) => {
      if (i === 0) {
        return part.trim().replace(/[/]*$/g, '')
      } else {
        return part.trim().replace(/(^[/]*|[/]*$)/g, '')
      }
    })
    .filter(x => x.length)
    .join('/')
}

const getShpByteInfo = (dataView: DataView, idx: number) => {
  const info = {} as ShpByteInfo

  info.fileCode = dataView.getInt32(idx, false)
  info.wordLength = dataView.getInt32((idx += 6 * 4), false)
  info.byteLength = info.wordLength * 2
  info.version = dataView.getInt32((idx += 4), true)
  info.shapeType = dataView.getInt32((idx += 4), true)
  info.minX = dataView.getFloat64((idx += 4), true)
  info.minY = dataView.getFloat64(idx + 8, true)
  info.maxX = dataView.getFloat64(idx + 16, true)
  info.maxY = dataView.getFloat64(idx + 24, true)
  info.minZ = dataView.getFloat64(idx + 32, true)
  info.maxZ = dataView.getFloat64(idx + 40, true)
  info.minM = dataView.getFloat64(idx + 48, true)
  info.maxM = dataView.getFloat64(idx + 56, true)

  return { shpInfo: info, idx }
}

export { joinPaths, getShpByteInfo }
