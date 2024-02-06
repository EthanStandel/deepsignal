import { Signal } from "@preact/signals-core";
import { describe, it, expect } from "vitest";

import { deepSignal, DeepSignal } from "./core";

describe("@deepsignal/core", () => {
  it("turns string properties into Signals", () => {
    const testStore = deepSignal({
      hello: "world",
    });
    expect(new DeepSignal() instanceof DeepSignal).toBeTruthy();
    expect(testStore instanceof DeepSignal).toBeTruthy();
    expect(testStore.hello instanceof Signal).toBeTruthy();
    expect(testStore.value.hello).toBe("world");
  });

  it("turns string properties into Signals", () => {
    const testStore = deepSignal({
      hello: "world",
    });
    expect(new DeepSignal() instanceof DeepSignal).toBeTruthy();
    expect(testStore instanceof DeepSignal).toBeTruthy();
    expect(testStore.hello instanceof Signal).toBeTruthy();
    expect(testStore.value.hello).toBe("world");
  });

  it("turns deeply nested atomic properties into Signals with peek and value", () => {
    const testStore = deepSignal({
      hello: {
        world: {
          foo: "bar" as number | string | Array<number>,
        },
      },
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.value.hello.world.foo).toBe("bar");
    expect(testStore.hello.value.world.foo).toBe("bar");
    expect(testStore.hello.world.value.foo).toBe("bar");
    expect(testStore.hello.world.foo.value).toBe("bar");
    testStore.value = { hello: { world: { foo: 123 } } };
    expect(testStore.peek().hello.world.foo).toBe(123);
    expect(testStore.hello.peek().world.foo).toBe(123);
    expect(testStore.hello.world.peek().foo).toBe(123);
    expect(testStore.hello.world.foo.peek()).toBe(123);
  });

  it("turns deeply nested arrays into Signals  with peek and value", () => {
    const testStore = deepSignal({
      hello: {
        world: {
          foo: [1, 2, 3],
        },
      },
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.value.hello.world.foo[0]).toBe(1);
    expect(testStore.hello.value.world.foo[0]).toBe(1);
    expect(testStore.hello.world.value.foo[0]).toBe(1);
    expect(testStore.hello.world.foo.value[0]).toBe(1);
    testStore.value = { hello: { world: { foo: [3, 2, 1] } } };
    expect(testStore.peek().hello.world.foo[0]).toBe(3);
    expect(testStore.hello.peek().world.foo[0]).toBe(3);
    expect(testStore.hello.world.peek().foo[0]).toBe(3);
    expect(testStore.hello.world.foo.peek()[0]).toBe(3);
  });

  it("allows for structural modifications of deepSignals", () => {
    const testStore = deepSignal({
      record: {} as Record<string, { name: string }>,
    });
    testStore.record.value = { foo: { name: "Foo" } };
    expect(testStore.record.foo instanceof DeepSignal).toBeTruthy();
    expect(testStore.record.foo.name instanceof Signal).toBeTruthy();
  });

  it("naturally treats Map, Set, & Date as atomic", () => {
    const testStore = deepSignal({
      map: new Map(),
      set: new Set(),
      date: new Date(),
    });
    expect(testStore.map instanceof Signal).toBeTruthy();
    expect(testStore.set instanceof Signal).toBeTruthy();
    expect(testStore.date instanceof Signal).toBeTruthy();
  });

  it("doesn't allow you to set a property with keys named peek or value", () => {
    expect(() => deepSignal({ value: "hello" })).toThrowError(
      /reserved property name/
    );
    expect(() => deepSignal({ peek: "hello" })).toThrowError(
      /reserved property name/
    );
  });

  it("will only update the __INTERNAL_latestUpdatedStructurePayload property if the structure is modified", () => {
    const testStore = deepSignal({
      record: {
        hello: "world",
      } as Record<string, string>,
    });
    testStore.record.hello.value = "foo";
    expect(testStore.record.hello.peek()).toBe("foo");
    // structure hasn't changed so __INTERNAL_latestUpdatedStructurePayload
    // will remain it's original value
    expect(
      //@ts-ignore
      testStore.__INTERNAL_latestUpdatedStructurePayload.peek().record.hello
    ).toBe("world");
    testStore.value = {
      record: {
        ...testStore.peek().record,
        bar: "baz",
      },
    };
    // structure has now changed so __INTERNAL_latestUpdatedStructurePayload
    // will be updated to latest value
    expect(
      //@ts-ignore
      testStore.__INTERNAL_latestUpdatedStructurePayload.peek().record.hello
    ).toBe("foo");

    expect("hello" in testStore.record).toBeTruthy();
    expect("hello" in testStore.record.peek()).toBeTruthy();

    testStore.value = {
      record: {
        bar: "qux",
      },
    };

    expect("hello" in testStore.record).toBeFalsy();
    expect("hello" in testStore.record.peek()).toBeFalsy();
  });

  it("supports nested deletions", () => {
    const testStore = deepSignal({
      record: {
        foo: { name: "Foo" },
        bar: { name: "Bar" },
        baz: { name: "Baz" },
      } as Record<string, { name: string }>,
    });

    const updatedPayload = { ...testStore.record.peek() };
    delete updatedPayload.bar;

    expect(testStore.record.bar).toBeDefined();

    testStore.record.value = updatedPayload;

    expect(testStore.record.bar).toBeUndefined();
  });
});
