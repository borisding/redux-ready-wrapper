## What is redux-ready-wrapper?
[![npm version](https://img.shields.io/npm/v/redux-ready-wrapper.svg?style=flat)](https://www.npmjs.com/package/redux-ready-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/redux-ready-wrapper.svg?style=flat)](https://www.npmjs.com/package/redux-ready-wrapper)

- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous action flow.
- If you are familiar with [`redux-thunk`](https://github.com/gaearon/redux-thunk), you probably already know how to use `redux-ready-wrapper`, as alternative.
- The differences are, `redux-ready-wrapper` will dispatch an extra action with `READY_ACTION` type and `options` *before* dispatching next targeted action. Also, it returns a `Promise` object from the `ready` function for chaining.
- By having ready action and options provided, this allows us to control application's state based on the "ready" mode, before subsequent action is dispatched.

## Installation & Usage
- To install package:

```sh
npm install redux-ready-wrapper --save
```

- import and apply middleware:

```js
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import readyWrapper from 'redux-ready-wrapper'; // import this
import rootReducer from './reducer';

// add middleware by calling it!
const middlewares = [readyWrapper()];

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger());
}

export default createStore(
  rootReducer,
  applyMiddleware(...middlewares)
);
```

- Example 1:

```js
import { ready } from 'redux-ready-wrapper'; // import `ready`
import { SOMETHING, SOMETHING_NEW } from './constants';

// return `ready` function instead
// so that we can implement promise chaining
export function doSomething() {
  return ready(dispatch => dispatch({
    type: SOMETHING,
    payload: {
      key1: 'value1',
      key2: 'value2'
    }
  }));
}

// extend received action (the source) and return it as new action
export function extendSomething(action = {}) {
  const payload = { ...action.payload, key2: 'new value 2', key3: 'value 3' };
  const newAction = { ...action, type: SOMETHING_NEW, payload };

  return newAction;
}

// do something else with newly extended action or,
// throw error if it is invalid.
export function doSomethingElse(action = {}) {
  if (action.type !== SOMETHING_NEW) {
    throw new Error('Invalid new action received!');
  }

  console.log(`Yay! new action received:  ${JSON.stringify(action)}`);

  return action;
}


// assumed `store` object is available:
const { dispatch } = store;

dispatch(doSomething())
.then(dispatched => extendSomething(dispatched)) // extend dispatched action from `doSomething`
.then(extended => dispatch(doSomethingElse(extended))) // passing extended action to `doSomethingElse` and dispatch
.catch(error => alert(`Oops! ${error}`)); // alert thrown error message if invalid action
```
- Provide `options` as second argument to `ready` function and deal with reducers, eg:

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
export function something(state = {}, action) {
  if (action.type === 'READY_ACTION') {
    // manage state change and `action.options`

  } else if (action.type === 'SOMETHING') {
    // manage state change for `SOMETHING`
  }

  return state;
}

// or, we may want to add a `isFetching` reducer
// based on the ready action and options
export function isFetching(state = false, action) {
  state = action.type === 'READY_ACTION';

  // if ready action, and `isFetching` option is defined
  // then final state change is based on the defined `isFetching`
  if (state && typeof action.options.isFetching !== 'undefined') {
    state = action.options.isFetching === true;
  }

  return state;
}

// then in root reducer
const rootReducer = combineReducers({
    ...
    isFetching
    ...
});
```
- Example 2 (React-Redux):

```js
// filename: userActions.js

import { ready } from 'redux-ready-wrapper';
import { LOGIN_NOTIFICATION } from './constants';

// dispatch user login notification
// message could be handled in your middleware
export function showLoginNotification(message) {
  return {
    type: LOGIN_NOTIFICATION,
    message
  };
}

// user login action
export function userLogin(formData) {
  return ready(dispatch => (
    fetch('/login', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(user => {
      if (!user.id) throw new Error('Login failure. Please try again!');
      return dispatch(showLoginNotification('You have logged in!'));
    })
    .catch(error => dispatch(showLoginNotification(error)))
  ));
}

// proceed to the next action after user logged in
export function doNextAfterLoggedIn() {
  return ready((dispatch, getState) => {
    const current = getState();
    ...
  });
}
```

```js
// filename: User.js
// User react component that has `handleSubmit` method
// and with bound user actions in `mapDispatchToProps`

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as userActions from './userActions';

class User extends Component {
  ...

  // say, invoked through `onSubmit` via user login form
  // and proceed to next once logged in successfully
  handleSubmit(evt) {
    evt.preventDefault();
    const { userLogin, doNextAfterLoggedIn } = this.props.actions;
    const formData = ...;

    // note that promise here is from `fetch`
    userLogin(formData)
    .then(() => doNextAfterLoggedIn());
  }

  ...
}

const mapStateToProps = ...;
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(userActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(User);
```

## API
- `ready` function from `redux-ready-wrapper` that accepts two arguments:

- i. `callback` (mandatory) - A callback function that will receive `dispatch` and `getState` methods from redux's `store` object.

- ii. `options` (optional, default: {}) - A user defined options to be passed as second argument and will come together with dispatched ready action, in this form:

```js
{
  type: 'READY_ACTION',
  options: /* your options values */
}
```

## License
MIT
