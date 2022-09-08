import { describe, it, expect } from "vitest";
import { store } from "./store";
import { Signal } from "@preact/signals";

describe("store", () => {

  it("turns string properties into Signals", () => {
    const testStore = store({
      hello: "world"
    });
    expect(testStore.hello instanceof Signal).toBeTruthy();
  });

  it("turns deeply nested string properties into Signals", () => {
    const testStore = store({
      hello: {
        world: {
          foo: "bar"
        }
      }
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.hello.world.foo.value).toBe("bar"); 
  });

  it("turns deeply nested number properties into Signals", () => {
    const testStore = store({
      hello: {
        world: {
          foo: 123
        }
      }
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.hello.world.foo.value).toBe(123); 
  });

  it("turns deeply nested arrays into Signals", () => {
    const testStore = store({
      hello: {
        world: {
          foo: [1, 2, 3]
        }
      }
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.hello.world.foo.value[1]).toBe(2); 
  });

  it("turns functions into the signal of their ReturnType", () => {
    const testStore = store({
      hello: () => ({
        world: {
          foo: "bar"
        }
      })
    });
    expect(testStore.hello instanceof Signal).toBeTruthy();
    expect(testStore.hello.value.world.foo).toBe("bar"); 
  });

  it("turns nested functions into the signal of a function", () => {
    const testStore = store({
      hello: () => () => ({
        world: {
          foo: "bar"
        }
      })
    });
    expect(testStore.hello instanceof Signal).toBeTruthy();
    expect(typeof testStore.hello.value).toBe("function");
    expect(testStore.hello.value().world.foo).toBe("bar"); 
  });

})