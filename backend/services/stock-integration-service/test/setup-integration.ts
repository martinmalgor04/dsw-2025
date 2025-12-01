// Setup file for integration tests
// This file runs before each test file

// Increase timeout for integration tests
jest.setTimeout(30000);

// Clean up nock after each test
afterEach(() => {
  // nock.cleanAll() is called in beforeEach of each test file
});

