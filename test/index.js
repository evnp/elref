import ElRef from '../index.js';

window.mocha.setup(`bdd`);

const {describe, it, before} = window;
const {expect} = window.chai;

let root;

describe(`ElRef`, function() {
  before(function() {
    root = document.createElement(`div`);
    document.body.appendChild(root);
  });

  beforeEach(function() {
    root.innerHTML = `
      <div class="farm" ref="farm" style="padding: 80px">
        🌾 🚜
        <span class="cow" ref="cow">🐄</span>
        <span class="pig" ref="pig">🐖</span>
        <span class="goat" ref="goat">🐐</span>
        <span class="pig" ref="pig">🐖</span>
        🌾
      </div>
    `;
    root.el = new ElRef(root);
  });

  it(`should find ref elements`, function() {
    expect(root.el.farm).to.be.an.instanceof(HTMLElement);
    expect(root.el.cow).to.be.an.instanceof(HTMLElement);
    expect(root.el.pig).to.be.an.instanceof(HTMLElement);
    expect(root.el.goat).to.be.an.instanceof(HTMLElement);

    expect(root.el.farm).to.eql(document.querySelector(`.farm`));
    expect(root.el.cow).to.eql(document.querySelector(`.cow`));
    expect(root.el.pig).to.eql(document.querySelector(`.pig`));
    expect(root.el.goat).to.eql(document.querySelector(`.goat`));
  });

  it(`should find list ref elements`, function() {
    expect(root.el.list.farm).to.be.an.instanceof(Array);
    expect(root.el.list.cow).to.be.an.instanceof(Array);
    expect(root.el.list.pig).to.be.an.instanceof(Array);
    expect(root.el.list.goat).to.be.an.instanceof(Array);

    expect(root.el.list.farm.length).to.eql(1);
    expect(root.el.list.cow.length).to.eql(1);
    expect(root.el.list.pig.length).to.eql(2);
    expect(root.el.list.goat.length).to.eql(1);

    expect(root.el.list.farm).to.eql([...document.querySelectorAll(`.farm`)]);
    expect(root.el.list.cow).to.eql([...document.querySelectorAll(`.cow`)]);
    expect(root.el.list.pig).to.eql([...document.querySelectorAll(`.pig`)]);
    expect(root.el.list.goat).to.eql([...document.querySelectorAll(`.goat`)]);
  });

  it(`should find async ref elements`, async function() {
    const sloth = document.createElement(`div`);

    sloth.setAttribute(`class`, `sloth`);
    sloth.setAttribute(`ref`, `sloth`);

    setTimeout(() => root.el.farm.appendChild(sloth), 100);

    expect(root.el.sloth).to.not.exist;

    expect(await root.el.wait.sloth).to.be.an.instanceof(HTMLElement);
    expect(await root.el.wait.sloth).to.eql(document.querySelector(`.sloth`));

    // now that we've awaited the sloth, the element should be available normally
    expect(root.el.sloth).to.exist;
    expect(root.el.sloth).to.be.an.instanceof(HTMLElement);
    expect(root.el.sloth).to.eql(document.querySelector(`.sloth`));
  });

  it(`should find async list ref elements`, async function() {
    const thing1 = document.createElement(`div`);
    const thing2 = document.createElement(`div`);

    thing1.setAttribute(`class`, `thing`);
    thing2.setAttribute(`class`, `thing`);
    thing1.setAttribute(`ref`, `thing`);
    thing2.setAttribute(`ref`, `thing`);

    setTimeout(() => root.el.farm.appendChild(thing1), 100);
    setTimeout(() => root.el.farm.appendChild(thing2), 100);

    expect(root.el.list.thing.length).to.eql(0);

    expect((await root.el.wait.list.thing).length).to.eql(2);
    expect(await root.el.wait.list.thing).to.be.an.instanceof(Array);
    expect(await root.el.wait.list.thing).to.eql([...document.querySelectorAll(`.thing`)]);

    expect((await root.el.list.wait.thing).length).to.eql(2);
    expect(await root.el.list.wait.thing).to.be.an.instanceof(Array);
    expect(await root.el.list.wait.thing).to.eql([...document.querySelectorAll(`.thing`)]);

    // now that we've awaited the things, the elements should be available normally
    expect(root.el.list.thing.length).to.eql(2);
    expect(root.el.list.thing).to.be.an.instanceof(Array);
    expect(root.el.list.thing).to.eql([...document.querySelectorAll(`.thing`)]);
  });
});

window.mocha.run();
