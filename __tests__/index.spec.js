import configureStore from 'redux-mock-store';
import fetch from 'node-fetch';
import nock from 'nock';
import readyWrapper, { ready, wrap } from '../src/index';

const middlewares = [readyWrapper()];
const mockStore = configureStore(middlewares);

const types = {
  ADD_TODO: 'ADD_TODO',
  TODOS_SUCCESS: 'TODOS_SUCCESS',
  TODOS_FAILURE: 'TODOS_FAILURE',
  READY_ACTION: 'READY_ACTION'
};

const todoAction = {
  type: types.ADD_TODO,
  payload: {}
};

const todoActionCreatorWithoutReadyWrapper = () => todoAction;

const todoActionCreatorWithReadyWrapper = (isReady = true) => {
  if (isReady) return ready(dispatch => dispatch(todoAction));
  return wrap(dispatch => dispatch(todoAction));
};

const invalidCallbackForReadyWrapper = (isReady = true) => {
  if (isReady) return ready('I am invalid action');
  return wrap('I am invalid action');
};

const todoActionCreatorWithOptionsForReadyWrapper = () =>
  ready(dispatch => dispatch(todoAction), { showLoder: true });

const todoRequest = dispatch =>
  fetch('http://example.com/todos')
    .then(response => response.json())
    .then(json => dispatch({ type: types.TODOS_SUCCESS, todos: json.payload.todos }))
    .catch(errors => dispatch({ type: types.TODOS_FAILURE, errors }));

const fetchTodos = (isReady = true) => {
  if (isReady) return ready(dispatch => todoRequest(dispatch));
  return wrap(dispatch => todoRequest(dispatch));
};

const httpMock = todo =>
  nock('http://example.com/').get('/todos').reply(200, { payload: { todos: [todo] } });

let store;
beforeEach(() => {
  store = mockStore({});
});

afterEach(() => {
  nock.cleanAll();
});

test('if add todo action is dispatched without using ready/wrap function', () => {
  store.dispatch(todoActionCreatorWithoutReadyWrapper());
  const actions = store.getActions();
  expect(actions[0].type).toBe(types.ADD_TODO);
});

test('if ready action is dispatched via `ready` function', () => {
  store.dispatch(todoActionCreatorWithReadyWrapper());
  const actions = store.getActions();
  expect(actions[0].type).toBe(types.READY_ACTION);
});

test('if no ready action is dispatched via `wrap` function', () => {
  store.dispatch(todoActionCreatorWithReadyWrapper(false));
  const actions = store.getActions();
  expect(actions[0].type).not.toBe(types.READY_ACTION);
  expect(actions[0].type).toBe(types.ADD_TODO);
});

test('if ready action is dispatched via ready wrapper with `options` provided', () => {
  store.dispatch(todoActionCreatorWithOptionsForReadyWrapper());
  const actions = store.getActions();
  expect(actions[0].options.showLoder).toBeTruthy();
});

test('if add todo action creator returns promise with invoked `ready`', () => {
  const invoked = store.dispatch(todoActionCreatorWithReadyWrapper());
  expect(invoked instanceof Promise).toBeTruthy();
});

test('if add todo action creator returns promise with invoked `wrap`', () => {
  const invoked = store.dispatch(todoActionCreatorWithReadyWrapper(false));
  expect(invoked instanceof Promise).toBeTruthy();
});

test('if add todo action is dispatched via `dispatch` within `ready` function and returned', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper()).then((addTodoAction) => {
    expect(addTodoAction.type).toBe(types.ADD_TODO);
    done();
  });
});

test('if add todo action is dispatched via `dispatch` within `wrap` function and returned', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper(false)).then((addTodoAction) => {
    expect(addTodoAction.type).toBe(types.ADD_TODO);
    done();
  });
});

test('if promise rejected with invalid callback function passed into `ready` function', (done) => {
  store.dispatch(invalidCallbackForReadyWrapper()).catch((error) => {
    expect(error).toBe('Invalid callback function!');
    done();
  });
});

test('if promise rejected with invalid callback function passed into `wrap` function', (done) => {
  store.dispatch(invalidCallbackForReadyWrapper(false)).catch((error) => {
    expect(error).toBe('Invalid callback function!');
    done();
  });
});

test('getState after dispatching todo action via `ready` function', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper()).then(() => {
    store.dispatch(
      ready((dispatch, getState) => {
        expect(getState()).toBe(store.getState());
        done();
      })
    );
  });
});

test('getState after dispatching todo action via `wrap` function', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper(false)).then(() => {
    store.dispatch(
      wrap((dispatch, getState) => {
        expect(getState()).toBe(store.getState());
        done();
      })
    );
  });
});

test('async via `ready` function for http request', (done) => {
  const todo = 'my new todo via ready!';
  httpMock(todo);

  store.dispatch(fetchTodos()).then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});

test('async via `wrap` function for http request', (done) => {
  const todo = 'my new todo via wrap!';
  httpMock(todo);

  store.dispatch(fetchTodos(false)).then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});

test('async via thunk for http request', (done) => {
  const todo = 'my new todo via thunk!';
  const initState = { test: '123' };

  const actionCreator = () => ({ dispatch, getState }) => {
    expect(getState().test).toBe(initState.test);
    return todoRequest(dispatch);
  };

  httpMock(todo);
  store = mockStore(initState);

  store.dispatch(actionCreator()).then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});
