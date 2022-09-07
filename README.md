# preact-signal-store

This library is meant to be the smallest possible solution for making Preact's signals scale into a fully fledged state management
option inspired by simple state management libraries like Zustand or Jotai.

## Why use `preact-signal-store`?

In a current Preact application you would be easily tempted to use a state management solution from the React ecosystem which relies
on the VDOM. If you use a library like this then then your application wide state updates could be causing full VDOM rerenders. Signals
provide us an escape from that on the scale of micro-state, but this 0.25KB library aims to scale that solution for larger applications.

## How does it work?

### General

Very simply, the library just takes an arbitrary object of any scale or shape, and recursively turns all properties into signals. That
is to say that this code...

```ts
import { store } from "preact-signal-store";

const appStore = store({
  hello: {
    world: {
      foo: "bar"
    }
  }
});
```

...is equivalent to this code...

```ts
import { signal } from "@preact/signals";

const appStore = store({
  hello: {
    world: {
      foo: signal("bar")
    }
  }
});
```

Simple right? `preact-signal-store` will turn any inner property that is of type 
`Array<any> | string | boolean | number | bigint | symbol | undefined | null` into a `Signal`. If a property is an object then the `store`
function recurses, and that object becomes a store for more internal signals.

### But what if I want a signal that _is_ an object?

If you want to ensure that something becomes a `Signal`, then you just need to wrap it in a no-args function. So this code...

```ts
import { store } from "preact-signal-store";

const appStore = store({
  hello: {
    world: () => ({
      foo: "bar"
    })
  }
});
```

...is equivalent to this code...

```ts
import { signal } from "@preact/signals";

const appStore = store({
  hello: {
    world: signal({
      foo: "bar"
    })
  }
});
```

### But then what if I want a signal that's a function?

You just make a function that returns a function. That code isn't recursive. This is the same solution for if you wanted a `useState`
value as a function. So this code...

```ts
import { store } from "preact-signal-store";

const appStore = store({
  hello: {
    world: () => () => ({
      foo: "bar"
    })
  }
});
```

...is equivalent to this code...

```ts
import { signal } from "@preact/signals";

const appStore = store({
  hello: {
    world: signal(() => ({
      foo: "bar"
    }))
  }
});
```

### So is that it?

Yeah basically. When I look to Zustand for the API it provides, it seems like a lot of their API (as much as I admire it) is based around 
supporting the functional context.

But the output of `preact-signal-store` is a very simple object, with no magic attached. There's nothing stopping you from deconstructing
properties or resorting the object. So if you wanted to, you could take Zustand's basic example...

```ts
import create from "zustand";

export const useBearStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

...and create an effectively equivalent version with `preact-signal-store` like this...

```ts
import { store } from "preact-signal-store";

const baseBearStore = store({
  bears: 0
});

export const bearStore = {
  ...baseBearStore,
  increasePopulation: () => baseBearStore.bears++,
  removeAllBears: () => baseBearStore.bears = 0
};
```

### Is it type safe?

Yup! TypeScript will properly determine the output type of store without you having to add any extra typing. And it'll determine the things
you're not allowed to pass into the `store` function, e.g. ...

```ts
import { store } from "preact-signal-store";

const appStore = store({
  hello: {
    world: (foo: string) => ({ bar: foo })
    // typescript error ^here
    // you need to wrap this function in another function
  }
});
```