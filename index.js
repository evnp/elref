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
    isAsync=false,
    pollMs=2,
    pollMod=pollMs => pollMs *= 2,
    query,
    listQuery,
    cache,
    listCache,
    selector,
  }={}) {
    Object.assign(this, {
      // set root element - enter shadow dom if necessary
      root: root.shadowRoot || root,

      // options
      htmlAttr, listAttr, isAsync, pollMs, selector,
      cache:     cache     || {},
      listCache: listCache || {},
      query:     query     || ((el, sel) => el.querySelector(sel)),
      listQuery: listQuery || ((el, sel) => [...el.querySelectorAll(sel)]),
      pollMod:   pollMod   || (x => x), // identity; allow setting pollMod: false

      // set up "reserved" - list of methods accessible through the proxy
      reserved: [`scope`, `select`, `update`, `list`, `wait`],

      // set up proxy to facilitate `this.el.*` key handling
      proxy: new Proxy(this, this),
    });

    // deal with some scoping issues
    this.scope = this.scope.bind(this);
    this.select = this.select.bind(this);
    this.update = this.update.bind(this);

    // return proxy; ElRef instance is accessed entirely through proxy getter/setter
    return this.proxy;
  }

  /**
   * Create a new instance of ElRef that queries for lists of ref elements instead
   * of returning first matching ref element.
   * @returns {Proxy} - the new ElRef instance (wrapped in a proxy)
   */
  get list() {
    return new ElRef(this.root, Object.assign({}, this, {
      cache: this.listCache,
      query: this.listQuery,
    }));
  }

  /**
   * Create a new async instance of ElRef that returns promises that can be awaited
   * instead of returning elements directly. Allows waiting for an element to appear.
   * @returns {Proxy} - the new ElRef instance (wrapped in a proxy)
   */
  get wait() {
    return new ElRef(this.root, Object.assign({}, this, {
      isAsync: true,
    }));
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
    this.cache[name] = this.query(this.root, this.selector || `[${this.htmlAttr}="${name}"]`);
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

  getWithUpdateAsync(name) {
    return new Promise(resolve => {
      const query = () => handle(this.getWithUpdate(name));
      const valid = result => !!(Array.isArray(result) ? result.length : result);
      const handle = result =>
        valid(result) ? resolve(result) : window.setTimeout(query, this.pollMod(this.pollMs));
      query();
    });
  }

  /**
   * Getter for arbitrary keys on the proxy wrapping the ElRef instance
   * @param {object} target - the ElRef instance
   * @param {string} name - the cached element name (cache key)
   * @returns {HTMLElement|Array.<HTMLElement>|undefined} - the resulting element(s)
   */
  get(target, name) {
    return (
      this.reserved.includes(name) ? this[name] :
      this.isAsync ? this.getWithUpdateAsync(name) :
       /* default */ this.getWithUpdate(name)
    );
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
    this.reserved.push(name);
    this[name] = value;
    return true; // prevent "TypeError: 'set' on proxy: trap returned falsish..."
  }
}
