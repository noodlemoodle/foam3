/**
* @license
* Copyright 2024 The FOAM Authors. All Rights Reserved.
* http://www.apache.org/licenses/LICENSE-2.0
*/

foam.CLASS({
  package: 'foam.u2.stack',
  name: 'BreadcrumbManager',
  documentation: ``,
  imports: [
    'document',
    'stack',
    'theme'
  ],
  classes: [
    {
      name: 'Breadcrumb',
      imports: ['window', 'document', 'stack'],
      properties: ['title', 'position', 'parent', 'view'],
      methods: [
        function go() {
          this.stack?.jump(this.view.__subContext__.stackPos);
          this.view.routeToMe();
          this.parent.pos = this.position;
        }
      ],
      listeners: [
        function remove() {
          if ( this.parent.pos >= this.position )
            this.parent.pos = this.position - 1;
        }
      ]
    }
  ],
  properties: [
    {
      class: 'Array',
      name: 'crumbs'
    },
    ['pos', -1],
    {
      name: 'current'
    }
  ],
  methods: [
    function init() {
      this.stack.stackReset.sub(() => { this.crumbs = []; this.pos = -1; })
    },
    function push(view) {
      foam.assert(foam.u2.Routable.isInstance(view), 'Can not add crumb for non-routable view');
      let c = this.Breadcrumb.create({ parent: this });
      c.view = view;
      c.title$.follow(view.viewTitle$);
      let pos = this.pos;
      pos++;
      if ( this.crumbs[pos] )
          this.crumbs.splice(pos);
      view.onDetach(c.remove);
      this.crumbs[pos] = c;
      this.pos = c.position = pos;
      view.setPrivate_('crumb', c);
    }
  ],
  listeners: [
    {
      name: 'getCurrent',
      isFramed: true,
      on: ['this.propertyChange.crumbs', 'this.propertyChange.pos'],
      code: function() {
        this.current = this.crumbs[this.pos];
      }
    }
  ]
});
