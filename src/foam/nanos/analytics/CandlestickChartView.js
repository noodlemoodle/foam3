/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.analytics',
  name: 'CandlestickChartView',
  extends: 'foam.u2.Element',

  implements: [ 'foam.mlang.Expressions' ],

  requires: [
    'foam.graphics.Box',
    'foam.graphics.Label',
    'foam.mlang.sink.Unique',
    'foam.mlang.sink.NullSink',
    'foam.nanos.analytics.Candlestick',
    'org.chartjs.Line2'
  ],

  messages: [
    {
      name: 'VIEW_HEADER',
      message: 'Candlestick Charting',
    },
    {
      name: 'MESSAGE_SELECT_DAO',
      message: 'Please select a Candlestick DAO'
    },
    {
      name: 'MESSAGE_SELECT_KEY',
      message: 'Please select a Candlestick key'
    }
  ],

  properties: [
    {
      class: 'Reference',
      of: 'foam.nanos.boot.NSpec',
      label: 'Candlestick DAO',
      name: 'candlestickDAOKey',
      documentation: `The Candlestick DAO to graph.`,
      targetDAOKey: 'AuthenticatedNSpecDAO',
      view: function(_, X) {
        var E = foam.mlang.Expressions.create();
        return {
          class: 'foam.u2.view.RichChoiceView',
          search: true,
          sections: [
            {
              heading: 'DAO',
              dao: X.AuthenticatedNSpecDAO
                .where(E.AND(
                  E.EQ(foam.nanos.boot.NSpec.SERVE, true),
//                  E.ENDS_WITH(foam.nanos.boot.NSpec.NAME, 'DAO'),
                  E.OR(
                    E.CONTAINS_IC(foam.nanos.boot.NSpec.NAME, "candlestick"),
                    E.IN(foam.nanos.boot.NSpec.NAME, [
                      'om1MinuteDAO',
                      'om5MinuteDAO',
                      'omHouryDAO',
                      'omDailyDAO'
                    ])
                  )
                ))
                .orderBy(foam.nanos.boot.NSpec.NAME)
            }
          ]
        };
      },
      postSet: function(oldValue, newValue) {
        this.refresh();
      }
    },

    // failes with Mutations not allowed in OUTPUT state
    {
      name: 'choices',
      class: 'String',
      value: [],
      visibility: 'HIDDEN'
    },
    {
      name: 'candlestickKey3',
      view: function(_, X) {
        // var choices = [];
        var choicesChanged = X.data.slot(function(candlestickDAOKey) {
          if ( candlestickDAOKey ) {
            var unique = this.Unique.create(this.Candlestick.KEY, this.NullSink.create({}));
            ctrl.__subContext__[candlestickDAOKey].
              orderBy(this.Candlestick.KEY).
              select(unique).then(function(sink) {
                var kv = [];
                unique.values.forEach(function(v, k) {
                  kv.put([k, v]);
                });
                kv.sort(function(a, b) {
                  return a.localeCompare(b);
                });
                // return kv;
                this.choices = kv;
              }).bind(this);
          }
          // return this.choices;
        });
        return foam.u2.view.ChoiceView.create({
          choices$: this.choices,
          placeholder: '--'
        });
      },
       postSet: function(oldValue, newValue) {
        this.refresh();
      }
    },
    {
      name: 'candlestickKey1',
      view: function(_, X) {
        var self = this;
        var choices = X.data.slot(function(candlestickDAOKey) {
          if ( candlestickDAOKey ) {
            return ctrl.__subContext__[candlestickDAOKey];
          }
          return foam.dao.ArrayDAO.create({});
        });
        return foam.u2.view.ChoiceView.create({
          objToChoice: function(candlestick) {
            return [candlestick.key, candlestick.key];
          },
          dao$: choices,
          placeholder: '--'
        });
      },
      postSet: function(oldValue, newValue) {
        this.refresh();
      }
    },
    {
      name: 'candlestickKey2',
      view: function(_, X) {
        var self = this;
        var choices = X.data.slot(function(candlestickDAOKey) {
          if ( candlestickDAOKey ) {
            return ctrl.__subContext__[candlestickDAOKey];
          }
          return foam.dao.ArrayDAO.create({});
        });
        return foam.u2.view.ChoiceView.create({
          objToChoice: function(candlestick) {
            return [candlestick.key, candlestick.key];
          },
          dao$: choices,
          placeholder: '--'
        });
      },
      postSet: function(oldValue, newValue) {
        this.refresh();
      }
    },
    {
      name: 'canvas',
      factory: function() {
        return this.Box.create({
          width: 1400,
          height: 700
        });
      },
      visibility: 'RO'
    },
    {
      name: 'chart',
      class: 'FObjectProperty',
      of: 'foam.graphics.CView',
      visibility: 'HIDDEN'
    }
  ],

  methods: [
    async function render() {
      this.SUPER();
      
      this.buildChartData().then(function(data) {
        this.chart = this.Line2.create({
          data: data
        });
        this.canvas.add(this.chart);
      }.bind(this));

      this.addClass(this.myClass());
      this
        .start(this.Cols).addClass(this.myClass('header'))
        .start().addClass(this.myClass('title'))
        .add(this.VIEW_HEADER)
        .end()
        .end();

      this
        .start(this.Cols).addClass(this.myClass('container-selectors'))
        .startContext({data: this})
        .start().addClass(this.myClass('selector'))
        .add(this.CANDLESTICK_DAOKEY.__)
        .add(this.CANDLESTICK_KEY1.__)
        // .add(this.CANDLESTICK_KEY2.__)
        // .add(this.CANDLESTICK_KEY3.__)
        .end()
        .end()
        .end();

      this.
        start('div', null, this.canvasContainer$).addClass(this.myClass('canvas-container')).
        add(this.canvas).
        end();
    },

    async function buildChartData() {
      // TODO: review if labels actually match dataset data
      var labels = new Map();
      var datasets = new Map();

      if ( this.candlestickDAOKey &&
           ( this.candlestickKey1 ||
             this.candlestickKey2 ) ) {
        var dao = ctrl.__subContext__[this.candlestickDAOKey];
        dao = dao.where(this.OR(
          this.EQ(this.Candlestick.KEY, this.candlestickKey1 || ''),
          this.EQ(this.Candlestick.KEY, this.candlestickKey2 || '')
        ));
        dao = dao.orderBy(this.Candlestick.CLOSE_VALUE_TIME);

        let sink = await dao.select();
        let arr = sink.array;
        for ( let i = 0; i < arr.length; i++ ) {
          let c = arr[i];
          labels.set(c.closeValueTime.getTime(), c.closeValueTime);
          var dataset = datasets.get(c.key);
          if ( ! dataset ) {
            dataset = {
              label: c.key,
              data: [],
              fill: false,
              borderColor: 'hsl('+(300/(i+1))+',100%,50%)',
              tension: 0.1
            }
            datasets.set(c.key, dataset);
          }
          var data = dataset['data'];
          data.push(c.total);
        }
      }

      let config = {
        labels: [...labels.values()].sort(),
        datasets: [...datasets.values()]
      };

      return config;
    },
    async function refresh() {
      this.buildChartData().then(function(data) {
        this.chart.data = data;
      }.bind(this));
    }
  ]
});
