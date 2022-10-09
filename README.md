# 📶 deepsignal

This repo is a collection of libraries that wrap Preact's Signal model to make it a full state management solution, alongside some other DX 
pattern niceties. This is a monorepo which mimics the patterns laid out by the [preactjs/signals repo](https://github.com/preactjs/signals).

## `@deepsignal/core`

The `core` package has all the base functionality and utilizes `@preact/signals-core`.

## `@deepsignal/preact`

The `preact` package adds a Preact specific hook and otherwise utilizes `@preact/signals` and exports key functionality from `@deepsignal/core`.

## `@deepsignal/react`

The `react` package adds a React specific hook and otherwise utilizes `@preact/signals-react` and exports key functionality from `@deepsignal/core`.
