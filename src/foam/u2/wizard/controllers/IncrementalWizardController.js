/**
 * @license
 * Copyright 2022 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.wizard.controllers',
  name: 'IncrementalWizardController',
  extends: 'foam.u2.wizard.controllers.WizardController',

  requires: [
    'foam.u2.wizard.axiom.WizardAction'
  ],

  issues: [
    'should not depend on legacy controller'
  ],

  properties: [
    {
      name: 'data',
      documentation: 'legacy controller',
      postSet: function (_, v) {
        this.currentWizardlet$ = v.currentWizardlet$;
        this.currentSection$ = v.currentSection$;
      }
    },
    'currentWizardlet',
    'currentSection',
    {
      name: 'backDisabled',
      class: 'Boolean',
      value: false
    },
    {
      class: 'Boolean',
      name: 'isLoading_',
      documentation: `Condition to synchronize code execution and user response.`,
      value: false
    },
    {
      class: 'FObjectArray',
      of: 'foam.core.Action',
      name: 'actionBar',
      getter: function () {
        const currentWizardlet = this.currentWizardlet;
        let wizardletActions = currentWizardlet.cls_.getAxiomsByClass(this.WizardAction);

        let goNextAction = this.GO_NEXT;
        let goPrevAction = this.GO_PREV;
        const actionBar = [];

        for ( let action of wizardletActions ) {
          if ( action.name === 'goNext' ) {
            goNextAction = action;
            continue;
          }
          if ( action.name === 'goPrev' ) {
            goPrevAction = action;
            continue;
          }
          actionBar.push(action);
        }
        actionBar.push(goPrevAction, goNextAction);

        return actionBar;
      }
    }
  ],

  actions: [
    {
      name: 'saveAndClose',
      label: 'Save and exit',
      code: function(x) {
        this.data.saveProgress().then(() => {
          this.onClose({});
        }).catch(e => {
          console.error(e);
          x.ctrl.notify(this.ERROR_MSG_DRAFT, '', this.LogLevel.ERROR, true);
        });
      }
    },
    {
      name: 'goPrev',
      label: 'Back',
      isEnabled: function (data$canGoBack) {
        return data$canGoBack;
      },
      isAvailable: function (backDisabled, isLoading_) {
        return ! backDisabled && ! isLoading_;
      },
      code: function() {
        this.data.back();
      }
    },
    {
      name: 'goNext',
      label: 'Next',
      buttonStyle: 'PRIMARY',
      isEnabled: function (data$canGoNext, isLoading_) {
        return data$canGoNext && ! isLoading_;
      },
      isAvailable: function (isLoading_) {
        return ! isLoading_;
      },
      code: function(x) {
        this.isLoading_ = true;
        this.data.next().then((isFinished) => {
          if ( isFinished ) {
            this.onClose({ completed: true })
          }
        }).catch(e => {
          console.error(e);
          x.ctrl.notify(this.ERROR_MSG, '', this.LogLevel.ERROR, true);
        }).finally(() => {
          this.isLoading_ = false;
        });
      }
    }
  ]
});