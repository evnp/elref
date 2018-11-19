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
        <span class="yard" ref="yard">
          <span class="pig" ref="pig">🐖</span>
          <span class="goat" ref="goat">🐐</span>
        </span>
        <span class="barn" ref="barn">
          <span class="pig" ref="pig">🐖</span>
          <span class="cow" ref="cow">🐄</span>
        </span>
        🌾
      </div>
    `;
    root.el = new ElRef(root);
  });

  it(`should find ref elements`, function() {
    expect(root.el.cow).to.be.an.instanceof(HTMLElement);
    expect(root.el.pig).to.be.an.instanceof(HTMLElement);
    expect(root.el.goat).to.be.an.instanceof(HTMLElement);

    expect(root.el.cow).to.eql(document.querySelector(`.cow`));
    expect(root.el.pig).to.eql(document.querySelector(`.pig`));
    expect(root.el.goat).to.eql(document.querySelector(`.goat`));
  });

  it(`should find list ref elements`, function() {
    expect(root.el.list.cow).to.be.an.instanceof(Array);
    expect(root.el.list.pig).to.be.an.instanceof(Array);
    expect(root.el.list.goat).to.be.an.instanceof(Array);

    expect(root.el.list.cow.length).to.eql(1);
    expect(root.el.list.pig.length).to.eql(2);
    expect(root.el.list.goat.length).to.eql(1);

    expect(root.el.list.cow).to.eql([...document.querySelectorAll(`.cow`)]);
    expect(root.el.list.pig).to.eql([...document.querySelectorAll(`.pig`)]);
    expect(root.el.list.goat).to.eql([...document.querySelectorAll(`.goat`)]);
  });

  it(`should find async ref elements`, async function() {
    const sloth = document.createElement(`div`);

    sloth.setAttribute(`class`, `sloth`);
    sloth.setAttribute(`ref`, `sloth`);

    requestAnimationFrame(() => root.el.farm.appendChild(sloth));

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

    requestAnimationFrame(() => root.el.farm.appendChild(thing1));
    requestAnimationFrame(() => root.el.farm.appendChild(thing2));

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

  it(`should scope queries effectively`, async function() {
    expect(root.el.scope(root.el.yard).pig).to.be.an.instanceof(HTMLElement);
    expect(root.el.scope(root.el.yard).goat).to.be.an.instanceof(HTMLElement);
    expect(root.el.scope(root.el.barn).pig).to.be.an.instanceof(HTMLElement);
    expect(root.el.scope(root.el.barn).cow).to.be.an.instanceof(HTMLElement);

    expect(root.el.scope(root.el.yard).cow).to.not.exist;
    expect(root.el.scope(root.el.barn).goat).to.not.exist;
  });

  it(`should select elements without ref definition`, async function() {
    const thing1 = document.createElement(`div`);
    const thing2 = document.createElement(`div`);

    thing1.setAttribute(`class`, `thing`);
    thing2.setAttribute(`class`, `thing`);

    root.el.farm.appendChild(thing1);
    root.el.farm.appendChild(thing2);

    expect(root.el.thing).to.not.exist;
    expect(root.el.list.thing).to.be.an.instanceof(Array);
    expect(root.el.list.thing.length).to.eql(0);

    expect(root.el.select(`.thing`).thing).to.be.an.instanceof(HTMLElement);
    expect(root.el.select(`.thing`).thing).to.eql(document.querySelector(`.thing`));

    expect(root.el.select(`.thing`).list.thing).to.be.an.instanceof(Array);
    expect(root.el.select(`.thing`).list.thing.length).to.eql(2);
    expect(root.el.select(`.thing`).list.thing).to.eql([...document.querySelectorAll(`.thing`)]);

    expect(root.el.list.select(`.thing`).thing).to.be.an.instanceof(Array);
    expect(root.el.list.select(`.thing`).thing.length).to.eql(2);
    expect(root.el.list.select(`.thing`).thing).to.eql([...document.querySelectorAll(`.thing`)]);

    // now that we've accessed the things, the elements should be available normally
    expect(root.el.thing).to.be.an.instanceof(HTMLElement);
    expect(root.el.thing).to.eql(document.querySelector(`.thing`));

    expect(root.el.list.thing.length).to.eql(2);
    expect(root.el.list.thing).to.be.an.instanceof(Array);
    expect(root.el.list.thing).to.eql([...document.querySelectorAll(`.thing`)]);
  });

  it(`should update element cache directly`, async function() {
    const newGoat = document.createElement(`div`);
    const oldGoat = root.el.goat;

    oldGoat.setAttribute(`ref`, ``);
    newGoat.setAttribute(`ref`, `goat`);
    root.el.farm.appendChild(newGoat);

    expect(root.el.goat).to.eql(oldGoat);
    root.el.update(`goat`);
    expect(root.el.goat).to.eql(newGoat);
  });

  it(`should update element list cache directly`, async function() {
    const thing1 = document.createElement(`div`);
    const thing2 = document.createElement(`div`);

    thing1.setAttribute(`class`, `thing`);
    thing2.setAttribute(`class`, `thing`);
    thing1.setAttribute(`ref`, `thing`);
    thing2.setAttribute(`ref`, `thing`);

    root.el.farm.appendChild(thing1);
    expect(root.el.list.thing).to.eql([thing1]);
    root.el.farm.appendChild(thing2);
    expect(root.el.list.thing).to.eql([thing1]);
    root.el.list.update(`thing`);
    expect(root.el.list.thing).to.eql([thing1, thing2]);
  });

  it(`should pierce shadowDOM boundaries`, async function() {
    // TODO
  });
});

window.mocha.run();
