## What is redux-ready-wrapper?
- A middleware of [Redux](http://redux.js.org/docs/introduction/) library that handles asynchronous action flow.
- If you already know how to use [`redux-thunk`](https://github.com/gaearon/redux-thunk), probably you already know how to use `redux-ready-wrapper`, as alternative.
- The differences are, `redux-ready-wrapper` will dispatch an extra action with `READY_ACTION` type and `options` object *before* dispatching next targeted action(s). Also, it returns a `Promise` object from the `ready` function.
- By having ready action and options provided, this allows us to control application's state based on the "ready" mode, before subsequent action is dispatched.

## Installation & Usage
- To install package:

```sh
npm install redux-ready-wrapper --save
```

- Example 1:

```js
import { createStore, applyMiddleware } from 'redux';
import readyWrapper, { ready } from 'redux-ready-wrapper'; // import this ready wrapper
import { createLogger } from 'redux-logger';
import rootReducer from './reducer';

const middlewares = [readyWrapper()]; // add middleware by calling it!

if (process.env.NODE_ENV !== 'production') {
  middlewares.push(createLogger());
}

// create the store
const store = createStore(rootReducer, applyMiddleware(...middlewares));

const type = 'SOMETHING';

// action creator for something
const actionCreator = () => ({
  type,
  payload: { /* your stuff here...*/ }
});

// dispatch action from action creator
export function doSomething() {
  return ready(dispatch => dispatch(actionCreator()));
}

// do something else with dispatched action
// or throw error if it is invalid.
// ps: you may extract or extend the returned action as a new action to be dispatched for the next
export function doSomethingElse(dispatchedAction = {}) {
  if (dispatchedAction.type !== type) {
    throw new Error('Invalid dispatched action received!');
  }

  console.log(`Yay! action received:  ${JSON.stringify(dispatchedAction)}`);
}


// up to here, we can dispatch `doSomething` which returns `ready` function and
// proceed to the next function via promise, like so
store.dispatch(doSomething())
.then(action => doSomethingElse(action)) // show console log's message when invoked
.catch(error => alert(`Oops! ${error}`)); // alert thrown error message if failed
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
export function something(state = {}, action) {
  if (action.type === 'READY_ACTION') {
    // manage your `action.options`

  } else if (action.type === 'SOMETHING') {
    // manage state for `SOMETHING`
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
    .catch(error => showLoginNotification(error))
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
    .then(() => doNextAfterLoggedIn())
    .catch(error => /* error handling */);
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
- `ready` function from `redux-ready-wrapper` accepts two arguments:

- i. `callback` (mandatory) - A callback function that will receive `dispatch` and `getState` functions from redux's `store` object.

- ii. `options` (optional) - An custom object literal to be passed as second parameter and will come together with dispatched ready action in this form: `{ type: 'READY_ACTION', options: { /* your options values */ } }`

## License
MIT
