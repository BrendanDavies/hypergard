import { defaultOptions, excludeBody } from './common';
import { loadNetworkResource, isObject , urlSerialize } from './helpers';
import { Resource } from './resource';
import deepExtend from '../lib/extend.js';

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

Action.prototype.fetch = function (fetchOptions) {
  fetchOptions || (fetchOptions = {});

  var
    url = fetchOptions.url || this.getActionUrl(),
    rawUrl = this.getRawActionUrl(),
    name = this.getActionName(),
    payLoad = this.getPayload ? this.getPayload() : '',
    o = deepExtend({
      method: this.getMethod(),
      action: name,
    }, defaultOptions.xhr, fetchOptions),

    onSuccess = function (response) {
      if (response.status === 204) {
        return Promise.resolve({
          action: name,
          data: '',
          xhr: response
        });
      }

      return response.json().then(function (data) {
        return {
          action: name,
          data: isObject(data) ? new Resource(url, data) : response.text(),
          xhr: response
        };
      }, function () {
        return {
          action: name,
          data: response.text(),
          xhr: response
        };
      });
    },

    onError = function (response) {
      return Promise.reject(response instanceof Response ? {
        error: {
          action: name,
          code: '0021',
          msg: 'Failed to retrieve action'
        },
        xhr: response
      } : response);
    };

  if (!excludeBody.test(o.method) && isObject(payLoad)) {
    o.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    o.body = urlSerialize(payLoad);
  }

  if (!url) {
    return Promise.reject({
      error: {
        action: name,
        code: '0020',
        msg: 'Url is not provided for this action'
      }
    });
  } else if (o.method === 'GET' && !fetchOptions.force && this.linkRefs.hasOwnProperty(rawUrl)) {
    return Promise.resolve({
      action: name,
      data: this.linkRefs[rawUrl]
    });
  }

  return loadNetworkResource(url, o).then(onSuccess, onError);
};