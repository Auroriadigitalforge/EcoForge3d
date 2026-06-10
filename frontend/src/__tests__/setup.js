import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// localStorage mock — reset between tests so state doesn't leak
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:     (key)        => store[key] ?? null,
    setItem:     (key, value) => { store[key] = String(value); },
    removeItem:  (key)        => { delete store[key]; },
    clear:       ()           => { store = {}; },
    get length() { return Object.keys(store).length; },
    key:         (i)          => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  window.localStorage.clear();
});
