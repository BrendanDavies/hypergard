// TODO: Dynamically pull from package.json
export var version = '4.0.0';

/**
 * Default Hypergard Options
 */
export var defaultOptions = {
  preloadHomepage: true,
  cacheHomepage: false,
  debug: false,
  xhr: {
    headers: {
      Accept: 'application/hal+json, application/json, */*; q=0.01',
      'X-HyperGard': version
    }
  }
};

/**
 * Regex for HTTP Methods with no Body
 */
export var excludeBody = /^(head|get)$/i;
/**
 * Regex for `hypermedia` reserved properties
 */
export var excludedProps = /^(_embedded|_links|_forms)$/;
