/**
 * @license
 * Copyright 2019 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.layout',
  name: 'SectionAxiom',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      name: 'title',
      expression: function(name) {
        if ( name === '_defaultSection' ) return '';
        return foam.String.labelize(name);
      }
    },
    {
      name: 'subTitle'
    },
    {
      class: 'String',
      name: 'help'
    },
    {
      class: 'Int',
      name: 'order',
      value: Number.MAX_VALUE
    },
    {
      class: 'Boolean',
      name: 'permissionRequired'
    },
    {
      name: 'gridColumns'
    },
    {
      class: 'Function',
      name: 'isAvailable',
      value: function() { return true; }
    },
    {
      class: 'String',
      name: 'section',
      getter: function() { return this.section_ ; },
      setter: function(m) { this.section_ = m; }
    },
    {
      class: 'Simple',
      name: 'section_'
    }
  ],

  methods: [
    function createIsAvailableFor(data$) {
      var self = this;
      var slot = foam.core.ExpressionSlot.create({
        obj$: data$,
        code: this.isAvailable
      });
      if ( this.permissionRequired ) {
        var permSlot = foam.core.SimpleSlot.create({value: false});
        var update = function() {
          var data = data$.get();
          if ( data && data.__subContext__.auth ) {
            data.__subContext__.auth.check(null,
              `${data.cls_.id.toLowerCase()}.section.${self.name}`).then((hasAuth) => {
                permSlot.set(hasAuth);
              });
          }
        };
        update();
        data$.sub(update);
        slot = foam.core.ArraySlot.create({slots: [slot, permSlot]}).map(arr => {
          return arr.every(b => b);
        });
      }
      return slot;
    },

    function installInClass(cls) {
      cls['SECTION_'+foam.String.constantize(this.name)] = this; //cls[this.name] = this.name;
      //foam.String.constantize('fooBar')

      // Object.defineProperty(
      //   cls,
      //   'sections22',//this.name,
      //   {
      //     value: this.sections,
      //     configurable: false
      //   });
       /* */
    },

//     function installInProto(proto) {
//       var name = this.name;
//       Object.defineProperty(
//         proto,
//         this.name,
//         {
//           get: function() { return this.cls_[name] },
//           configurable: false
//         });
//     },
  ]
});


foam.CLASS({
  package: 'foam.layout',
  name: 'PropertySectionRefine',
  refines: 'foam.core.Property',

  properties: [
    {
      class: 'String',
      name: 'section',
      value: '_defaultSection'
    }
  ]
});


foam.CLASS({
  package: 'foam.layout',
  name: 'ActionSectionRefine',
  refines: 'foam.core.Action',

  properties: [
    {
      class: 'String',
      name: 'section',
      value: '_defaultSection'
    }
  ]
});


foam.CLASS({
  package: 'foam.layout',
  name: 'ModelSectionRefine',
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'foam.layout.SectionAxiom',
      name: 'sections'
    }
  ]
});
