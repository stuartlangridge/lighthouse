/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/* Note that this returns the innerText of the <body> element, not the HTML. */

const HTML = require('./html');

class HTMLWithoutJavaScript extends HTML {
  get name() {
    return 'htmlWithoutJavaScript';
  }

  afterSecondReloadPageLoad(options) {
    const driver = options.driver;

    this.artifact = {};
    return driver.sendCommand('Runtime.evaluate', {
      // note: we use innerText, not textContent, because textContent includes the content of <script> elements!
      expression: 'document.querySelector("body") ? ' +
          'document.querySelector("body").innerText : ""'
    })
    .then(evaluation => {
      this.artifact = evaluation.result.value;
    })
    .catch(_ => {
      this.artifact = {
        value: -1,
        debugString: 'Unable to get document body innerText'
      };
    });
  }
}

module.exports = HTMLWithoutJavaScript;
