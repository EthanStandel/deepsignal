import "zx/globals";
import { writeFileSync, readFileSync } from "node:fs";

import { version } from "../packages/core/package.json";

const main = async () => {
  await $`git stash`;
  const newVersion = (
    await $`npx semver ${version} ${process.argv.slice(2)}`
  ).stdout.split("\n")[0];

  const updatePackage = (source: string) => {
    const packageJson = JSON.parse(readFileSync(source, "utf-8"));
    packageJson.version = newVersion;
    if (packageJson?.dependencies?.["@deepsignal/core"]) {
      packageJson.dependencies["@deepsignal/core"] = newVersion;
    }
    writeFileSync(source, JSON.stringify(packageJson, null, 2));
  };

  updatePackage("./packages/core/package.json");
  updatePackage("./packages/preact/package.json");
  updatePackage("./packages/react/package.json");

  await $`npm i`;
  await $`npx eslint`;
  await $`git add --all`;
  await $`git stash pop`;
};

main();
