## What is `redux-ready-wrapper`?
- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous actions.
- If you already know how to use [`redux-thunk`](https://github.com/gaearon/redux-thunk), probably you already know how to use `redux-ready-wrapper`, as alternative.
- The differences are, `redux-ready-wrapper` will dispatch an extra action with `READY_ACTION` type and `options` object before dispatching your actual action(s) and also, always return a `Promise` object for chaining.
- By having ready action and options provided, this allows you to control or do something at the "ready" mode (say, showing spinner before http request made) via your own ready reducer, before your actual action is dispatched.

## Installation and usage
(Coming soon...)

## License
MIT
