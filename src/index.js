// `ready` function to be returned instead of action that you want to dispatch
// Both `dispatch` and `getState` are then passed to resolved `callback` function

// Note that ready action will be dispatched before invoking callback
// You may control or do something based on the provided options and ready action type
export function ready(callback, options = {}) {
  const type = 'READY_ACTION';
  const readyActionCreator = () => ({ type, options });

  return ({ dispatch, getState }) => {
    const p = new Promise((resolve, reject) => {
      if (typeof callback !== 'function') {
        reject('Invalid callback function!');
      } else {
        resolve(dispatch(readyActionCreator()));
      }
    });

    return p.then(() => callback(dispatch, getState));
  };
}

// exported ready action middleware
// passing store object to action when function is returned
// otherwise, proceed to the next action
export default () => (
  store => next => (action) => {
    if (typeof action === 'function') {
      return action(store);
    }

    return next(action);
  }
);
