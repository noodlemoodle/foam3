/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.view',
  name: 'OptionalFObjectView',
  extends: 'foam.u2.Controller',

  documentation: 'View for editing FObjects we can be undefined.',

  properties: [
    {
      class: 'Boolean',
      name: 'defined',
      postSet: function(o, n) {
        if ( ! o && n && ! this.data ) {
          this.data = this.oldData || this.of.create();
          console.log('***** CREATING: ', this.of.id, this.data);
        } else if ( o && ! n ) {
          this.oldData = this.data;
          this.data = null;
        }
      }
    },
    {
      name: 'data',
      postSet: function(o, n) {
        this.instance_.defined = !! n; 
      }
//      view: function() { return { class: 'foam.u2.DetailView' } }
    },
    'oldData',
    {
      name: 'of'
    }
  ],

  methods: [
    function fromProperty(prop) {
      this.of = prop.of;
    },

    function render() {
      this.SUPER();
      this.tag(this.DEFINED).tag({class: 'foam.u2.DetailView', data$: this.data$});
    }
  ]
});