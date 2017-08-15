## What is redux-ready-wrapper?
[![npm version](https://img.shields.io/npm/v/redux-ready-wrapper.svg?style=flat-square)](https://www.npmjs.com/package/redux-ready-wrapper)
[![build status](https://img.shields.io/travis/borisding/redux-ready-wrapper/master.svg?style=flat-square)](https://travis-ci.org/borisding/redux-ready-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/redux-ready-wrapper.svg?style=flat-square)](https://www.npmjs.com/package/redux-ready-wrapper)

- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous action flow.
- If you are familiar with [`redux-thunk`](https://github.com/gaearon/redux-thunk), you probably already know how to use `redux-ready-wrapper`, as alternative.
- This middleware allows us to return a higher-order function (`ready` / `wrap`) of "thunk" in action creator instead of an action, by accepting a callback function as argument.

## API
a) `ready` - function which accepts two arguments and returns "thunk" function that eventually returns a Promise:

- `callback` (mandatory) - A callback function that will receive `dispatch` and `getState` methods from redux's `store` object.

- `options` (optional, default: {}) - A user defined options to be passed as second argument and assigned to ready action (the object), in this form:

```js
{
  type: 'READY_ACTION',
  options: /* your options values */
}
```

> Once `ready` is invoked, it will dispatch additional ready action BEFORE dispatching the next targeted action in callback. It could be useful if you plan to have a generic reducer for some controls with provided options during the "ready" phase.

b) `wrap` - function which is similar to `ready`, except it only accepts one callback argument _without_ dispatching ready action:

  - `callback` (mandatory) - A callback function that will receive `dispatch` and `getState` methods from redux's `store` object.

> Using `wrap` instead of `ready` if you just need asynchronous handling without having ready action to be dispatched.

## Installation
- To install package:

```sh
npm install redux-ready-wrapper --save
```

- import and apply middleware:

```js
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import readyWrapper from 'redux-ready-wrapper'; // <--- import this
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

## Usage

- Example 1:

```js
import { wrap } from 'redux-ready-wrapper'; // <--- import `wrap` and/or `ready`
import { SOMETHING, SOMETHING_NEW } from './constants';

// return `wrap` function instead
// so that we can implement promise chaining
export function doSomething() {
  return wrap(dispatch => dispatch({
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

> Note: You may not need to return the wrapper in all action creators. It should only be used based on the context.

## License
MIT
