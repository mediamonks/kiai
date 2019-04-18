// Copyright 2018, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Utility functions to deal with objects.
 * @namespace ObjectUtil
 */
const ObjectUtil = {
  /**
   * The maximum object-depth that should be traverse-able.
   */
  MAX_LEVEL: 10,

  /**
   * Clean an object from undefined, null and empty values.
   * @param {Object} obj
   * @param {number} level
   * @return {Object}
   */
  clean: (obj, level = 0) => {
    for (const prop in obj) {
      if (ObjectUtil.isEmpty(obj[prop])) {
        delete obj[prop];
      } else if (typeof obj[prop] === 'object' && level < ObjectUtil.MAX_LEVEL) {
        obj[prop] = ObjectUtil.clean(obj[prop], ++level);
      }
    }

    // Re-parse/stringify it to remove everything undefined
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Run the "clean" function a set amount of times
   * @param {Object} obj
   * @param {number} [iterations]
   * @return {Object}
   */
  iterativeClean: (obj, iterations = 0) => {
    for (let i = 0; i < iterations; ++i) {
      obj = ObjectUtil.clean(obj);
    }

    return obj;
  },

  /**
   * Run the "clean" function for the entire depth of the object
   * @param {Object} obj
   * @return {Object}
   */
  deepClean: (obj) => {
    return ObjectUtil.iterativeClean(obj, ObjectUtil.depth(obj));
  },

  /**
   * Check if the value of an object is useless.
   * @param {Object} value
   * @return {boolean}
   */
  isEmpty(value) {
    if (value === null) value = undefined;
    if (typeof value === 'object' && Object.keys(value).length <= 0) return true;
    return (value === '' || value === undefined || value === null);
  },

  /**
   * Calculate the full depth of an object
   * @param {Object} obj
   * @return {number}
   */
  depth(obj) {
    let level = 1;
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const depth = ObjectUtil.depth(obj[key]) + 1;
        level = Math.max(depth, level);
      }
    }
    return level;
  },

  /**
   * Stringify object and optionally exclude specific keys' values.
   * @param {Object} obj - Target to stringify.
   * @param  {...string} exclude - List of keys to exclude from resolving stringified value.
   * @return {string} - Stringified target.
   */
  stringify(obj, ...exclude) {
    const excluded = new Set(exclude);
    const filtered = Object.keys(obj).reduce((out, key) => {
      if (excluded.has(key)) {
        out[key] = '[Excluded]';
      } else {
        const value = obj[key];
        try {
          JSON.stringify(value);
          out[key] = value;
        } catch (err) {
          out[key] = err.message === 'Converting circular structure to JSON' ?
          '[Circular]' : `[Stringify Error] ${err}`;
        }
      }
      return out;
    }, {});
    return JSON.stringify(filtered, null, 2);
  },
};

export default ObjectUtil;
