#!/usr/bin/env node

const main = async () => {
const currentVersion = require("../package.json").version;

const isReleaseCandidate = process.argv.includes("--release-candidate") || process.argv.includes("-rc");

if (isReleaseCandidate) {
  console.log("Release candidate mode");
} else {
  console.log("Normal mode");
}


let versionParts = currentVersion.split(".")
let versionRC = 0;
let lastVersionIsRC = false;
if (versionParts[2].includes("-")) {
  versionRC = Number(versionParts[2].split("-rc")[1]);
  versionParts[2] = versionParts[2].split("-")[0];
  lastVersionIsRC = true;
}

versionParts = versionParts.map(Number);

console.error("Usage: version-up [--release-candidate(-rc)]");

let newPatch = versionParts[2] + 1;
if (isReleaseCandidate) {
  if (lastVersionIsRC) {
    newPatch = versionParts[2];
  } else {
    newPatch = versionParts[2] + 1;
  }
} else if (lastVersionIsRC) {
  newPatch = versionParts[2];
}
const newVersionRC = isReleaseCandidate ? `-rc${versionRC + 1}` : "";

const newVersion = `${versionParts[0]}.${versionParts[1]}.${newPatch}${newVersionRC}`;

console.log(`Current version: ${currentVersion}`);
console.log(`New version: ${newVersion}`);

const inquirer = require("inquirer");
//prompt user to confirm the new version
const confirm = await inquirer.prompt([
  {
    type: "confirm",
    name: "confirm",
    message: `Are you sure you want to update the version to ${newVersion}?`,
  },
]);

if (!confirm.confirm) {
  console.log("Version update cancelled");
  process.exit(0);
}

//update the version in the package.json files
const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "../package.json");

fs.writeFileSync(packageJsonPath, JSON.stringify({
  ...JSON.parse(fs.readFileSync(packageJsonPath, "utf8")),
  version: newVersion,
}, null, 2)
);

  console.log(`Version updated to ${newVersion}`);
};

main();
