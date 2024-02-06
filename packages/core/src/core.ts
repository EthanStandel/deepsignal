import { signal, Signal, batch } from "@preact/signals-core";

export type AtomicState =
  | Array<unknown>
  | ((...args: unknown[]) => unknown)
  | string
  | boolean
  | number
  | bigint
  | symbol
  | undefined
  | null
  | Map<unknown, unknown>
  | Set<unknown>
  | Date;

export type DeepState = {
  [key: string]: (() => unknown) | AtomicState | DeepState;
};

export type ReadOnlyDeep<T> = {
  readonly [P in keyof T]: ReadOnlyDeep<T[P]>;
};

export interface DeepSignalAccessors<T extends DeepState> {
  value: ReadOnlyDeep<T>;
  readonly peek: () => ReadOnlyDeep<T>;
}

export type DeepSignalType<T extends DeepState> = DeepSignalAccessors<T> & {
  [K in keyof T]: T[K] extends AtomicState
    ? Signal<T[K]>
    : T[K] extends DeepState
    ? DeepSignalType<T[K]>
    : Signal<T[K]>;
};

export class DeepSignal<T extends DeepState> implements DeepSignalAccessors<T> {
  constructor(initialValue: unknown = {}) {
    Object.defineProperty(this, "value", {
      get(): ReadOnlyDeep<T> {
        return getValue(this as DeepSignalType<T>);
      },
      set(payload: ReadOnlyDeep<T>) {
        batch(() => setValue(this as DeepSignalType<T>, payload));
      },
      enumerable: false,
      configurable: false,
    });

    Object.defineProperty(this, "peek", {
      //@ts-expect-error
      value: () => getValue(this as DeepSignalType<T>, { peek: true }),
      writable: false,
      enumerable: false,
      configurable: false,
    });

    Object.defineProperty(this, "__INTERNAL_latestUpdatedStructurePayload", {
      value: new Signal(initialValue),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  value!: ReadOnlyDeep<T>;
  readonly peek!: () => ReadOnlyDeep<T>;
  readonly __INTERNAL_latestUpdatedStructurePayload!: Signal<T>;
}

const isAtomic = (value: any): value is AtomicState =>
  typeof value !== "object" ||
  value?.constructor === Date ||
  value?.constructor === Map ||
  value?.constructor === Set ||
  value === null ||
  Array.isArray(value);

const validateKey = (key: PropertyKey) => {
  if (
    ["value", "peek", "__INTERNAL_latestUpdatedStructurePayload"].some(
      iKey => iKey === key
    )
  ) {
    throw new Error(`${key as string} is a reserved property name`);
  }
};

export const deepSignal = <T extends DeepState>(
  initialValue: T
): DeepSignalType<T> =>
  Object.assign(
    new DeepSignal(initialValue),
    Object.entries(initialValue).reduce((acc, [key, value]) => {
      validateKey(key);
      if (isAtomic(value)) {
        acc[key] = signal(value);
      } else {
        acc[key] = deepSignal(value as DeepState);
      }
      return acc;
    }, {} as { [key: string]: unknown })
  ) as DeepSignalType<T>;

const setValue = <U extends DeepState, T extends DeepSignalType<U>>(
  deep: T,
  payload: U
): boolean => {
  let structureChanged = false;
  Object.keys(payload).forEach((key: keyof U) => {
    if (deep[key]) {
      if (deep[key] instanceof Signal) {
        deep[key].value = payload[key];
      } else {
        //@ts-ignore
        const nestedStructureChanged = setValue(deep[key], payload[key]);
        if (nestedStructureChanged) {
          structureChanged = true;
        }
      }
    } else {
      validateKey(key);
      // @ts-ignore
      deep[key] = isAtomic(payload[key])
        ? signal(payload[key])
        : // @ts-ignore
          deepSignal(payload[key]);
      structureChanged = true;
    }
  });
  Object.keys(deep).forEach(key => {
    if (!payload[key]) {
      //@ts-ignore
      deep[key].value = deep[key] instanceof DeepSignal ? {} : undefined;
      delete deep[key];
      structureChanged = true;
    }
  });
  if (structureChanged) {
    //@ts-ignore
    (deep as DeepSignal<U>).__INTERNAL_latestUpdatedStructurePayload.value =
      payload;
  }
  return structureChanged;
};

const getValue = <U extends DeepState, T extends DeepSignalType<U>>(
  deepSignal: T,
  { peek = false }: { peek?: boolean } = {}
): ReadOnlyDeep<U> => {
  if (!peek) {
    // calling the .value to track changes to the structure of this DeepSignal
    deepSignal.__INTERNAL_latestUpdatedStructurePayload.value;
  }
  return Object.entries(deepSignal).reduce((acc, [key, value]) => {
    if (value instanceof Signal) {
      acc[key] = peek ? value.peek() : value.value;
    } else if (value instanceof DeepSignal) {
      acc[key] = getValue(value as DeepSignalType<DeepState>, { peek });
    }
    return acc;
  }, {} as { [key: string]: unknown }) as ReadOnlyDeep<U>;
};
