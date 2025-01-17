/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.wizard.views',
  name: 'FocusWizardView',
  extends: 'foam.u2.View',

  imports: [
    'controlBorder?',
    'popup?'
  ],

  exports: [ 'showTitle' ],

  css: `
    ^ {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      height: 100%;
      /**
       * Make this work with conditional titles
       * gap: 1.6rem;
      */
    }

    ^:not(^isFullscreen) {
      margin: 0 40pt;
    }

    ^contents {
      flex: 1;
      min-height: 0;
    }
    ^wizardletTitle {
      text-align: center;
      margin-bottom: 2.4rem;
    }
    ^wizardletSub {
      font-size: 1.6rem;
    }
  `,

  properties: [
    {
      class: 'foam.u2.ViewSpec',
      name: 'contentsView',
      value: {
        class: 'foam.u2.wizard.views.FlexibleWizardContentsView'
      }
    },
    {
      class: 'Boolean',
      name: 'showTitle'
    },
    {
      class: 'String',
      name: 'viewTitle',
      expression: function (showTitle, data$currentWizardlet) {
        return showTitle && data$currentWizardlet.showTitle ? data$currentWizardlet.title : '';
      }
    }
  ],

  methods: [
    function init() {
      if ( this.controlBorder && foam.u2.Progressable.isInstance(this.data) ) {
        this.controlBorder.progressMax$ = this.data$.dot('progressMax');
        this.controlBorder.progressValue$ = this.data$.dot('progressValue');
      }
    },
    function render() {
      const self = this;
      this.addClass()
        .enableClass(this.myClass('isFullscreen'), this.popup?.fullscreen$)
        .add(this.slot(function (controlBorder, showTitle, data$currentWizardlet) {
          return showTitle && data$currentWizardlet.showTitle && ! controlBorder ?
            this.E().start()
              .addClasses(['h300', self.myClass('wizardletTitle')])
              .add(data$currentWizardlet.title)
            .end() : null
        }))
        .add(this.slot(function (data$currentWizardlet) {
          return data$currentWizardlet.subTitle ?
            this.E().start()
              .addClasses([self.myClass('wizardletTitle'), 'p', self.myClass('wizardletSub')])
              .tag(foam.u2.HTMLView.create({ nodeName: 'div', data: data$currentWizardlet.subTitle }))
            .end() : null
        }))
        .start(this.contentsView, { data: this.data })
          .addClass(this.myClass('contents'))
        .end()
        ;
    }
  ]
});
