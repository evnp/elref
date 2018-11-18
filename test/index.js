import ElRef from '../index.js';

window.mocha.setup(`bdd`);

const {describe, it, before} = window;
const {expect} = window.chai;

let root;

describe(`ElRef`, function() {
  before(function() {
    root = document.createElement(`div`);
    root.innerHTML = `
      <div class="farm" ref="farm">
        <div class="cow" ref="cow"></div>
        <div class="pig" ref="pig"></div>
        <div class="chicken" ref="chicken"></div>
        <div class="pig" ref="pig"></div>
        <div class="goat" ref="goat"></div>
      </div>
    `;
    document.body.appendChild(root);
    root.el = new ElRef(root);
  });

  it(`should find ref elements`, function() {
    expect(root.el.farm).to.eql(document.querySelector(`.farm`));
    expect(root.el.cow).to.eql(document.querySelector(`.cow`));
    expect(root.el.pig).to.eql(document.querySelector(`.pig`));
    expect(root.el.chicken).to.eql(document.querySelector(`.chicken`));
    expect(root.el.goat).to.eql(document.querySelector(`.goat`));

    expect(root.el.farm).to.be.an.instanceof(HTMLElement);
    expect(root.el.cow).to.be.an.instanceof(HTMLElement);
    expect(root.el.pig).to.be.an.instanceof(HTMLElement);
    expect(root.el.chicken).to.be.an.instanceof(HTMLElement);
    expect(root.el.goat).to.be.an.instanceof(HTMLElement);
  });

  it(`should find list ref elements`, function() {
    expect(root.el.list.farm).to.eql([...document.querySelectorAll(`.farm`)]);
    expect(root.el.list.cow).to.eql([...document.querySelectorAll(`.cow`)]);
    expect(root.el.list.pig).to.eql([...document.querySelectorAll(`.pig`)]);
    expect(root.el.list.chicken).to.eql([...document.querySelectorAll(`.chicken`)]);
    expect(root.el.list.goat).to.eql([...document.querySelectorAll(`.goat`)]);

    expect(root.el.list.farm).to.be.an.instanceof(Array);
    expect(root.el.list.cow).to.be.an.instanceof(Array);
    expect(root.el.list.pig).to.be.an.instanceof(Array);
    expect(root.el.list.chicken).to.be.an.instanceof(Array);
    expect(root.el.list.goat).to.be.an.instanceof(Array);

    expect(root.el.list.farm.length).to.eql(1);
    expect(root.el.list.cow.length).to.eql(1);
    expect(root.el.list.pig.length).to.eql(2);
    expect(root.el.list.chicken.length).to.eql(1);
    expect(root.el.list.goat.length).to.eql(1);
  });
});

window.mocha.run();
