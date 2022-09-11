import { signal, Signal, batch } from "@preact/signals";
import { useMemo } from "preact/hooks";

type Signalable = Array<any> | ((...args: any[]) => any) | string | boolean | number | bigint | symbol | undefined | null;

type Storeable = {
  [key: string]: (() => any) | Signalable | Storeable
};

type Store = {
  [key: string]: Signal<any> | Signalable | ((...arg: any[]) => any) | Store;
};

export interface IDeepSignal<T extends Storeable> { value: T, peek: () => T };

export type DeepSignal<T extends Storeable> = IDeepSignal<T> & {
  [K in keyof T]: 
    T[K] extends Signalable ? Signal<T[K]> :
    T[K] extends Storeable ? DeepSignal<T[K]> :
    Signal<T[K]>;
};

class DeepSignalImpl<T extends Storeable> implements IDeepSignal<T> {
  get value(): T {
    return getValue(this as DeepSignal<T>);
  }

  set value(payload: T) {
    batch(() => setValue(this as DeepSignal<T>, payload));
  }

  peek(): T {
    return getValue(this as DeepSignal<T>, { peek: true });
  }
}

export const deepSignal = <T extends Storeable> (initialValue: T): DeepSignal<T> => 
  Object.assign(
    new DeepSignalImpl(),
    Object.entries(initialValue).reduce(
      (acc, [key, value]) => {
      if (["value", "peek"].some(iKey => iKey === key)) {
        throw new Error(`${key} is a reserved property name`);
      } else if (typeof value !== "object" || value === null || Array.isArray(value)) {
        acc[key] = signal(value);
      } else {
        acc[key] = deepSignal(value);
      }
      return acc;
    }, {} as { [key: string]: unknown })
  ) as DeepSignal<T>;

const setValue = <U extends Storeable, T extends DeepSignal<U>> (
  deepSignal: T,
  payload: U
): void =>
  Object.keys(payload).forEach((key: keyof U) => 
    deepSignal[key].value = payload[key]
  );

const getValue = <U extends Storeable, T extends DeepSignal<U>> (
  deepSignal: T,
  { peek = false }: { peek?: boolean } = {}
): U =>
  Object.entries(deepSignal).reduce((
    acc,
    [key, value]
  ) => {
    if (value instanceof Signal) {
      acc[key] = peek ? value.peek() : value.value;
    } else if (value instanceof DeepSignalImpl) {
      acc[key] = getValue(value, { peek });
    }
    return acc;
  }, {} as { [key: string]: unknown }) as U;

export const useDeepSignal = <T extends Storeable> (initial: T | (() => T)) => 
  useMemo(() => deepSignal(typeof initial === "function" ? initial() : initial), []);
