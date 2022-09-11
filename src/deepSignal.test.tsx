import { h } from "preact";
import { describe, it, expect } from "vitest";
import { deepSignal, useDeepSignal } from "./deepSignal";
import { effect, Signal } from "@preact/signals";
import { render, fireEvent } from "@testing-library/preact";

describe("deepSignal", () => {

  it("turns string properties into Signals", () => {
    const testStore = deepSignal({
      hello: "world"
    });
    expect(testStore.hello instanceof Signal).toBeTruthy();
    expect(testStore.value.hello).toBe("world");
  });

  it("turns deeply nested atomic properties into Signals with peek and value", () => {
    const testStore = deepSignal({
      hello: {
        world: {
          foo: "bar" as number | string | Array<number>
        }
      }
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.value.hello.world.foo).toBe("bar");
    expect(testStore.hello.value.world.foo).toBe("bar");
    expect(testStore.hello.world.value.foo).toBe("bar");
    expect(testStore.hello.world.foo.value).toBe("bar"); 
    testStore.value = { hello: { world: { foo: 123 }} };
    expect(testStore.peek().hello.world.foo).toBe(123);
    expect(testStore.hello.peek().world.foo).toBe(123);
    expect(testStore.hello.world.peek().foo).toBe(123);
    expect(testStore.hello.world.foo.peek()).toBe(123); 
  });

  it("turns deeply nested arrays into Signals  with peek and value", () => {
    const testStore = deepSignal({
      hello: {
        world: {
          foo: [1, 2, 3]
        }
      }
    });
    expect(testStore.hello.world.foo instanceof Signal).toBeTruthy();
    expect(testStore.value.hello.world.foo[0]).toBe(1);
    expect(testStore.hello.value.world.foo[0]).toBe(1);
    expect(testStore.hello.world.value.foo[0]).toBe(1);
    expect(testStore.hello.world.foo.value[0]).toBe(1); 
    testStore.value = { hello: { world: { foo: [3, 2, 1] }} };
    expect(testStore.peek().hello.world.foo[0]).toBe(3);
    expect(testStore.hello.peek().world.foo[0]).toBe(3);
    expect(testStore.hello.world.peek().foo[0]).toBe(3);
    expect(testStore.hello.world.foo.peek()[0]).toBe(3); 
  });

  it("rerenders if inner Signal is updated but the DeepSignal is subscribed to", () => {
    let renderCount = -1;
    const deepSignalInstance = deepSignal({ inner: { count: 0 } });
    const Test = () => {
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {deepSignalInstance.value.inner.count}</div>
          <button onClick={() => deepSignalInstance.inner.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(3);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("rerenders if DeepSignal is updated but the inner Signal is subscribed to", () => {
    let renderCount = -1;
    const deepSignalInstance = deepSignal({ inner: { count: 0 } });
    const Test = () => {
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {deepSignalInstance.inner.count.value}</div>
          <button onClick={() => deepSignalInstance.value = { inner: { count: deepSignalInstance.inner.count.peek() + 1 } }}>
            Increment
          </button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(3);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("can be used in a local-only context", () => {
    let renderCount = -1;
    const Test = () => {
      const deepSignalInstance = useDeepSignal({ inner: { count: 0 } });
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {deepSignalInstance.value.inner.count}</div>
          <button onClick={() => deepSignalInstance.inner.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(3);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("can be used in a local-only context using functional setter", () => {
    let renderCount = -1;
    const Test = () => {
      const deepSignalInstance = useDeepSignal(() => ({ inner: { count: 0 } }));
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {deepSignalInstance.inner.count.value}</div>
          <button onClick={() => deepSignalInstance.value = { inner: { count: deepSignalInstance.inner.count.peek() + 1 } }}>
            Increment
          </button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(3);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("doesn't allow you to set a property with keys named peek or value", () => {
    expect(() => deepSignal({ value: "hello" })).toThrowError(/reserved property name/);
    expect(() => deepSignal({ peek: "hello" })).toThrowError(/reserved property name/);
  });

});