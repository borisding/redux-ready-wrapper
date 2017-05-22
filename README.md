## What is redux-ready-wrapper?
- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous action flow.
- If you already know how to use [`redux-thunk`](https://github.com/gaearon/redux-thunk), probably you already know how to use `redux-ready-wrapper`, as alternative.
- The differences are, `redux-ready-wrapper` will dispatch an extra action with `READY_ACTION` type and `options` object before dispatching next targeted action(s) and also, always return a `Promise` object for chaining.
- By having ready action and options provided, this allows us to control application's state based on the "ready" mode, before subsequent action is dispatched.

## Installation & Usage
- To install package:

```sh
npm install redux-ready-wrapper --save
```

- Example:

```js
import { createStore, applyMiddleware } from 'redux';
import readyWrapper, { ready } from 'redux-ready-wrapper'; // import this ready wrapper
import { createLogger } from 'redux-logger';
import rootReducer from './reducer';

const middlewares = [readyWrapper()]; // call this!

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger())
}

// created store
const store = createStore(rootReducer, applyMiddleware(...middlewares));

const type = 'SOMETHING';

// something action creator
const actionCreator = () => ({
  type,
  payload: { /* your stuff here...*/ }
});

// dispatch action from action creator
export function doSomething() {
  return ready(dispatch => dispatch(actionCreator()));
}

// do something else with dispatched action
// or throw error if it is not received
export function doSomethingElse(dispatchedAction) {
  if (dispatchedAction.type !== type) {
    throw new Error('No dispatched action received. Unable to proceed!');
  }

  console.log(`Yay! received dispatched action ${JSON.stringify(dispatchedAction)}`);
}

// then we can dispatch doSomething and
// proceed to the next function via promise, like so
store.dispatch(doSomething())
.then(action => doSomethingElse(action)) // show console log when invoked
.catch(error => alert(`Oops! ${error}`)); // alert thrown error message when it's failed
```
- Pass `options` to ready wrapper:

```js
// dispatch action from action creator with options provided
export function doSomething() {
  const options = {
    key1: 'value1',
    key2: 'value2'
  };

  return ready(dispatch => dispatch(actionCreator()), options);
}

// add a reducer say, `something` pure function
function something(state = {}, action) {
  if (action.type === 'READY_ACTION') {
    // manage your `action.options`

  } else if (action.type === 'SOMETHING') {
    // manage state for `SOMETHING`
  }
  
  return state;
}
```
## API
- `ready` function from `redux-ready-wrapper` accepts two arguments:

- i. `callback` (mandatory) - A callback function that will receive `dispatch` and `getState` functions from redux's `store` object.

- ii. `options` (optional) - An custom object literal to be passed as second parameter and will come together with dispatched ready action in this form: `{ type: 'READY_ACTION', options: { /* your options values */ } }`

## License
MIT
