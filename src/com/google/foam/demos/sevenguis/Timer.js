/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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

foam.CLASS({
  package: 'com.google.foam.demos.sevenguis',
  name: 'Timer',
  extends: 'foam.u2.Element',

  exports: [ 'as data' ],

  requires: [
    'foam.u2.ProgressView',
    'foam.u2.RangeView'
  ],

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        ^ { padding: 10px !important; font-size: 18px; }
        ^ .elapsed { margin-top: 10px; }
        ^ .label { display: inline-block; width: 130px; }
        ^ button { width: 332px !important; margin-top: 16px !important; }
        ^ input { margin-left: 12px; }
        ^ .foam-u2-RangeView- { width: 182px; }
        ^ row { display: block; height: 30px; }
      */}
    })
  ],

  properties: [
    {
      name: 'progress',
      label: 'Elapsed Time',
      expression: function(duration, elapsedTime) {
        // TODO: this isn't working
// console.log('*************');
        return this.duration ? 100 * Math.min(1, 1000 * this.elapsedTime / this.duration) : 100;
      },
      toPropertyE: function(X) {
        return X.lookup('foam.u2.ProgressView').create(null, X);
      }
//      toPropertyE: 'foam.u2.ProgressView'
    },
    {
      name: 'elapsedTime',
      // units: 's',
      label: '',
      value: 0
    },
    {
      class: 'Int',
      name: 'duration',
      units: 'ms',
      toPropertyE: function(X) {
        return X.lookup('foam.u2.RangeView').create({maxValue: 10000}, X);
      },
      value: 5000
    },
    {
      name: 'lastTick_',
      hidden: true,
      value: 0
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      this.duration$.sub(this.tick);
      this.tick();
    },

    function initE() {
      this.
        cssClass(this.myCls()).
        start('row').start('span').cssClass('label').add('Elapsed Time:', this.PROGRESS).end().
        start('row').cssClass('elapsed').add(this.elapsedTime$.map(function(t) { return t.toFixed(1); })).end().
        start('row').start('span').cssClass('label').add('Duration:', this.DURATION).end().end().
        add(this.RESET);
    }
  ],

  actions: [
    function reset() {
      this.elapsedTime = this.lastTick_ = 0;
      this.tick();
    }
  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function() {
// console.log('tick', this.progress, this.elapsedTime, this.duration, this.lastTick_);
        if ( 1000 * this.elapsedTime >= this.duration ) return;
        var now = Date.now();
        if ( this.lastTick_ ) this.elapsedTime += (now - this.lastTick_)/1000;
        this.elapsedTime = Math.min(this.duration/1000, this.elapsedTime);
        this.progress = this.duration ? 100 * Math.min(1, 1000 * this.elapsedTime / this.duration) : 100;
        this.lastTick_ = now;
        this.tick();
      }
    }
  ]
});
