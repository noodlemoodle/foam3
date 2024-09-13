/**
 * @license
 * Copyright 2023 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.wizard.wizardflow',
  name: 'AddCapabilityHierarchy',
  implements: ['foam.core.ContextAgent'],
  imports: [
    'wizardlets'
  ],
  requires: [
    'foam.u2.crunch.wizardflow.CapabilityAdaptAgent',
    'foam.u2.wizard.agents.RootCapabilityAgent',
    'foam.u2.crunch.wizardflow.LoadCapabilitiesAgent',
    'foam.u2.crunch.wizardflow.LoadCapabilityGraphAgent',
    'foam.u2.crunch.wizardflow.WAOSettingAgent',
    'foam.u2.crunch.wizardflow.GraphWizardletsAgent',
    'foam.u2.crunch.wizardflow.PublishToWizardletsAgent',
    'foam.util.async.Sequence',
  ],
  properties: [
    {
      class: 'String',
      name: 'capability'
    },
    {
      class: 'Enum',
      of: foam.u2.wizard.WizardType,
      name: 'type'
    }
  ],
  static: [
    function getImpliedId (args) {
      return this.id + '_' + args.capability;
    }
  ],
  methods: [
    async function execute (x) {
      x = x || this.__context__;
      const seq = this['createSequence_' + this.type.name](x);

      subX = await seq.execute();
      // Limitation: two different heirarchies can not depend on each other as their wizardlets are loaded in different contexts
      // Current solution is to add them to one larger heirarchy and then add that to the wizard flow
      // TODO: fix
      this.wizardlets.push(...subX.wizardlets);
      // .forEach(w => w.__subContext__.wizardlets$.follow(this.wizardlets_$));
    },

    function createSequence_TRANSIENT (x) {
      if ( ! this.__subContext__.capable$ ) {
        const capable = foam.nanos.crunch.lite.BaseCapable.create();
        x = x || this.__subContext__;
        x = x.createSubContext({ capable });
      }

      return this.Sequence.create({}, x)
        .add(this.RootCapabilityAgent, {
          rootCapability: this.capability
        })
        .add(this.CapabilityAdaptAgent)
        .add(this.LoadCapabilitiesAgent)
        .add(this.LoadCapabilityGraphAgent)
        .add(this.WAOSettingAgent, {
          waoSetting: this.WAOSettingAgent.WAOSetting.CAPABLE
        })
        .add(this.GraphWizardletsAgent)
        .add(this.PublishToWizardletsAgent, { event: 'onReady' })
        ;
    },

    function createSequence_UCJ (x, waoSetting) {
      if ( ! this.__subContext__.capable$ ) {
        const capable = foam.nanos.crunch.lite.BaseCapable.create();
        x = x || this.__subContext__;
        x = x.createSubContext({ capable });
      }
      return this.Sequence.create({}, x)
        .add(this.RootCapabilityAgent, {
          rootCapability: this.capability
        })
        .add(this.CapabilityAdaptAgent)
        .add(this.LoadCapabilitiesAgent)
        .add(this.LoadCapabilityGraphAgent)
        .add(this.WAOSettingAgent, {
          waoSetting: waoSetting || this.WAOSettingAgent.WAOSetting.UCJ
        })
        .add(this.GraphWizardletsAgent)
        .add(this.PublishToWizardletsAgent, { event: 'onReady' })
        ;
    },

    function createSequence_UCJ_SIMPLE (x) {
      return this.createSequence_UCJ(x, this.WAOSettingAgent.WAOSetting.UCJ_SIMPLE)
    }
  ]
});
