/**
 * @constructor
 * @mixin
 */
export default class ElRef {

  /**
   * Create a mixin fuction that can be used to add ElRef to an HTML element class
   * @param {object} [options={}] - options passed to the ElRef constructor
   * @param {string} [options.classAttr="el"] - attr name under which the ElRef
   *   instance will be stored on the HTML element
   */
  static mixin(options={}) {
    return baseClass => class extends baseClass {
      constructor() {
        super(...arguments);
        this[options.classAttr || `el`] = new ElRef(this, options);
      }
    }
  }

  /**
   * Create an instance of ElRef
   * @param {object} [options={}]
   * @param {string} [options.htmlAttr="ref"] - HTML attribute ElRef will look for
   *   when querying matching child elements
   * @param {string} [options.listAttr="list"] - attribute on ElRef instance
   *   that can be used to query for multiple children at once
   * @param {object} [options.cache=null] - object used to cache queried elements
   * @param {function} [options.query=null] - singular element query func, a la
   *   (root, selector) => root.querySelector(selector)
   * @param {function} [options.listQuery=null] - multiple element query func, a la
   *   (root, selector) => Array.from(root.querySelectorAll(selector))
   * @param {string} [options.selector=null] - custom selector string used in lieu of
   *   the standard [ref="${name}] selector
   * @returns {Proxy} - the ElRef intance, wrapped in a Proxy object:
   *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
   */
  constructor(root, {
    htmlAttr=`ref`,
    listAttr=`list`,
    cache={},
    query=null,
    listQuery=null,
    selector=null,
  }={}) {
    // set defaults
    root = root.shadowRoot || root; // enter shadowDOM if necessary
    query = query || ((el, sel) => el.querySelector(sel));
    listQuery = listQuery || ((el, sel) => [...el.querySelectorAll(sel)]);

    // apply options to ElRef instance
    Object.assign(this, {
      htmlAttr,
      listAttr,
      cache,
      query,
      root,
      selector,
    });

    // set up proxy to facilitate `this.el.*` key handling
    this.proxy = new Proxy(this, this),

    // set up "reserved" methods accessible through the proxy
    this.reserved = {
      scope: this.scope.bind(this),
      select: this.select.bind(this),
      update: this.update.bind(this),
    };

    // set up `this.el.list` - a sub-instance of ElRef that queries element lists
    if (listAttr) {
      this.reserved[listAttr] = new ElRef(root, {
        htmlAttr,
        listAttr: false,
        cache,
        query: listQuery,
        selector,
      });
    }

    // return proxy; ElRef instance is accessed entirely through proxy getter/setter
    return this.proxy;
  }

  /**
   * Create a new instance of ElRef scoped to a specific element
   * @param {HTMLElement} root - the element to scope ElRef to
   * @returns {Proxy} - the new ElRef instance (wrapped in a proxy)
   */
  scope(root) {
    return new ElRef(root, this);
  }

  /**
   * Create a new instance of ElRef with a custom selector string
   * @param {string} selector - the custom selector string
   * @returns {Proxy} - the new ElRef instance (wrapped in a proxy)
   */
  select(selector) {
    return new ElRef(this.root, Object.assign({}, this, {selector}));
  }

  /**
   * Re-query and update current element value for `name` in the cache, regardless
   * of whether it is currently valid
   * @param {string} name - the cached element name (cache key)
   * @returns {Proxy} - the current ElRef instance's proxy (for chaining calls)
   */
  update(name) {
    this.cache[name] = this.query(
      this.root,
      this.selector || `[${this.htmlAttr}="${name}"]`,
    );
    return this.proxy; // maintain chainability
  }

  /**
   * Get the current element(s) under `name` in the cache, if the reference is
   * valid (still attached to the DOM under the current parent element).
   * If invalid, re-query and update the cache, then return the element(s).
   * @param {string} name - the cached element name (cache key)
   * @returns {HTMLElement|Array.<HTMLElement>|undefined} - the resulting element(s)
   */
  getWithUpdate(name) {
    const cached = this.cache[name];

    // handle single or multi-element cached values
    const elements = Array.isArray(cached) ? cached : [cached];
    const valid = !!elements.length
      && elements.every(element => element && this.root.contains(element));

    return valid ? cached : (this.update(name) && this.cache[name]);
  }

  /**
   * Getter for arbitrary keys on the proxy wrapping the ElRef instance
   * @param {object} target - the ElRef instance
   * @param {string} name - the cached element name (cache key)
   * @returns {HTMLElement|Array.<HTMLElement>|undefined} - the resulting element(s)
   */
  get(target, name) {
    return this.reserved[name] || this.getWithUpdate(name);
  }

  /**
   * Setter for arbitrary keys on the proxy wrapping the ElRef instance
   * Allows defining custom "namespaces" under ElRef for storing other elements
   * e.g.
   *   this.el.fooElementArray = [this.el.foo, this.el.bar, this.el.baz];
   *   this.el.fooElementArray.forEach(element => ...do something...);
   * @param {object} target - the ElRef instance
   * @param {string} name - the namespace name
   * @param {any} value - the namespace value
   * @returns {Proxy} - the current ElRef instance's proxy (for chaining calls)
   */
  set(target, name, value) {
    this.reserved[name] = value;
    return true; // prevent "TypeError: 'set' on proxy: trap returned falsish..."
  }
}
