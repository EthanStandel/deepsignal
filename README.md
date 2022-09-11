# preact-signal-store

This library is meant to expand on Preact's new `Signal` primitive to make it a viable state management solution at the scale of a full
state management system by wrapping the built in primitive with a new `DeepSignal` model.

### Major v2.0 updates

This library was originally written with a much simpler `store` model. Version 2.0 aims to make the new `DeepSignal` model act far closer
to how `Signals` work under the hood. I hope this should make it more accessible to Preact developers already comfortable with the `Signal`
primitive.

## Why use `preact-signal-store`?

In a current Preact application you would be easily tempted to use a state management solution from the React ecosystem which relies
on the VDOM. If you use a library like this then then your application wide state updates could be causing full VDOM rerenders. Signals
provide us an escape from that on the scale of micro-state, but this library aims to scale that solution for larger applications.

## How it works

Very simply, the library just takes an arbitrary object of any scale or shape, and recursively turns all properties into signals. The objects
themselves each turn into a `DeepSignal` which contains a `value` getter & setter as well as a `peek` method just like regular `Signal`
instances. However, if you assign a new value to a `DeepSignal`, the setter method will recursively find every true `Signal` inside the object
and assign them to a new value. So if you subscribe to a `Signal` in a component, you can guarantee that it will be updated no matter what level
of the store gets reassigned.

So a simple example like this

```ts
import { deepSignal } from "preact-signal-store";

const userStore = deepSignal({
  name: {
    first: "Thor",
    last: "Odinson"
  },
  email: "thor@avengers.org"
});
```

...is equivalent to this code...

```ts
const userStore = {
  name: {
    first: signal("Thor"),
    last: signal("Odinson"),
    get value(): { first: string, last: string } {
      return {
        first: this.first.value,
        last: this.last.value
      }
    },
    set value(payload: { first: string, last: string }) {
      batch(() => {
        this.first.value = payload.first;
        this.last.value = payload.last;
      });
    },
    peek(): { first: string, last: string } {
      return {
        first: this.first.peek(),
        last: this.last.peek()
      }
    },
  },
  email: signal("thor@avengers.org"),
  get value(): { name: { first: string, last: string }, email: string } {
    return {
      name: {
        first: this.name.first.value,
        last: this.name.last.value
      },
      email: this.email.value
    }
  },
  set value(payload: { name: { first: string, last: string }, email: string }) {
    batch(() => {
      this.name.first.value = payload.name.first;
      this.name.last.value = payload.name.last;
      this.email.value = payload.email;
    });
  },
  peek(): { name: { first: string, last: string }, email: string } {
    return {
      name: {
        first: this.name.first.peek(),
        last: this.name.last.peek()
      },
      email: this.email.peek()
    }
  },
};
```

### Using `DeepSignal` in a local context

By utilizing `useDeepSignal` you can get a local state DX that's very similar to class components while continuing to have the
performance advantages of signals.

```tsx
import { useDeepSignal } from "preact-signal-store";

const UserRegistrationForm = () => {
  const user = useDeepSignal(() => ({
    name: {
      first: "",
      last: ""
    },
    email: ""
  }));

  const submitRegistration = (event) => {
    event.preventDefault();
    fetch(
      "/register",
      { method: "POST", body: JSON.stringify(user.peek()) }
    );
  }

  return (
    <form onSubmit={submitRegistration}>
      <label>
        First name
        <input value={user.name.first}
          onInput={e => user.name.first.value = e.currentTarget.value} />
      </label>
      <label>
        Last name
        <input value={user.name.last}
          onInput={e => user.name.last.value = e.currentTarget.value} />
      </label>
      <label>
        Email
        <input value={user.email}
          onInput={e => user.email.value = e.currentTarget.value} />
      </label>
      <button>Submit</button>
    </form>
  );
}
```

## Recipes

### Zustand style method actions

When I look to Zustand for the API it provides, it seems like a lot of their API (as much as I admire it) is based around supporting the
functional context. But the output of `preact-signal-store` is very openly dynamic and writing to it inside or outside of a component 
ends up being the same. So you can take Zustand's basic example...

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
import { deepSignal } from "preact-signal-store";

export const bearStore = {
  data: deepSignal({
    bears: 0
  }),
  increasePopulation() {
    this.data.bears.value++;
  },
  removeAllBears() {
    this.data.bears.value = 0
  }
};
```

### Storing and fetching from localStorage

Because the `value` getter on a `DeepSignal` effectively calls the `value` getter on each underlying `Signal`, calling the `DeepSignal`'s
getter will properly subscribe to each underlying signal. So if you wanted to manage the side effects of any level of a `DeepSignal` you
just need to call `effect` from `@preact/signals` and call `DeepSignal.value`

```ts
import { deepSignal } from "preact-signal-store";
import { effect } from "@preact/signals";

type UserStore = {
  name: {
    first: string;
    last: string;
  };
  email: string;
}

const getInitialUserStore = (): UserStore => {
  const storedUserStore = localStorage.get("USER_STORE_KEY");
  if (storedUserStore) {
    // you should probably validate this too 🤷‍♂️
    return JSON.parse(storedUserStore);
  } else {
    return {
      name: {
        first: "",
        last: ""
      },
      email: ""
    };
  }
}

const userStore = deepSignal(getInitialUserStore());

effect(() => localStorage.set("USER_STORE_KEY", JSON.stringify(userStore.value)));
```

This would also work for any level of the `DeepSignal`.

```ts
import { deepSignal } from "preact-signal-store";
import { effect } from "@preact/signals";

type UserNameStore = {
  first: string;
  last: string;
};

const getInitialUserNameStore = (): UserNameStore => {
  const storedUserStore = localStorage.get("USER_NAME_STORE_KEY");

  // you should probably validate this too 🤷‍♂️
  return storedUserStore ? JSON.parse(storedUserStore) : { first: "", last: "" },
}

const userStore = deepSignal({
  name: getInitialUserNameStore(),
  email: ""
});

effect(() => localStorage.set("USER_NAME_STORE_KEY", JSON.stringify(userStore.name.value)));
```

This should fulfill most needs for middleware or plugins. If this fails to meet your needs, please file an
issue and I will address the particular ask.

## TypeScript support

The API for `deepStore` and `useDeepStore` will handle dynamic typing for arbitrary input! It will also help you avoid a case like this

```ts
import { deepSignal } from "preact-signal-store";

const userStore = deepSignal({
  name: {
    first: "Thor",
    last: "Odinson"
  },
  email: "thor@avengers.org"
});

// TS error: Cannot assign to 'email' because it is a read-only property.
userStore.value.email = "another@email.com"
```