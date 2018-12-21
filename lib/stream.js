/**
 * Safely streams and parses a JSON response
 * will reject, but keep original response/text if
 *  - Response is not valid json
 *  - Response has already been streamed
 * @param {Response} response Response object returned from fetch
 */
export function safeStreamJSON(response) {
  if (response && response instanceof Response && !response.bodyUsed) {
    return response.text()
      .then(function(text) {
        try {
          return JSON.parse(text);
        } catch (e) {
          return Promise.reject({
            data: text,
            error: {
              code: '0030',
              msg: 'Response is invalid JSON',
            }
          });
        }
      });
  }

  return Promise.reject({
    error: {
      code: '0031',
      msg: 'Stream already used',
    }
  });
}
