/**
 * @license
 * Copyright 2023 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.crunch',
  name: 'WizardRunner',
  imports: ['crunchController'],
  issues: [
    'when source is a capability it should create a WizardFlow'
  ],
  requires: [
    'foam.u2.wizard.WizardType',
    'foam.u2.wizard.wizardflow.WizardFlow'
  ],
  properties: [
    {
      class: 'Enum',
      of: 'foam.u2.wizard.WizardType',
      name: 'wizardType'
    },
    {
      name: 'source',
      documentation: `
        Either a capability, string, or WizardFlow
      `
    }
  ],
  methods: [
    async function launch(x) {
      x = x || this.__context__;

      const IN_PROGRESS = this.crunchController.WizardStatus.IN_PROGRESS;

      const parentWizard = this.getParentWizard_();
      const isInline = !! parentWizard;

      const seq = this.getSequence_(x, isInline);

      let returnPromise = null;

      if ( isInline ) {
        returnPromise = new Promise(rslv => {
          parentWizard.status$.sub(() => {
            if ( parentWizard.status != IN_PROGRESS ) rslv();
          })
        })

        await this.crunchController.inlineWizardFromSequence(parentWizard, seq);
        return returnPromise;
      }

      await seq.execute();
    },
    function launchNotInline_ () {
      const seq = this.sequenceFromWizardType_();
    },
    function getParentWizard_ () {
      const lastWizard = this.crunchController.lastActiveWizard;
      if ( ! lastWizard ) return null;
      if ( lastWizard.status !== this.crunchController.WizardStatus.IN_PROGRESS ) {
        return null;
      }
      return lastWizard;
    },
    function getSequence_ (x, isInline) {
      if ( ! this.WizardFlow.isInstance(this.source, isInline) ) {
        return this.getSequenceFromCapability_(x);
      }

      if ( isInline ) {
        return this.crunchController.toWizardFlowSequence(
          this.crunchController.createInlineWizardSequence(x)
        ).add(this.source);
      }

      return this.crunchController.createWizardFlowSequence(x)
        .addBefore('ShowPreexistingAgent', this.source);
    },
    function getSequenceFromCapability_ (x, isInline) {
      const wizardType = this.wizardType;

      if ( isInline && wizardType == this.WizardType.UCJ ) {
        const seq = this.crunchController.createUCJInlineWizardSequence(x);
        seq.addBefore('CapabilityAdaptAgent', {
          class: 'foam.u2.wizard.agents.RootCapabilityAgent',
          rootCapability: this.source
        });
        return seq;
      }

      if ( ! isInline && wizardType == this.WizardType.UCJ ) {
        return this.crunchController
          .createTransientWizardSequence(this.__subContext__)
          .addBefore('ConfigureFlowAgent', {
            class: 'foam.u2.wizard.agents.RootCapabilityAgent',
            rootCapability: this.source
          })
          .reconfigure('WAOSettingAgent', {
            waoSetting: foam.u2.crunch.wizardflow.WAOSettingAgent.WAOSetting.UCJ
          })
          .remove('RequirementsPreviewAgent')
      }

      console.error(
        '%cAre you configuring a new wizard?%c%s',
        'color:red;font-size:30px', '',
        'you need to add explicit support for ' +
          (isInline ? 'inline-' : '')+wizardType.name +
          ' wizards in WizardRunner.js; ' +
          'or wait for Eric to finish refactoring sequences'
      );
      throw new Error('getSequence_ has no implementation for this', {
        isInline, wizardType
      });
    }
  ]
});
