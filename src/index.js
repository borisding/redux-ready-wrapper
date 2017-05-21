/**
 * Ready wrapper by passing a `callback` function.
 * `options` object is optional, can be passed at action basis.
 * ready action will be dispatched with provided `options` before invoking the `callback` function.
 * This allows us to add reducer for managing state at ready action level with provided `options`.
 *
 * @param  {Function} callback
 * @param  {Object}   [options={}]
 * @return {Object}
 */
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

/**
 * ready action wrapper middleware.
 * Need to be imported as part of application's middlewares for usage.
 *
 * @return {Function|Object}
 */
export default () => (
  store => next => (action) => {
    if (typeof action === 'function') {
      return action(store);
    }

    return next(action);
  }
);
