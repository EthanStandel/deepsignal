import { signal, Signal } from "@preact/signals";

export type Storeable = {
  [key: string]: (() => any) | Array<any> | string | boolean | number | bigint | symbol | undefined | null | Storeable
};

export type Signalify<T extends Storeable> = {
  [K in keyof T]: 
    T[K] extends () => any ? Signal<ReturnType<T[K]>> :
    T[K] extends (...args: any) => any ? never :
    T[K] extends Storeable ? Signalify<T[K]> :
    Signal<T[K]>
};

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
