import { Configuration, GeoJSON } from './types'
import { getShpByteInfo } from './utils'

export default class Parser {
  private shp: Buffer
  private dbf: Buffer
  private shx?: Buffer
  private configuration?: Configuration
  private features: any[] = []
  private propertiesArray: any[] = []

  constructor(
    shp: Buffer,
    dbf: Buffer,
    shx?: Buffer,
    configuration?: Configuration,
  ) {
    this.shp = shp
    this.dbf = dbf
    this.shx = shx
    this.configuration = configuration
  }

  parseShp() {
    const dataView = new DataView(new Uint8Array(this.shp).buffer)
    const shpInfo = getShpByteInfo(dataView, 0).shpInfo // lê infos iniciais do shp, como byteLength etc

    let features: any[] = []

    // Se tivermos o shx, usar os offsets dele
    const index = this.parseShxIndex()

    if (index) {
      // ler pela tabela de índices (shx)
      for (const { offset, length } of index) {
        try {
          const recordView = new DataView(
            new Uint8Array(this.shp).buffer,
            offset,
            length,
          )
          let idxFeature = 8 // primeiro 4 bytes: record number, próximos 4 bytes: content length, então dados começam no byte 8

          const type: number = recordView.getInt32(4, true) // little endian
          const feature: any = {}

          switch (type) {
            case 1:
            case 11:
            case 21:
              feature.type = 'Point'
              feature.coordinates = [
                recordView.getFloat64(idxFeature, true),
                recordView.getFloat64(idxFeature + 8, true),
              ]
              break
            case 3:
            case 13:
            case 23:
            case 5:
            case 15:
            case 25:
              if (type === 3 || type === 13 || type === 23) {
                feature.type = 'MultiLineString'
              } else if (type === 5 || type === 15 || type === 25) {
                feature.type = 'Polygon'
              }
              const numberOfParts: number = recordView.getInt32(
                idxFeature + 32,
                true,
              )
              const nbpoints: number = recordView.getInt32(
                idxFeature + 36,
                true,
              )
              idxFeature += 40
              const nbpartsPoint: number[] = new Array(numberOfParts)
                .fill(0)
                .map(() => {
                  const result = recordView.getInt32(idxFeature, true)
                  idxFeature += 4
                  return result
                })

              feature.coordinates = new Array(numberOfParts)
                .fill(0)
                .map((_, i) => {
                  const idstart = nbpartsPoint[i]
                  const idend =
                    (i < numberOfParts - 1 ? nbpartsPoint[i + 1] : nbpoints) - 1
                  const part = []
                  for (let j = idstart; j <= idend; j++) {
                    part.push([
                      recordView.getFloat64(idxFeature, true),
                      recordView.getFloat64(idxFeature + 8, true),
                    ])
                    idxFeature += 16
                  }
                  return part
                })
              break
            case 8:
            case 18:
            case 28:
              feature.type = 'MultiPoint'
              const numberOfPoints = recordView.getInt32(idxFeature + 32, true)
              idxFeature += 36
              feature.coordinates = new Array(numberOfPoints)
                .fill(0)
                .map(() => {
                  const result = [
                    recordView.getFloat64(idxFeature, true),
                    recordView.getFloat64(idxFeature + 8, true),
                  ]
                  idxFeature += 16
                  return result
                })
              break
          }

          features.push(feature)
        } catch (e) {
          throw new Error('Error parsing shp file with shx index')
        }
      }
    } else {
      let idx = 0
      let shpInfo
      ;({ shpInfo, idx } = getShpByteInfo(dataView, idx))
      idx += 8 * 8

      while (idx < shpInfo.byteLength) {
        const feature: any = {}
        const length: number = dataView.getInt32((idx += 4), false)

        try {
          const type: number = dataView.getInt32((idx += 4), true)
          let idxFeature: number = idx + 4

          switch (type) {
            case 1:
            case 11:
            case 21:
              feature.type = 'Point'
              feature.coordinates = [
                dataView.getFloat64(idxFeature, true),
                dataView.getFloat64(idxFeature + 8, true),
              ]
              break
            case 3:
            case 13:
            case 23:
            case 5:
            case 15:
            case 25:
              if (type === 3 || type === 13 || type === 23) {
                feature.type = 'MultiLineString'
              } else if (type === 5 || type === 15 || type === 25) {
                feature.type = 'Polygon'
              }
              const numberOfParts: number = dataView.getInt32(
                idxFeature + 32,
                true,
              )
              const nbpoints: number = dataView.getInt32(idxFeature + 36, true)
              idxFeature += 40
              const nbpartsPoint: number[] = new Array(numberOfParts)
                .fill(0)
                .map(() => {
                  const result = dataView.getInt32(idxFeature, true)
                  idxFeature += 4
                  return result
                })

              feature.coordinates = new Array(numberOfParts)
                .fill(0)
                .map((_, i) => {
                  const idstart = nbpartsPoint[i]
                  const idend =
                    (i < numberOfParts - 1 ? nbpartsPoint[i + 1] : nbpoints) - 1
                  const part = []
                  for (let j = idstart; j <= idend; j++) {
                    part.push([
                      dataView.getFloat64(idxFeature, true),
                      dataView.getFloat64(idxFeature + 8, true),
                    ])
                    idxFeature += 16
                  }
                  return part
                })
              break
            case 8:
            case 18:
            case 28:
              feature.type = 'MultiPoint'
              const numberOfPoints = dataView.getInt32(idxFeature + 32, true)
              idxFeature += 36
              feature.coordinates = new Array(numberOfPoints)
                .fill(0)
                .map(() => {
                  const result = [
                    dataView.getFloat64(idxFeature, true),
                    dataView.getFloat64(idxFeature + 8, true),
                  ]
                  idxFeature += 16
                  return result
                })
              break
          }
        } catch (e) {
          throw new Error('Error parsing shp file')
        }
        idx += length * 2
        features.push(feature)
      }
    }

    this.features = features
  }

