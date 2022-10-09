import { render, fireEvent } from "@testing-library/react";
import { it, expect, describe } from "vitest";

import { deepSignal, useDeepSignal } from "./react";

describe("deepSignal", () => {
  it("rerenders if inner Signal is updated but the DeepSignal is subscribed to", () => {
    let renderCount = -1;
    const deepSignalInstance = deepSignal({ inner: { count: 0 } });
    const Test = () => {
      renderCount++;
      return (
        <>
          <div data-testid="count">
            Count is {deepSignalInstance.value.inner.count}
          </div>
          <button onClick={() => deepSignalInstance.inner.count.value++}>
            Increment
          </button>
        </>
      );
    };
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
          <div data-testid="count">
            Count is {deepSignalInstance.inner.count.value}
          </div>
          <button
            onClick={() =>
              (deepSignalInstance.value = {
                inner: { count: deepSignalInstance.inner.count.peek() + 1 },
              })
            }
          >
            Increment
          </button>
        </>
      );
    };
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
          <div data-testid="count">
            Count is {deepSignalInstance.value.inner.count}
          </div>
          <button onClick={() => deepSignalInstance.inner.count.value++}>
            Increment
          </button>
        </>
      );
    };
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
          <div data-testid="count">
            Count is {deepSignalInstance.inner.count.value}
          </div>
          <button
            onClick={() =>
              (deepSignalInstance.value = {
                inner: { count: deepSignalInstance.inner.count.peek() + 1 },
              })
            }
          >
            Increment
          </button>
        </>
      );
    };
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
    expect(() => deepSignal({ value: "hello" })).toThrowError(
      /reserved property name/
    );

    expect(() => deepSignal({ peek: "hello" })).toThrowError(
      /reserved property name/
    );
  });
});
