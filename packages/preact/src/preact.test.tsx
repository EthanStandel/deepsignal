import { render, fireEvent } from "@testing-library/preact";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from "preact";
import { memo } from "preact/compat";
import { it, expect, describe } from "vitest";

import { deepSignal, useDeepSignal } from "./preact";

describe("@deepsignal/preact", () => {
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

  it("can render modified structures", () => {
    const deepSignalInstance = deepSignal({
      input: "",
      record: {} as Record<string, { name: string }>,
    });

    const Test = () => (
      <>
        <input
          value={deepSignalInstance.input}
          data-testid="add-new-item-input"
          data-value={deepSignalInstance.input}
          onInput={e =>
            (deepSignalInstance.input.value = e.currentTarget.value)
          }
        />
        <button
          data-testid="add-new-item-button"
          onClick={() => {
            deepSignalInstance.record.value = {
              ...deepSignalInstance.record.peek(),
              [deepSignalInstance.input.peek()]: {
                name: deepSignalInstance.input.peek(),
              },
            };
            deepSignalInstance.input.value = "";
          }}
        >
          Add new item
        </button>
        <ul>
          {Object.keys(deepSignalInstance.record.value).map(key => (
            <TestItem key={key} name={key} />
          ))}
        </ul>
      </>
    );

    let renderCount = -1;
    const TestItem = memo(({ name }: { name: string }) => {
      renderCount++;
      return (
        <li>
          <input
            data-testid={`${name}-name-input`}
            value={deepSignalInstance.record[name].name}
            onInput={e =>
              (deepSignalInstance.record[name].name.value =
                e.currentTarget.value)
            }
          />
          <span>{deepSignalInstance.record[name].name}</span>
        </li>
      );
    });

    const page = render(<Test />);
    const newItemInput = page.getByTestId("add-new-item-input");
    const addNewItemButton = page.getByTestId("add-new-item-button");
    fireEvent.input(newItemInput, { target: { value: "Foo" } });
    expect(page.queryByText("Foo")).toBeFalsy();
    fireEvent.click(addNewItemButton);
    expect(page.getByText("Foo")).toBeTruthy();
    expect(renderCount).toBe(0);
    const fooNameInput = page.getByTestId("Foo-name-input");
    fireEvent.input(fooNameInput, { target: { value: "Bar" } });
    expect(page.queryByText("Foo")).toBeFalsy();
    expect(page.getByText("Bar")).toBeTruthy();
    expect(renderCount).toBe(0);
    page.unmount();
  });
});
