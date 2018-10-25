import deepExtend from '../lib/extend';
import { defaultOptions } from './common';

/**
 * Load a network resource, with added timeout & HTTP Status code processing
 * @param {String} url
 * @param {Object} fetchOptions - Options to pass to fetch
 */
export function load(url, fetchOptions) {
  var o = deepExtend({}, defaultOptions.xhr, fetchOptions);

  return Promise.race([
    xhrTimeout(fetchOptions.timeout || 60000),
    fetch(url, o)
  ]).then(xhrStatus);
}

/**
 * Checks if the given parameter is an Object
 * @param {Object} value
 */
export function isObject(value) {
  return !!value && {}.toString.call(value) === '[object Object]';
}

/**
 * Handles HTTP Status codes, rejecting if it is a non-200
 * @param {Object} response
 */
export function xhrStatus(response) {
  return (response.status >= 200 && response.status < 300) ? response :
    Promise.reject(response instanceof Response ? response : new Response('', {
      status: 503,
      statusText: 'Possible CORS error'
    }));
}

/**
 * Creates a promise that will reject with a timeout error
 * @param {Number} timeout - milliseconds
 */
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

/**
 * Converts object to serialized string for concating to url
 * @param {Object} obj - object to serialize
 */
export function urlSerialize(obj) {
  return Object.keys(obj).map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
  }).join('&');
}
