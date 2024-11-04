/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.mlang',
  name: 'ExprProperty',
  extends: 'FObjectProperty',

  flags: [],
  documentation: 'Property for Expr values.',

  properties: [
    {
      name: 'adapt',
      value: function(_, o, p) { return p.adaptValue(o); }
    },
    {
      name: 'of',
      value: 'foam.mlang.Expr'
    },
    ['javaJSONParser', 'foam.lib.json.ExprParser.instance()'],
    {
      name: 'view',
      value: {
        class: 'foam.u2.view.FObjectView',
        of: 'foam.mlang.Expr'
      }
    }
  ],

  methods: [
    function adaptValue(o) {
      if ( o === null )                           return foam.mlang.Constant.create({ value: null });
      if ( ! o.f && typeof o === 'function' )     return foam.mlang.predicate.Func.create({ fn: o });
      if ( typeof o !== 'object' )                return foam.mlang.Constant.create({ value: o });
      if ( o instanceof Date )                    return foam.mlang.Constant.create({ value: o });
      if ( Array.isArray(o) )                     return foam.mlang.Constant.create({ value: o });
      if ( foam.core.AbstractEnum.isInstance(o) ) return foam.mlang.Constant.create({ value: o });
      if ( foam.core.FObject.isInstance(o) ) {
           // TODO: Not all mlang expressions actually implement Expr
           // so we're just going to check for o.f
           //  ! foam.mlang.Expr.isInstance(o) )
        if ( ! foam.Function.isInstance(o.f) )      return foam.mlang.Constant.create({ value: o });
        return o;
      }
      if ( o.class && this.__context__.maybeLookup(o.class) ) {
        return this.adaptValue(this.__context__.lookup(o.class).create(o, this.__subContext__));
      }
      if ( foam.core.FObject.isSubClass(o) ) {
        return foam.mlang.Constant.create({ value: o });
      }

      console.error('Invalid expression value: ', o);
    }
  ]
});
