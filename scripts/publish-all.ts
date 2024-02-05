import "zx/globals";

import { version as coreVersion } from "../packages/core/package.json";
import { version as preactVersion } from "../packages/preact/package.json";
import { version as reactVersion } from "../packages/react/package.json";

const main = async () => {
  const publish = async (
    version: string,
    workspace: "core" | "preact" | "react"
  ) => {
    const tag = version.split("-").slice(1).join("-").split(".")[0];
    await $`npm publish --workspace=@deepsignal/${workspace} ${
      tag ? ["--tag", tag] : ""
    }`;
  };

  await publish(coreVersion, "core");
  await publish(preactVersion, "preact");
  await publish(reactVersion, "react");
};

main();
