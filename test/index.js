import ElRef from '../index.js';

window.mocha.setup(`bdd`);

const {describe, it} = window;
const {expect} = window.chai;

describe(`ElRef`, function() {
  it(`should exist`, function() {
    expect(ElRef).to.exist;
  });
});

window.mocha.run();
