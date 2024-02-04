import { deepSignal, DeepState } from "@deepsignal/core";
import { useMemo } from "preact/hooks";
import "@preact/signals";

export const useDeepSignal = <T extends DeepState>(initial: T | (() => T)) =>
  useMemo(
    () => deepSignal(typeof initial === "function" ? initial() : initial),
    []
  );

export * from "@deepsignal/core";
