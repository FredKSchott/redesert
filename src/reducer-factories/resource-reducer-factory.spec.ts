import resourceReducerFactory from './resource-reducer-factory';
import { Action } from '../actions/type-definitions';

const assertOutputIsFunction = (output: Function) => {
  it('returns a function', () => {
    expect(output()).toBeInstanceOf(Function);
  });
};

describe('resourceReducerFactory()', () => {
  const entitiesPath = 'byId';
  const resource = 'foo';
  const initialState = { foo: 'foo' };
  const defaultProps = { entitiesPath, initialState, resource };

  assertOutputIsFunction(() => resourceReducerFactory(defaultProps));

  it('returns the initialState on the @@INIT action type', () => {
    const fooReducer = resourceReducerFactory(defaultProps);
    const value = fooReducer(initialState, { type: '@@INIT' });
    expect(value).toEqual(initialState);
  });

  describe('action.type relations to the resource', () => {
    it('returns state when the action.type is unrelated', () => {
      const fooReducer = resourceReducerFactory(defaultProps);
      const value = fooReducer(initialState, { type: 'FETCH_bar_START' });
      expect(value).toEqual(initialState);
    });

    it('runs the reducers if the action.type pertains to the resource', () => {
      const expectedValue = { ...initialState, custom: 'value ' };
      const mockReducerFn = jest.fn().mockReturnValue(expectedValue);
      const fooReducer = resourceReducerFactory({
        ...defaultProps,
        customReducerFactories: {
          makeFetchLifeCycle: ({ entitiesPath }: any) => mockReducerFn,
        },
      });
      const value = fooReducer(initialState, { type: `CUSTOM_${resource}` });

      expect(value).toEqual(expectedValue);
    });

    it('returns state if no state changes were applied', () => {
      const expectedState = { foo: 'bar', baz: 'qux' };
      const mockReducerFn = jest.fn().mockReturnValue(expectedState);
      const fooReducer = resourceReducerFactory({
        ...defaultProps,
        customReducerFactories: {
          makeFetchLifeCycle: ({ entitiesPath }: any) => mockReducerFn,
        },
      });
      const value = fooReducer(expectedState, { type: `CUSTOM_${resource}` });

      expect(value).toEqual(expectedState);
    });
  });

  describe('cases around externalActionTypes', () => {
    // Usually pair externalActionTypes with cases in a customReducer
    const MY_CUSTOM_ACTION_TYPE = 'MY_CUSTOM_ACTION_TYPE';
    const customReducer = (state: object, action: Action) => {
      if (action.type === MY_CUSTOM_ACTION_TYPE) {
        return { ...state, hello: 'world' };
      }
      return state;
    };

    it("returns state when the action.type isn't accounted for", () => {
      const fooReducer = resourceReducerFactory(defaultProps);
      const value = fooReducer(initialState, { type: MY_CUSTOM_ACTION_TYPE });
      expect(value).toEqual(initialState);
    });

    it('handles the action.type if explicitly accounted for', () => {
      const fooReducer = resourceReducerFactory({
        ...defaultProps,
        customReducerFactories: {
          makeCustomHelloReducer: ({ entitiesPath }: any) => customReducer,
        },
        externalActionTypes: [MY_CUSTOM_ACTION_TYPE],
      });
      const value = fooReducer(initialState, { type: MY_CUSTOM_ACTION_TYPE });

      expect(value).toEqual({ ...initialState, hello: 'world' });
    });
  });
});
