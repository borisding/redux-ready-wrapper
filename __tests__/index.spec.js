import configureStore from 'redux-mock-store';
import fetch from 'node-fetch';
import nock from 'nock';
import readyWrapper, { ready } from '../src/index';

const middlewares = [readyWrapper()];
const mockStore = configureStore(middlewares);
const types = {
  ADD_TODO: 'ADD_TODO',
  TODOS_SUCCESS: 'TODOS_SUCCESS',
  TODOS_FAILURE: 'TODOS_FAILURE',
  READY_ACTION: 'READY_ACTION',
};
const todoAction = {
  type: types.ADD_TODO,
  payload: {},
};

const todoActionCreatorWithoutReadyWrapper = () => todoAction;
const todoActionCreatorWithReadyWrapper = () => ready(dispatch => dispatch(todoAction));
const todoActionCreatorWithOptionsForReadyWrapper = () =>
(ready(dispatch => dispatch(todoAction), { showLoder: true }));
const invalidCallbackForReadyWrapper = () => ready('I am invalid action');
const fetchTodos = () => {
  const { TODOS_SUCCESS, TODOS_FAILURE } = types;
  return ready(dispatch => (
    fetch('http://example.com/todos')
    .then(response => response.json())
    .then(json => dispatch({ type: TODOS_SUCCESS, todos: json.payload.todos }))
    .catch(errors => dispatch({ type: TODOS_FAILURE, errors }))
  ));
};

let store;
beforeEach(() => {
  store = mockStore({});
});

afterEach(() => {
  nock.cleanAll();
});

test('if add todo action is dispatched without using ready wrapper', () => {
  store.dispatch(todoActionCreatorWithoutReadyWrapper());
  const actions = store.getActions();
  expect(actions[0].type).toBe(types.ADD_TODO);
});

test('if ready action is dispatched via ready wrapper', () => {
  store.dispatch(todoActionCreatorWithReadyWrapper());
  const actions = store.getActions();
  expect(actions[0].type).toBe(types.READY_ACTION);
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

test('if add todo action is dispatched via `dispatch` within ready wrapper and returned', (done) => {
  store.dispatch(todoActionCreatorWithReadyWrapper())
  .then((addTodoAction) => {
    expect(addTodoAction.type).toBe(types.ADD_TODO);
    done();
  });
});

test('if promise rejected with invalid callback function passed into ready wrapper', (done) => {
  store.dispatch(invalidCallbackForReadyWrapper())
  .catch((error) => {
    expect(error).toBe('Invalid callback function!');
    done();
  });
});

test('async via http request.', (done) => {
  const todo = 'my new todo!';

  nock('http://example.com/')
  .get('/todos')
  .reply(200, { payload: { todos: [todo] } });

  store.dispatch(fetchTodos())
  .then((action) => {
    expect(action.type).toBe(types.TODOS_SUCCESS);
    expect(action.todos[0]).toBe(todo);
    done();
  });
});
