import { useMemo } from "react";

import { deepSignal, DeepState } from "@deepsignal/core";
import "@preact/signals-react";

const useDeepSignal = <T extends DeepState>(initial: T | (() => T)) =>
  useMemo(
    () => deepSignal(typeof initial === "function" ? initial() : initial),
    []
  );

export { useDeepSignal, deepSignal };
