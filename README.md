# preact-signal-store

This library is meant to be the smallest possible solution for making Preact's signals scale into a fully fledged state management
option inspired by simple state management libraries like Zustand or Jotai.

## Why use `preact-signal-store`?

In a current Preact application you would be easily tempted to use a state management solution from the React ecosystem which relies
on the VDOM. If you use a library like this then then your application wide state updates could be causing full VDOM rerenders. Signals
provide us an escape from that on the scale of micro-state, but this 0.4KB library aims to scale that solution for larger applications.

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

### What if I need the actual value of my store?

You can use the handy `destore` function!

```ts
import { store, destore } from "preact-signal-store";

// appStore is of type { hello: { world: { foo: Signal<string> } } }
const appStore = store({
  hello: {
    world: {
      foo: "bar"
    }
  }
});

// appModel is of type { hello: { world: { foo: string } } }
const appModel = destore(appStore);
```

#### Warning: `destore` caveat!

The `destore` function should be considered a one-way trip, due to the possibility of the following example.

```ts
import { store, destore } from "preact-signal-store";

// initialAppModel is of type { hello: { world: () => { foo: string } } }
const initialAppModel = {
  hello: {
    world: () => ({
      foo: "bar"
    })
  }
}

// appStore is of type { hello: { world: Signal<{foo: string}> } }
const appStore = store(initialAppModel);

// destoredAppModel is of type { hello: { world: { foo: string } } }
const destoredAppModel = destore(appStore);

// appRestored is of type { hello: { world: { foo: Signal<string> } } }
const appRestored = store(destoredAppModel);
// DO NOT DO ^THIS
```

Notice how `destoredAppModel` is not the same type as `initialAppModel` and when it's put back into `store`, it produces a different type.
The difference is slight, but could lead to bad bugs that would be hard to trace down. It's a good idea in principal to base your store state
off of a single instance anyways.

### Can I use store in a local context?

You absolutely can, by utilizing `useStore` you can get a local state DX that's very similar to class components
while continuing to have the performance advantages of signals.

```tsx
import { useStore, destore } from "preact-signal-store";

const UserRegistrationForm = () => {
  const userStore = useStore(() => ({
    name: {
      first: "",
      last: ""
    },
    email: ""
  }));

  const submitRegistration = async () => {
    const user = destore(userStore);
    await fetch(
      "/register",
      { method: "POST", body: JSON.stringify(user) }
    );
  }

  return (
    <form onSubmit={submitRegistration}>
      <label>
        First name
        <input value={userStore.name.first} 
          onInput={e => userStore.name.first.value = e.currentTarget.value} />
      </label>
      <label>
        Last name
        <input value={userStore.name.last}
          onInput={e => userStore.name.last.value = e.currentTarget.value} />
      </label>
      <label>
        Email
        <input value={userStore.email}
          onInput={e => userStore.email.value = e.currentTarget.value} />
      </label>
      <button>Submit</button>
    </form>
  );
}
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
  increasePopulation: () => baseBearStore.bears.value++,
  removeAllBears: () => baseBearStore.bears.value = 0
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