# React Native Shapefile to Geojson

rn-shp-to-geojson is a React Native library for parsing shapefiles into GeoJSON objects.
It uses react-native-blob-util and react-native-fs to read and process the files.

## Installation

You can install this package using npm or yarn. To install with npm, run the following command:

```bash
npm install rn-shp-to-geojson --save
```

To install with yarn, run the following command:

```bash
yarn add rn-shp-to-geojson
```

## Usage

```javascript
import { parseFolder } from 'rn-shp-to-geojson';

// Example usage
const folderPath = '/path/to/shapefile';
parseFolder(folderPath)
  .then(geoJSON => {
    console.log(geoJSON);
  })
  .catch(error => {
    console.error(error);
  });
```

## API

### `parseFolder(folderPath: string, configuration?: Configuration): Promise<GeoJSON>`

Parses a folder path containing a `shp` and `dbf` file pair into a GeoJSON object.

- `folderPath` (required): The path to the folder containing the `shp` and `dbf` files.
- `configuration` (optional): The configuration settings to use. You can provide an object with the following optional properties:
  - `trim` (default: `true`): If property values should be trimmed.

Returns a Promise that resolves to the parsed GeoJSON object.

### Example

```javascript
import { parseFolder } from 'rn-shp-to-geojson';

const folderPath = '/path/to/shapefiles';
parseFolder(folderPath)
  .then(geoJSON => {
    console.log(geoJSON);
  })
  .catch(error => {
    console.error(error);
  });
```

### `parseFiles(shpPath: string, dbfPath: string, configuration?: Configuration): Promise<GeoJSON>`

Parses a pair of `shp` and `dbf` files into a GeoJSON object.

- `shpPath` (required): The path to the `shp` file.
- `dbfPath` (required): The path to the `dbf` file.
- `configuration` (optional): The configuration settings to use. You can provide an object with the following optional properties:
  - `trim` (default: `true`): If property values should be trimmed.

Returns a Promise that resolves to the parsed GeoJSON object.

### Example

```javascript
import { parseFiles } from 'rn-shp-to-geojson';

const shpPath = '/path/to/shapefile.shp';
const dbfPath = '/path/to/shapefile.dbf';
parseFiles(shpPath, dbfPath)
  .then(geoJSON => {
    console.log(geoJSON);
  })
  .catch(error => {
    console.error(error);
  });
```

## Contributing

If you'd like to contribute to this project, please follow the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This package is licensed under the [MIT License](LICENSE).
