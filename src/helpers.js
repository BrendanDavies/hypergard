import deepExtend from '../lib/extend';
import { defaultOptions } from './common';

function load(url, fetchOptions) {
  var o = deepExtend({}, defaultOptions.xhr, fetchOptions);

  return Promise.race([
    xhrTimeout(fetchOptions.timeout || 60000),
    fetch(url, o)
  ]).then(xhrStatus);
}

export function isObject(value) {
  return !!value && {}.toString.call(value) === '[object Object]';
}

export function xhrStatus(response) {
  return (response.status >= 200 && response.status < 300) ? response :
    Promise.reject(response instanceof Response ? response : new Response('', {
      status: 503,
      statusText: 'Possible CORS error'
    }));
}

export function xhrTimeout(timeout) {
  return new Promise(function (res, rej) {
    setTimeout(function () {
      rej({
        error: {
          code: '0011',
          msg: 'Fetch timeout',
          timeout: timeout
        }
      });
    }, timeout);
  });
}

export var loadNetworkResource = load;

export function urlSerialize(obj) {
  return Object.keys(obj).map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
  }).join('&');
}

/**
 * Will wrap any fetch performed in supplied middleware
 * This will allow custom logging headers to be set without
 * using before/after fetch events
 * @param {Function} middleware Function to wrap fetches in
 */
export function applyMiddleware(middleware) {
  loadNetworkResource = (function (stack) {
    return function (url, fetchOptions) {
      return middleware(url, fetchOptions, stack);
    };
  })(loadNetworkResource);
}