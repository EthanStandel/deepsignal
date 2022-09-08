import { h } from "preact";
import { describe, it, expect } from "vitest";
import { store, destore, useStore } from "./store";
import { Signal } from "@preact/signals";
import { render, fireEvent } from "@testing-library/preact";

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

});

describe("destore", () => {

  it("destores deeply nested Signal<string>", () => {
    const testModel = destore(store({
      hello: {
        world: {
          foo: "bar"
        }
      }
    }));
    expect(testModel.hello.world.foo).toBe("bar");
  });

  it("loses initial function references", () => {
    const testModel = destore(store({
      hello: {
        world: () => ({
          foo: "bar"
        })
      }
    }));
    expect(testModel.hello.world.foo).toBe("bar");
  });

  it("destores deeply nested Signal<Array<any>>", () => {
    const testModel = destore(store({
      hello: {
        world: {
          foo: [1, 2, 3]
        }
      }
    }));
    expect(testModel.hello.world.foo[1]).toBe(2);
  });

  it("returns non-signal values", () => {
    const testModel = destore(
      {
        ...store({
        hello: {
          world: {
            foo: [1, 2, 3]
          }
        }
        }),
        baz: "qux"
      },
    );
    expect(testModel.baz).toBe("qux");
  });

  it("returns non-signal values", () => {
    const testModel = destore(
      {
        ...store({
        hello: {
          world: {
            foo: [1, 2, 3]
          }
        }
        }),
        baz: "qux"
      },
    );
    expect(testModel.baz).toBe("qux");
  });

  it("destore in a render will track by default", () => {
    let renderCount = 0;
    const testStore = store({ count: 0 });
    const Test = () => {
      const { count } = destore(testStore);
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {count}</div>
          <button onClick={() => testStore.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(4);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("destore in a render will peek if the peek option is passed as true", () => {
    let renderCount = 0;
    const testStore = store({ count: 0 });
    const Test = () => {
      const { count } = destore(testStore, { peek: true });
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {count}</div>
          <button onClick={() => testStore.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(1);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 0");
    page.unmount();
  });
});

describe("useStore", () => {
  it("can create a context-based store for a single render", () => {
    let renderCount = 0;
    const Test = () => {
      const state = useStore({ count: 0 });
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {state.count}</div>
          <button onClick={() => state.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(1);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });

  it("can create a context-based store for a single render based off a factory function", () => {
    let renderCount = 0;
    const Test = () => {
      const state = useStore(() => ({ count: 0 }));
      renderCount++;
      return (
        <>
          <div data-testid="count">Count is {state.count}</div>
          <button onClick={() => state.count.value++}>Increment</button>
        </> 
      )
    }
    const page = render(<Test />);
    const button = page.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(renderCount).toBe(1);
    expect(page.getByTestId("count").innerHTML).toBe("Count is 3");
    page.unmount();
  });
});