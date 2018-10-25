import { excludeBody } from './common';
import { isObject , urlSerialize } from './helpers';

/**
 * Action instance
 * @param {Object} parent Parent resource
 * @param {String} name Action name
 * @param {Object} action Action object
 * @param {Object} [params] Params to be used for templated action
 * @param {String} type Internal identification of action type
 * @constructor
 */
export function Action(parent, name, action, params, type) {
  var
    api = this,
    rawUrl = (action.href || action.action || '').replace(/^#/, ''),
    method = action.method || (type === 'form' ? 'POST' : 'GET'),
    actionUrl = '',
    payLoad = '';

  api.linkRefs,

  /**
   * Get action name
   * @returns {String}
   */
  api.getActionName = function () {
    return name;
  };

  /**
   * Get action type
   * @returns {String}
   */
  api.getActionType = function () {
    return type;
  };

  /**
   * Get formatted url for the action
   * @returns {String}
   */
  api.getActionUrl = function () {
    return actionUrl;
  };

  /**
   * Get action method
   * @returns {String}
   */
  api.getMethod = function () {
    return method;
  };

  /**
   * Get params that need are required for the action
   * @returns {Array}
   */
  api.getParams = function () {
    return urltemplate.extractParams(rawUrl);
  };

  /**
   * Get un-formatted url for the action
   * @returns {String}
   */
  api.getRawActionUrl = function () {
    return rawUrl;
  };

  /**
   * Get action title
   * @returns {String}
   */
  api.getTitle = function () {
    return action.title || '';
  };

  /**
   * Get action template flag
   * @returns {Boolean}
   */
  api.isTemplated = function () {
    return action.templated || false;
  };

  api.setParams = function (params) {
    actionUrl = action.templated ? urltemplate.expand(rawUrl, params || {}) : rawUrl;

    if (actionUrl) {
      actionUrl = urlparse.urljoin(action.curie ? action.curie.href : parent.getBase(), actionUrl);
    }

    if (type === 'form') {
      if (action.fields && isObject(params)) {
        payLoad = {};
        Object.keys(action.fields).forEach(function (field) {
          if (params.hasOwnProperty(field)) {
            payLoad[field] = params[field];
          } else if (action.fields[field].hasOwnProperty('default')) {
            payLoad[field] = action.fields[field]['default'];
          }
        });
      } else if (params) {
        payLoad = JSON.stringify(params);
      }

      if (excludeBody.test(method) && payLoad) {
        actionUrl = urlparse.urljoin(actionUrl, '?' + urlSerialize(payLoad));
        payLoad = '';
      }
    }

    return api;
  };

  if (type === 'form') {
    /**
     * Get form fields for the form action
     * @returns {Object}
     */
    api.getFields = function () {
      return action.fields || {};
    };

    /**
     * Get payload to be submitted for the form action
     * @returns {Object}
     */
    api.getPayload = function () {
      return payLoad;
    };
  }

  if (action.curie) {
    /**
     * Get curie documentation url
     * @returns {String}
     */
    api.getDocUrl = function () {
      return urltemplate.expand(action.curie.href, {
        rel: name.split(':')[1]
      });
    };
  }

  api.setParams(params);
}
