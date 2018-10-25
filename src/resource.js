import { excludedProps } from './common';
import { Action } from './action';

function parseCuries(curies) {
  var result = {};

  (curies || []).forEach(function (curie) {
    if (curie.name) {
      result[curie.name] = curie;
    }
  });

  return result;
}

function parseEmbedded(res, parent) {
  var
    result = {};

  Object.keys(res).forEach(function (key) {
    result[key] = Array.isArray(res[key]) ? res[key].map(function (item) {
      return new EmbeddedResource(item, parent);
    }) : new EmbeddedResource(res[key], parent);
  });

  return result;
}

function sharedResourceAPI(obj, res, parent, base) {
  var
    props = {},
    link = ((res._links || {}).self || {}).href || '',
    actions = [],
    embedded = parseEmbedded(res._embedded || {}, obj);

  Object.keys(res).forEach(function (key) {
    if (!excludedProps.test(key)) {
      this[key] = res[key];
    }
  }, props);

  /**
  * Get Action
  * @description Allow to follow actions (links, forms) on HAL resources and embedded resources
  * @param {String} name The name of the action to be taken
  * @param {Object} params Parameters to populate the action
  * @returns {Array} List of available actions
  */
  obj.getAction = function (name, params) {
    if (!actions[name]) {
      actions[name] = [];

      var
        linkCuries = parseCuries((res._links || {}).curies),
        formCuries = parseCuries((res._forms || {}).curies),
        curieName = String(name).split(':')[0] || '';

      [].concat.call([], (res._links || {})[name]).forEach(function (lnk) {
        if (lnk) {
          lnk.curie = linkCuries[curieName];
          actions[name].push(new Action(this, name, lnk, params, 'link'));
        }
      }, this);

      [].concat.call([], (res._forms || {})[name]).forEach(function (frm) {
        if (frm) {
          frm.curie = formCuries[curieName];
          actions[name].push(new Action(this, name, frm, params, 'form'));
        }
      }, this);
    }

    return actions[name].map(function (action) {
      return action.setParams(params);
    });
  };

  /**
  * Get base api path
  * @returns {String}
  */
  obj.getBase = function () {
    return base || parent.getBase();
  };

  /**
  * Get embedded object
  * @param {String} name Name of the embedded object
  * @returns {Object}
  */
  obj.getEmbedded = function (name) {
    return embedded[name];
  };

  /**
  * Fetch embedded
  * @description Get the object from embedded or follow a link with the same name
  * @param {String} name Name of the embedded object
  * @param {Object} [options] to provide to fetch for actions
  * @returns {Promise}
  */
  obj.fetchEmbedded = function (name, options) {
    return this.hasEmbedded(name) ? Promise.resolve({
      data: this.getEmbedded(name)
    }) : this.getFirstAction(name).fetch(options);
  };

  /**
  * Get first action from getAction list
  * @description Convenience method to get the first action instead of using getAction()[0]
  * @param {String} name The name of the action to be taken
  * @param {Object} params Parameters to populate the action
  * @returns {Object} Get Action API
  */
  obj.getFirstAction = function (name, params) {
    return this.getAction(name, params)[0] || new Action(this, name, {}, {}, 'none');
  };

  /**
  * Get parent resource object
  * @returns {Object}
  */
  obj.getParent = function () {
    return parent;
  };

  /**
  * Get property value
  * @returns {*}
  */
  obj.getProp = function (prop) {
    return props[prop];
  };

  /**
  * Get all properties as an object
  * @returns {Object}
  */
  obj.getProps = function () {
    return props;
  };

  /**
  * Does an object have a given action?
  * @description Convenience method to find out if an object has a link or form
  * @param {String} name The name of the action
  * @returns {Boolean}
  */
  obj.hasAction = function (name) {
    return obj.hasLink(name) || obj.hasForm(name);
  };

  /**
  * Does a resource contain a given embedded obj?
  * @description Convenience method to find out if a resource contains an embedded object
  * @param {String} name The name of the embedded obj
  * @returns {Boolean}
  */
  obj.hasEmbedded = function (name) {
    return !!embedded[name];
  };

  /**
  * Does an object have a given form?
  * @description Convenience method to find out if an object has a form
  * @param {String} name The name of the form
  * @returns {Boolean}
  */
  obj.hasForm = function (name) {
    return obj.listActions().forms.indexOf(name) >= 0;
  };

  /**
  * Does an object have a given link?
  * @description Convenience method to find out if an object has a link
  * @param {String} name The name of the link
  * @returns {Boolean}
  */
  obj.hasLink = function (name) {
    return obj.listActions().links.indexOf(name) >= 0;
  };

  /**
  * List of all available actions
  * @returns {Object}
  */
  obj.listActions = function () {
    var
      filter = function (item) {
        return item !== 'curies';
      };

    return {
      links: Object.keys(res._links || {}).filter(filter),
      forms: Object.keys(res._forms || {}).filter(filter)
    };
  };

  /**
  * List of all available embedded objects
  * @returns {Array}
  */
  obj.listEmbedded = function () {
    return Object.keys(embedded);
  };

  if (!base) {
    /**
    * Get root level resource
    */
    obj.getRoot = function () {
      var root;

      do {
        root = this.getParent();
      } while (!(root instanceof Resource));

      return root;
    };
  }

  if (link) {
    this.linkRefs[link] = obj;
  }
}


/**
 * HAL Embedded resource
 * @param {Resource} res HAL resource
 * @param {Resource} parent Parent HAL resource
 * @constructor
 */
export function EmbeddedResource(res, parent) {
  return sharedResourceAPI(this, res || {}, parent);
}

/**
 * HAL Resource
 * @param {String} base Base url for the resource
 * @param {Object} res Resource data
 * @constructor
 */
export function Resource(base, res) {
  return sharedResourceAPI(this, res, this, base);
}
