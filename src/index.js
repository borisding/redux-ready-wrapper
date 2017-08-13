const INVALID_FUNCTION = 'Invalid callback function!';
const isFunction = fn => typeof fn === 'function';

/**
 * Ready function that accepts a `callback` and optional `options` as params
 * An ready action will be dispatched with provided options
 * before proceeding to the next targeted action
 *
 * @param  {Function} callback
 * @param  {Object}   [options={}]
 * @return {Object}
 */
export function ready(callback, options = {}) {
  return ({ dispatch, getState }) => {
    const p = new Promise((resolve, reject) => {
      if (!isFunction(callback)) {
        reject(INVALID_FUNCTION);
      } else {
        resolve(dispatch({ type: 'READY_ACTION', options }));
      }
    });

    return p.then(() => callback(dispatch, getState));
  };
}

/**
 * Wrap function that accepts a `callback` as param
 * NO ready action will be dispatched
 *
 * @param  {Function} callback
 * @return {Object}
 */
export function wrap(callback) {
  return ({ dispatch, getState }) =>
    new Promise((resolve, reject) => {
      if (!isFunction(callback)) {
        reject(INVALID_FUNCTION);
      } else {
        resolve(callback(dispatch, getState));
      }
    });
}

/**
 * Redux ready wrapper middleware.
 * Need to be imported as part of application's middlewares for usage.
 *
 * @return {Function|Object}
 */
export default () => store => next => (action) => {
  if (typeof action === 'function') {
    return action(store);
  }

  return next(action);
};
