# elref

**EXPERIMENTAL**\
**TODO:** tests, types, compatibility (currently requires ES6 support, [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy))

Adds `this.el` to a custom element, allowing the definition of internal element references via `ref="<name>"` HTML attrs placed on child elements. Child elements are then accessible at `this.el.<name>`.

`this.el` provides getters at every key that will lazily query the parent for the first child element with a matching `ref="<name>"` attribute (`undefined` if no matching children are found).

`this.el.list.<key>` behaves similarily but queries for _all_ matching children and returns an array (empty array if no matching children are found).

Results will be cached and returned as long as they are still attached to DOM

---

An example is worth a thousand words ([LitElement](https://github.com/Polymer/lit-element) used for HTML-rendering simplicity):

```javascript
import ElRef from 'elref';

class MyElement extends LitElement {
  constructor() {
    super(...arguments);
    this.el = new ElRef(this);
  }

  render() {
    return html`
      <div ref="foo">
        <div ref="bar"></div>
        <div ref="bar"></div>
      </div>
    `;
  }

  async update() {
    await this.updateComplete;

    console.log(this.el.foo);      // --> <div ref="foo">
    console.log(this.el.list.bar); // --> [ <div ref="bar">, <div ref="bar"> ]
    // lazy querying - queries are not executed until these calls and results are cached

    // you can also store custom values under this.el:
    this.el.all = [this.el.foo, ...this.el.list.bar];
    console.log(this.el.all); // --> [ <div ref="foo">, <div ref="bar">, <div ref="bar"> ]

    // now we can easily iterate over all our elements:
    console.log(this.el.all.map(el => el.getAttribute(`ref`))); // --> ["foo", "bar", "bar"]
  }
}
```

It's also possible to "scope" and "select" for greater control over querying.
This can be useful when your HTML is generated by some external means and you
are unable to add ref attributes easily.

```javascript
import ElRef from 'elref';

class MyElement extends LitElement {
  constructor() {
    super(...arguments);
    this.el = new ElRef(this);
  }

  render() {
    this.chart.render(); // chart rendering handled externally...
    // Resulting HTML:
    // <div class="chart-container">
    //   <svg>
    //     <g class="plot-area">...</g>
    //     <g class="axis x">...</g>
    //     <g class="axis y">...</g>
    //   </svg>
    // </div>
  }

  async update() {
    await this.updateComplete;

    const svg = this.el.select(`.chart-container svg`).svg; // query for svg

    this.el
      .scope(svg) // from here on in the chain queries only operate within `svg`
        .select(`g.plot-area`).update(`plotArea`) // query for plot area element
        .list.select(`g.axis`).update(`axes`);    // query for axis elements

    console.log(this.el.plotArea); // --> <g class="plot-area">
    console.log(this.el.axes);     // --> [ <g class="axis x">, <g class="axis y"> ]
  }
}
```

Usable as a mixin:

```javascript
import ElRef from 'elref';

class MyElement extends ElRef.mixin()(LitElement) {
  // no constructor override necessary
  ...
}
```
OR
```javascript
import ElRef from 'elref';
import {mix} from 'mixwith';

class MyElement extends mix(LitElement).with(ElRef.mixin()) {
  // no constructor override necessary
  ...
}
```
