import { signal, Signal } from "@preact/signals";
import { useMemo,  } from "preact/hooks";

export type Signalable = Array<any> | string | boolean | number | bigint | symbol | undefined | null;

export type Storeable = {
  [key: string]: (() => any) | Signalable | Storeable
};

export type Store = {
  [key: string]: Signal<any> | Signalable | ((...arg: any[]) => any) | Store;
};

export type Signalify<T extends Storeable> = {
  [K in keyof T]: 
    T[K] extends () => any ? Signal<ReturnType<T[K]>> :
    T[K] extends (...args: any) => any ? never :
    T[K] extends Storeable ? Signalify<T[K]> :
    Signal<T[K]>
};

export type Designaled<T extends Store> = {
  [K in keyof T]:
    T[K] extends Signal<any> ? T[K]["value"] :
    T[K] extends Store ? Designaled<T[K]> :
    T[K];
}

export const store = <T extends Storeable> (input: T) => 
  Object.entries(input).reduce((
    acc,
    [key, value]
  ) => {
    if (typeof value === "function") {
      acc[key] = signal(value())
    } else if (typeof value !== "object" || value === null || Array.isArray(value)) {
      acc[key] = signal(value);
    } else {
      acc[key] = store(value);
    }
    return acc;
  }, {} as { [key: string]: unknown }) as Signalify<T>;

export const destore = <T extends Store> (store: T, { peek = false }: { peek?: boolean } = {}): Designaled<T> =>
  Object.entries(store).reduce((
    acc,
    [key, value]
  ) => {
    if (value instanceof Signal) {
      acc[key] = peek ? value.peek() : value.value;
    } else if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      acc[key] = destore(value, { peek });
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as { [key: string]: unknown }) as Designaled<T>;

export const useStore = <T extends Storeable> (input: T | (() => T)) => 
  useMemo(() => store(typeof input === "function" ? input() : input), []);