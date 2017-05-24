## What is redux-ready-wrapper?
[![npm version](https://img.shields.io/npm/v/redux-ready-wrapper.svg?style=flat)](https://www.npmjs.com/package/redux-ready-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/redux-ready-wrapper.svg?style=flat)](https://www.npmjs.com/package/redux-ready-wrapper)

- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous action flow.
- If you are familiar with [`redux-thunk`](https://github.com/gaearon/redux-thunk), you probably already know how to use `redux-ready-wrapper`, as alternative.
- The differences are, `redux-ready-wrapper` will dispatch an extra action with `READY_ACTION` type and `options` object *before* dispatching next targeted action. Also, it returns a `Promise` object from the `ready` function for chaining.
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

const type = 'SOMETHING';

// dispatch action
export function doSomething() {
  return ready(dispatch => dispatch({
    type,
    payload: {}
  }));
}

// do something else with dispatched action or,
// throw error if it is invalid.

// ps: you may also change the returned action
// based on your need to be dispatched for the next

export function doSomethingElse(action = {}) {
  if (action.type !== type) {
    throw new Error('Invalid dispatched action received!');
  }

  console.log(`Yay! action received:  ${JSON.stringify(action)}`);
}


// assumed `store` object is available,
// we can dispatch `doSomething` and
// proceed to the next via promise
store.dispatch(doSomething())
.then(action => doSomethingElse(action)) // show console log's message when invoked
.catch(error => alert(`Oops! ${error}`)); // alert thrown error message if failed
```
- Provide `options` as second argument to `ready` function:

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
      dispatch(showLoginNotification('You have logged in!'));
    })
    .catch(error => dispatch(showLoginNotification(error)))
  ));
}

// proceed to the next action after user logged in
export function doNextAfterLoggedIn() {
  return ready(...);
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

- ii. `options` (optional) - A custom object literal to be passed as second argument and will come together with dispatched ready action, in this form:

```js
{
  type: 'READY_ACTION',
  options: { /* your options values */ }
}
```

## License
MIT
