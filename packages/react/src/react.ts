import { useMemo } from "react";

import { deepSignal, DeepState } from "@deepsignal/core";
import "@preact/signals-react";

export const useDeepSignal = <T extends DeepState>(initial: T | (() => T)) =>
  useMemo(
    () => deepSignal(typeof initial === "function" ? initial() : initial),
    []
  );

export * from "@deepsignal/core";
