/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../base/statistics.js");
require("../metric_registry.js");
require("./utils.js");
require("../../model/helpers/chrome_model_helper.js");
require("../../value/numeric.js");
require("../../value/value.js");

'use strict';

global.tr.exportTo('tr.metrics.sh', function() {
  var timeDurationInMs_smallerIsBetter =
      tr.v.Unit.byName.timeDurationInMs_smallerIsBetter;

  function findTargetRendererHelper(model) {
    var chromeHelper = model.getOrCreateHelper(
        tr.model.helpers.ChromeModelHelper);

    var largestPid = -1;
    for (var pid in chromeHelper.rendererHelpers) {
      var rendererHelper = chromeHelper.rendererHelpers[pid];
      if (rendererHelper.isChromeTracingUI)
        continue;
      if (pid > largestPid)
        largestPid = pid;
    }

    if (largestPid === -1)
      return undefined;

    return chromeHelper.rendererHelpers[largestPid];
  }

  function findNavigationStartEvent(rendererHelper) {
    var navigationStartEvent = undefined;

    rendererHelper.mainThread.sliceGroup.iterateAllEventsInThisContainer(
        () => true, function(ev) {
          if (navigationStartEvent !== undefined ||
              ev.category !== 'blink.user_timing')
            return;
          if (ev.title === 'navigationStart')
            navigationStartEvent = ev;
        },
        this);

    return navigationStartEvent;
  }

  function findFirstPaintEvent(rendererHelper, title, frame) {
    var firstPaintEvent = undefined;

    rendererHelper.process.iterateAllEvents(
        function(ev) {
          if (firstPaintEvent !== undefined ||
              ev.category !== 'blink.user_timing' ||
              ev.title !== title ||
              ev.args === undefined || ev.args['frame'] !== frame)
            return;

          firstPaintEvent = ev;
        }, this);

    return firstPaintEvent;
  }

  function firstPaintMetric(valueList, model) {
    var rendererHelper = findTargetRendererHelper(model);
    var navigationStartEvent = findNavigationStartEvent(rendererHelper);

    if (navigationStartEvent === undefined)
      throw new Error('Failed to find navigationStartEvent.');

    var frame = navigationStartEvent.args['frame'];
    var firstContentfulPaintEvent = findFirstPaintEvent(rendererHelper,
        'firstContentfulPaint', frame);
    if (firstContentfulPaintEvent === undefined)
      throw new Error(
          'Failed to find firstContentfulPaintEvent for frame ' + frame);

    var grouping_keys = {};

    var timeToFirstContentfulPaint =
        firstContentfulPaintEvent.start - navigationStartEvent.start;
    valueList.addValue(new tr.v.NumericValue(
        model.canonicalUrlThatCreatedThisTrace, 'firstContentfulPaint',
        new tr.v.ScalarNumeric(timeDurationInMs_smallerIsBetter,
            timeToFirstContentfulPaint),
        { description: 'time to first contentful paint' },
        grouping_keys));
  }

  firstPaintMetric.prototype = {
    __proto__: Function.prototype
  };

  tr.metrics.MetricRegistry.register(firstPaintMetric);

  return {
    firstPaintMetric: firstPaintMetric
  };
});
