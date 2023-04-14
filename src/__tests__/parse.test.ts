const RNShpToGeoJSON = require("../../lib/index.js");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const testFilesPath = path.join(__dirname, "..", "testFiles");

describe("Errors", () => {
	const errorFolderPath = path.join(testFilesPath, "error");

	beforeEach(async () => {
		await mkdirp(errorFolderPath);
	});
	afterEach(() => {
		rimraf.sync(errorFolderPath);
	});

	it("Should throw an error if no files in directory", async () => {
		await expect(RNShpToGeoJSON.parseFolder(errorFolderPath)).rejects.toEqual(new Error("No shapefiles found."));
	});
	it("Should throw an error if no dbf files in directory", async () => {
		await fs.writeFileSync(path.join(errorFolderPath, "test.shp"), "test");
		await expect(RNShpToGeoJSON.parseFolder(errorFolderPath)).rejects.toEqual(new Error("No dbf files found."));
	});
	it("Should throw an error if multiple shapefiles in directory", async () => {
		await fs.writeFileSync(path.join(errorFolderPath, "test.shp"), "test");
		await fs.writeFileSync(path.join(errorFolderPath, "testB.shp"), "test");
		await expect(RNShpToGeoJSON.parseFolder(errorFolderPath)).rejects.toEqual(new Error("Multiple shapefiles found."));
	});
	it("Should throw an error if multiple dbf in directory", async () => {
		await fs.writeFileSync(path.join(errorFolderPath, "test.shp"), "test");
		await fs.writeFileSync(path.join(errorFolderPath, "test.dbf"), "test");
		await fs.writeFileSync(path.join(errorFolderPath, "testB.dbf"), "test");
		await expect(RNShpToGeoJSON.parseFolder(errorFolderPath)).rejects.toEqual(new Error("Multiple dbf files found."));
	});
});

fs.readdirSync(testFilesPath)
  .filter((folder) => !folder.startsWith("."))
  .forEach((folder) => {
    it("Should parse to correct value when using parseFolder", async () => {
      const folderPath = path.join(testFilesPath, folder);
      const files = fs.readdirSync(folderPath);
      const geojsonFile = files.find((file) => file.endsWith(".geojson"));
      const geoJSON = JSON.parse(
        fs.readFileSync(
          path.join(
            folderPath,
            geojsonFile || ""
          ),
          "utf8"
        )
      );
      expect(await RNShpToGeoJSON.parseFolder(folderPath)).toEqual(geoJSON);
    });

    it("Should parse to correct value when using parseFile", async () => {
      const folderPath = path.join(testFilesPath, folder);
      const files = fs.readdirSync(folderPath);
      const geojsonFile = files.find((file) => file.endsWith(".geojson"));
      const shpFile = files.find((file) => file.endsWith(".shp"));
      const dbfFile = files.find((file) => file.endsWith(".dbf"));
      const geoJSON = JSON.parse(
        fs.readFileSync(
          path.join(
            folderPath,
            geojsonFile || ""
          ),
          "utf8"
        )
      );
      expect(await RNShpToGeoJSON.parseFiles(
        path.join(folderPath, shpFile || ""),
        path.join(folderPath, dbfFile || "")
      )).toEqual(geoJSON);
    });
});