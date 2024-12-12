/**
 * @license
 * Copyright 2024 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'UserLifecycleTicket',
  extends: 'foam.nanos.ticket.Ticket',

  documentation: `Ticket to coordinate the changing of a User's lifecycle state.  Changing to 'DELETED', for example, will also mark associated UCJs as deleted.`,

  implements: [
    'foam.mlang.Expressions'
  ],

  javaImports: [
    'foam.dao.DAO',
    'foam.nanos.auth.User',
    'java.util.ArrayList',
    'java.util.List'
  ],

  imports: [
    'userDAO',
    'sessionDAO'
  ],

  requires: [
    'foam.nanos.auth.User',
    'foam.nanos.session.Session'
  ],

  properties: [
    {
      name: 'status',
      order: 5,
      createVisibility: 'HIDDEN'
    },
    {
      name: 'statusChoices',
      hidden: true,
      factory: function() {
        var s = [];
        if ( 'CLOSED' == this.status ) {
          s.push(['CLOSED', 'CLOSED']);
          s.push(['OPEN', 'OPEN']);
        } else {
          s.push(this.status);
          s.push(['CLOSED', 'CLOSED']);
        }
        return s;
      }
    },
    {
      name: 'comment',
      order: 6
    },
    {
      name: 'createdFor',
      gridColumns: '12'
    },
    {
      name: 'state',
      hidden: true,
      transient: true
    },
    {
      name: 'currentLifecycleState',
      class: 'foam.core.Enum',
      of: 'foam.nanos.auth.LifecycleState',
      value: foam.nanos.auth.LifecycleState.PENDING,
      transient: true,
      visibility: 'RO',
      section: 'infoSection',
      order: 7,
      gridColumns: 6,
      view: function(_, X) {
        X.data.state = foam.nanos.auth.LifecycleState.PENDING;
        if ( ! X.data.createdFor ) {
          X.data.createdFor$.sub(function() {
            X.userDAO.find(X.data.createdFor).then(function(user) {
              X.data.state = user.lifecycleState;
            });
            X.sessionDAO.find(X.data.EQ(X.data.Session.USER_ID, X.data.createdFor)).then(function(session) {
              if ( ! session )
                return;
              X.data.loggedIn = session.uses > 0 && session.remoteHost;
              X.data.lastActivity = Date.now() - session.lastUsed.getTime();
            });
          });
        } else {
          X.userDAO.find(X.data.createdFor).then(function(user) {
            X.data.state = user.lifecycleState;
          });
          X.sessionDAO.find(X.data.EQ(X.data.Session.USER_ID, X.data.createdFor)).then(function(session) {
            if ( ! session )
              return;
            X.data.loggedIn = session.uses > 0 && session.remoteHost;
            X.data.lastActivity = Date.now() - session.lastUsed.getTime();
          });
        }
        return {
          class: 'foam.u2.view.ReadOnlyEnumView',
          of: 'foam.nanos.auth.LifecycleState',
          data$: X.data.state$
        };
      }
    },
    {
      name: 'requestedLifecycleState',
      class: 'foam.core.Enum',
      of: 'foam.nanos.auth.LifecycleState',
      value: foam.nanos.auth.LifecycleState.DELETED,
      section: 'infoSection',
      order: 8,
      gridColumns: 6
    },
    {
      name: 'includeRelationships',
      class: 'Boolean',
      value: true,
      section: 'infoSection',
      order: 9,
      gridColumns: 6
    },
    {
      name: 'revertRelationships',
      class: 'Boolean',
      section: 'infoSection',
      order: 10,
      gridColumns: 6,
      createVisibility: 'RO',
      readVisibility: 'RO',
      updateVisibility: function(includeRelationships, updated) {
        return ( includeRelationships && updated && updated.length > 0 ) ? foam.u2.DisplayMode.RW : foam.u2.DisplayMode.DISABLED;
      }
    },
    {
      name: 'loggedIn',
      class: 'Boolean',
      value: false,
      transient: true,
      visibility: 'RO',
      section: 'infoSection',
      order: 11,
      gridColumns: 6
    },
    {
      name: 'lastActivity',
      class: 'Duration',
      transient: true,
      visibility: 'RO',
      section: 'infoSection',
      order: 12,
      gridColumns: 6
    },
    {
      name: 'message',
      class: 'String',
      createVisibility: 'HIDDEN',
      updateVisibility: 'RO',
      readVisibility: 'RO',
      section: 'infoSection',
      order: 13,
      gridColumns: 12
    },
    {
      name: 'updated',
      class: 'List',
      javaFactory: 'return new ArrayList();',
      createVisibility: 'HIDDEN',
      readVisibility: 'RO',
      updateVisibility: 'RO',
      section: 'infoSection',
      order: 14,
      gridColumns: 12
    },
    {
      documentation: 'Holds copy of last updated list for undo processing',
      name: 'current',
      class: 'List',
      transient: true,
      hidden: true
    },
    {
      name: 'assignedTo',
      hidden: true
    },
    {
      name: 'assignedToGroup',
      hidden: true
    },
    {
      name: 'externalComment',
      hidden: true
    }
  ],

  actions: [
    {
      // NOTE: Ticket.close uses TicketCloseCommand which doesn't allow for
      // failing the close operation if the user cannot or should not
      // be disabled or deleted.
      name: 'close',
      section: 'infoSection',
      confirmationRequired: function() {
        return true;
      },
      isAvailable: function(status, id) {
        return id && status !== 'CLOSED';
      },
      code: function(X) {
        var ticket = this.clone();
        ticket.status = "CLOSED";

        return this.ticketDAO.put(ticket).then(res => {
          this.ticketDAO.cmd(this.AbstractDAO.PURGE_CMD);
          this.ticketDAO.cmd(this.AbstractDAO.RESET_CMD);
          this.finished.pub();
          this.notify(this.SUCCESS_CLOSED, '', this.LogLevel.INFO, true);
        }, e => {
          this.throwError.pub(e);
          this.notify(e.message, '', this.LogLevel.ERROR, true);
        });
      }
    }
  ]
});
