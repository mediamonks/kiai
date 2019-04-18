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
 * This file adds some utility functions to dealing with SSML.
 * @namespace SsmlUtil
 */
export default {
  /**
   * Merge to strings, encapsulated by 'speak-tags', together
   * @name SsmlUtil.merge
   * @function
   * @param {Array<string>} strings
   * @return {string}
   */
  merge: (...strings) => {
    return `<speak>${strings.map((entry) => entry).
      join(' ').
      replace(/<speak>|<\/speak>|/gi, '')}</speak>`;
  },

  /**
   * Clean an SSML string. Removes spaces between braces.
   * @name SsmlUtil.clean
   * @function
   * @param {string} string
   * @return {string}
   */
  clean: (string) => {
    return string
      .replace(/(\s+)</g, '<')
      .replace(/>(\s+)/g, '>')
      .replace(/\s\s+/, ' ');
  },
};