  parseDbf() {
    const dataView = new DataView(new Uint8Array(this.dbf).buffer)
    let idx = 4
    const numberOfRecords: number = dataView.getInt32(idx, true)
    idx += 28
    let end = false
    const fields = []
    try {
      while (true) {
        const field: any = {}
        const nameArray: string[] = []
        for (let i = 0; i < 10; i++) {
          const letter = dataView.getUint8(idx)
          if (letter !== 0) {
            nameArray.push(String.fromCharCode(letter))
          }
          idx += 1
        }
        field.name = nameArray.join('')
        idx += 1
        field.type = String.fromCharCode(dataView.getUint8(idx))
        idx += 5
        field.fieldLength = dataView.getUint8(idx)
        idx += 16
        fields.push(field)
        if (dataView.getUint8(idx) === 0x0d) {
          break
        }
      }
    } catch (err) {
      end = true
    }
    idx += 1
    const propertiesArray = []
    for (let i = 0; i < numberOfRecords; i++) {
      const properties: any = {}
      if (!end) {
        try {
          idx += 1
          for (const field of fields) {
            let str = ''
            const charString = []
            for (let h = 0; h < field.fieldLength; h++) {
              charString.push(String.fromCharCode(dataView.getUint8(idx)))
              idx += 1
            }
            str = charString.join('')
            if (this.configuration?.trim !== false) {
              str = str.trim()
            }
            const numberOfStr = parseFloat(str)
            if (isNaN(numberOfStr)) {
              properties[field.name] = str
            } else {
              properties[field.name] = numberOfStr
            }
          }
        } catch (err) {
          end = true
        }
      }
      propertiesArray.push(properties)
    }
    this.propertiesArray = propertiesArray
  }

  parseShxIndex() {
    if (!this.shx) return null

    const dataView = new DataView(new Uint8Array(this.shx).buffer)
    let idx = 100

    const offsetsLengths: { offset: number; length: number }[] = []

    while (idx < this.shx.length) {
      const offset = dataView.getInt32(idx, false) * 2
      const length = dataView.getInt32(idx + 4, false) * 2
      offsetsLengths.push({ offset, length })
      idx += 8
    }

    return offsetsLengths
  }

  geoJSON() {
    const geojson: any = {
      type: 'FeatureCollection',
      features: [],
    }
    for (
      let i = 0;
      i < Math.min(this.features.length, this.propertiesArray.length);
      i++
    ) {
      geojson.features.push({
        type: 'Feature',
        geometry: this.features[i],
        properties: this.propertiesArray[i],
      })
    }
    return geojson
  }

  parse(): GeoJSON {
    this.parseShp()
    this.parseDbf()

    return this.geoJSON()
  }
}
