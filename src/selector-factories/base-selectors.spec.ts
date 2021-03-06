import selectorsFactory from './base-selectors';
import { makeResourceReducer } from './../index';
import { API_ACTION_PREFIXES, API_LIFECYCLE_SUFFIXES } from '../actions';

const { FETCH, UPDATE, REMOVE } = API_ACTION_PREFIXES;
const { START, FAILURE } = API_LIFECYCLE_SUFFIXES;

describe('selectorsFactory()', () => {
  const entitiesPath = 'byId';
  const resource = 'foo';
  const id = '789';
  const initialState = {
    [entitiesPath]: {
      '123': { id: '123', name: 'foo' },
      '456': { id: '456', name: 'bar' },
      [id]: { id, name: 'baz' },
    },
  };
  const fooReducer = makeResourceReducer({
    entitiesPath,
    initialState,
    resource,
  });
  const callFooReducer = (action: object, customState = undefined) => {
    const nextState = {
      [resource]: fooReducer(customState, action),
    };
    return nextState;
  };
  const fooSelectors = selectorsFactory({ entitiesPath, resource });

  const makeBlankInitialState = () => callFooReducer({ type: '@@INIT' });
  const makePendingStateFromAction = (type: string) => {
    const pendingAction = {
      type,
      meta: { referenceId: id },
    };
    return callFooReducer(pendingAction);
  };

  it('dynamically creates a base set of selectors', () => {
    [
      `getFooEntities`,
      `getFooById`,
      `getCurrentFoo`,
      `getFooErrors`,
      `getFooErrorsById`,
      `getAreFooEntitiesFetching`,
      `getIsFooFetching`,
      `getIsFooUpdating`,
      `getIsFooRemoving`,
    ].forEach(selectorName => {
      expect(fooSelectors).toHaveProperty(selectorName);
    });
  });

  it('gets all entities with get*Entities()', () => {
    const state = makeBlankInitialState();

    expect(fooSelectors.getFooEntities(state)).toEqual(
      initialState[entitiesPath]
    );
  });

  it('gets a specific entity with get*EntityById', () => {
    const state = makeBlankInitialState();

    expect(fooSelectors.getFooById(state, { id })).toEqual(
      initialState[entitiesPath][id]
    );
  });

  it('gets the first entity with getCurrent*', () => {
    const state = makeBlankInitialState();

    expect(fooSelectors.getCurrentFoo(state)).toEqual(
      initialState[entitiesPath]['123']
    );
  });

  it('gets root level errors with get*Errors', () => {
    const errors = ['nooooo root level error'];
    // Only action type that can set root level errors
    const errorAction = {
      type: `${FETCH}_${resource}_${FAILURE}`,
      errors,
    };
    const state = callFooReducer(errorAction);

    expect(fooSelectors.getFooErrors(state)).toEqual(errors);
  });

  it('gets specific errors with get*ErrorsById', () => {
    const errors = ['error at entity'];
    const errorAction = {
      type: `${FETCH}_${resource}_${FAILURE}`,
      errors,
      meta: {
        referenceId: id,
      },
    };
    const state = callFooReducer(errorAction);

    expect(fooSelectors.getFooErrorsById(state, { id })).toEqual(errors);
  });

  it("doesn't error if the single entity doesn't exist in get*ErrorsById", () => {
    const state = makeBlankInitialState();

    expect(fooSelectors.getFooErrorsById(state, { id: '890' })).toEqual(
      undefined
    );
  });

  it('determines if the collection is fetching with getAre*EntitiesFetching', () => {
    const collectionFetchAction = {
      type: `${FETCH}_${resource}_${START}`,
      // No meta.referenceId to specify specific entity fetch
    };
    const state = callFooReducer(collectionFetchAction);

    expect(fooSelectors.getAreFooEntitiesFetching(state)).toEqual(true);
  });

  it('determines if a single entity is being fetched with getIs*Fetching', () => {
    const state = makePendingStateFromAction(`${FETCH}_${resource}_${START}`);
    expect(fooSelectors.getIsFooFetching(state, { id })).toEqual(true);
  });

  it("doesn't error if the single entity doesn't exist in getIs*ing", () => {
    const state = makeBlankInitialState();

    expect(fooSelectors.getIsFooFetching(state, { id: '890' })).toEqual(
      undefined
    );
  });

  it('determines if a single entity is being updated with getIs*Updating', () => {
    const state = makePendingStateFromAction(`${UPDATE}_${resource}_${START}`);
    expect(fooSelectors.getIsFooUpdating(state, { id })).toEqual(true);
  });

  it('determines if a single entity is being removed with getIs*Removing', () => {
    const state = makePendingStateFromAction(`${REMOVE}_${resource}_${START}`);
    expect(fooSelectors.getIsFooRemoving(state, { id })).toEqual(true);
  });
});
