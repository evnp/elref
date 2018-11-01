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
    cache=null,
    query=null,
    listQuery=null,
    selector=null,
  }={}) {
    root = root.shadowRoot || root;
    cache = cache || {};
    query = query || (
      (root, selector) => root.querySelector(selector)
    );
    listQuery = listQuery || (
      (root, selector) => Array.from(root.querySelectorAll(selector))
    );

    Object.assign(this, {
      htmlAttr,
      listAttr,
      cache,
      query,
      root,
      selector,
      proxy: new Proxy(this, this),
    });

    this.reserved = {
      scope: this.scope.bind(this),
      select: this.select.bind(this),
      update: this.update.bind(this),
    };

    if (listAttr) {
      this.reserved[listAttr] = new ElRef(root, {
        htmlAttr,
        listAttr: false,
        cache,
        query: listQuery,
        selector,
      });
    }

    return this.proxy;
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
   * Create a new instance of ElRef scoped to a specific element
   * @param {HTMLElement} root - the element to scope ElRef to
   * @returns {Proxy} - the new ElRef instance (wrapped in a proxy)
   */
  scope(root) {
    return new ElRef(root, this);
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
    return this.proxy;
  }

  /**
   * Check whether the current element value for `name` in the cache is valid,
   * meaning it is still attached to the DOM under the current parent element.
   * @param {string} name - the cached element name (cache key)
   * @returns {HTMLElement|Array.<HTMLElement>|undefined} - the resulting element(s)
   */
  getWithUpdate(name) {
    const elements = this.cache[name];
    const elementArray = Array.isArray(elements) ? elements : [elements];
    const valid = !!elementArray.length
      && elementArray.every(element => element && this.root.contains(element));

    return valid ? elements : (this.update(name) && this.cache[name]);
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
    return this.proxy;
  }
}
