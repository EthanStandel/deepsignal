import { execSync } from "node:child_process";

import { version as coreVersion } from "../packages/core/package.json";
import { version as preactVersion } from "../packages/preact/package.json";
import { version as reactVersion } from "../packages/react/package.json";

const tags = {
  core: coreVersion.split("-").slice(1).join("-").split(".")[0],
  preact: preactVersion.split("-").slice(1).join("-").split(".")[0],
  react: reactVersion.split("-").slice(1).join("-").split(".")[0],
};

execSync(
  `npm publish --workspace=@deepsignal/core ${
    tags.core ? `--tag ${tags.core}` : ""
  }`
);
execSync(
  `npm publish --workspace=@deepsignal/preact ${
    tags.preact ? `--tag ${tags.preact}` : ""
  }`
);
execSync(
  `npm publish --workspace=@deepsignal/react ${
    tags.react ? `--tag ${tags.react}` : ""
  }`
);
