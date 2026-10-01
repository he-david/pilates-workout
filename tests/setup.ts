import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// the dev seed (?devDone) is remembered in sessionStorage; never leak it between tests
afterEach(() => sessionStorage.clear())
