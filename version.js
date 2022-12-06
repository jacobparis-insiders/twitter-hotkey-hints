import fs from "fs"
import semver from "semver"

if (fs.existsSync("./manifest.json") && fs.existsSync("./package.json")) {
  const manifestJson = JSON.parse(fs.readFileSync("./manifest.json"))
  const packageJson = JSON.parse(fs.readFileSync("./package.json"))
  const currentVersion = manifestJson.version

  const newVersion = semver.inc(manifestJson.version, "patch")
  manifestJson.version = newVersion
  packageJson.version = newVersion
  fs.writeFileSync("./manifest.json", JSON.stringify(manifestJson, null, 2))
  fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2))

  console.log("Version updated", currentVersion, "=>", newVersion)
}
