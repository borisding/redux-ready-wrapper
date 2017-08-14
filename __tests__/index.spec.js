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
  payload: {
    id: 1,
    todo: 'test todo',
    done: false
  }
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

const fetchTodos = (isReady = true) => {
  const { TODOS_SUCCESS, TODOS_FAILURE } = types;
  const fetcher = dispatch =>
    fetch('http://example.com/todos')
      .then(response => response.json())
      .then(json => dispatch({ type: TODOS_SUCCESS, todos: json.payload.todos }))
      .catch(errors => dispatch({ type: TODOS_FAILURE, errors }));

  if (isReady) return ready(dispatch => fetcher(dispatch));
  return wrap(dispatch => fetcher(dispatch));
};

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

test('if add todo action is dispatched via `dispatch` within ready wrapper and returned', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper()).then((addTodoAction) => {
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

test('async via http request with `ready` function', (done) => {
  const todo = 'my new todo via ready!';
  nock('http://example.com/').get('/todos').reply(200, { payload: { todos: [todo] } });
  store.dispatch(fetchTodos()).then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});

test('async via http request with `wrap` function', (done) => {
  const todo = 'my new todo via wrap!';
  nock('http://example.com/').get('/todos').reply(200, { payload: { todos: [todo] } });
  store.dispatch(fetchTodos(false)).then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});
