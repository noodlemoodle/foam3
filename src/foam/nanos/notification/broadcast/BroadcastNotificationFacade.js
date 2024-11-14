/**
* @license
* Copyright 2022 The FOAM Authors. All Rights Reserved.
* http://www.apache.org/licenses/LICENSE-2.0
*/

foam.CLASS({
  package: 'foam.nanos.notification.broadcast',
  name: 'BroadcastNotificationFacade',

  implements: [
    'foam.mlang.Expressions'
  ],
  imports: [
    'auth?',
    'broadcastNotificationDAO',
    'ctrl',
    'notificationDAO',
    'notificationTemplateDAO',
    'userDAO'
  ],
  requires: [
    'foam.nanos.auth.User',
    'foam.nanos.notification.Notification',
    'foam.nanos.notification.broadcast.BroadcastNotification'
  ],
  messages: [
    { name: 'GROUP_OR_USERS_REQUIRED', message: 'Group or Users are required' },
    { name: 'BODY_OR_TEMPLATE_OR_TOAST_REQUIRED', message: 'Notification body and/or template and/or toast required' },
    { name: 'TOAST_REQUIRED',       message: 'Toast Message is required when showing toast' },
    { name: 'NOTIFICATION_SENT',    message: 'Notification Created' },
    { name: 'NOTIFICAITON_SUMMARY', message: 'notification(s)' },
    { name: 'NOTIFICATION_ERROR',   message: 'Notification Error' }
  ],
  properties: [
    {
      __copyFrom__: 'foam.nanos.notification.Notification.GROUP_ID',
      label: 'Send To Group',
      validateObj: function(groupId, users) {
        if ( ! groupId && ! ( users && users.length ) ) {
          return this.GROUP_OR_USERS_REQUIRED;
        }
      },
      view: function(_, X) {
        var dao = X[X.data.GROUP_ID.targetDAOKey] || X.data[X.data.GROUP_ID.name + '$dao'];
        // TODO: find a better way to only pick children
        // dao = dao.where(X.data.CONTAINS(group.ID, X.subject.user.spid));
        return { class: 'foam.u2.view.ReferenceView', dao: dao };
      }
    },
    {
      class: 'Array',
      name: 'users',
      label: 'Send to Users',
      view: function(_, X) {
        var userDAOSlot = X.data.slot(groupId => {
          if ( groupId ) {
            return X.userDAO.where(X.data.EQ(X.data.User.GROUP, groupId));
          } else {
            return X.userDAO.where(X.data.EQ(X.data.User.SPID, X.subject.user.spid));
          }
        });
        return {
          class: 'foam.u2.view.ReferenceArrayView',
          daoKey: 'userDAO',
          allowDuplicates: false,
          valueView: {
            class: 'foam.u2.view.RichChoiceReferenceView',
            search: true,
            sections: [
              {
                heading: 'Users',
                dao$: userDAOSlot
              }
            ]
          }
        }
      },
      validateObj: function(groupId, users) {
        if ( ! groupId && ! ( users && users.length ) ) {
          return this.GROUP_OR_USERS_REQUIRED;
        }
      }
    },
    {
      class: 'Reference',
      name: 'notificationTemplate',
      of: 'foam.nanos.notification.Notification',
      view: function(_, X) {
        var dao = X.notificationTemplateDAO;
        return {
          class: 'foam.u2.view.ModeAltView',
          readView: { class: 'foam.u2.view.StringView' },
          writeView: {
            class: 'foam.u2.view.RichChoiceReferenceView',
            sections: [
              {
                heading: 'Notification Templates',
                dao: dao
              }
            ],
            placeholder: '--'
          }
        };
      },
      postSet: function(_, n) {
        var self = this;
        this.notificationTemplateDAO.find(n).then(function(t) {
          self.template = t.template;
        })
      },
      validateObj: function(body, notificationTemplate, toastMessage) {
        if ( ( ! body || ! body.length || ! body.trim() ) &&
             ( ! notificationTemplate ) &&
             ( ! toastMessage ) ) {
          return this.BODY_OR_TEMPLATE_OR_TOAST_REQUIRED;
        }
      }
    },
    {
      __copyFrom__: 'foam.nanos.notification.Notification.BODY',
      label: 'Notification Body',
      view: { class: 'foam.u2.view.RichTextView' },
      validateObj: function(body, notificationTemplate, toastMessage) {
        if ( ( ! body || ! body.length || ! body.trim() ) &&
             ( ! notificationTemplate ) &&
             ( ! toastMessage ) ) {
          return this.BODY_OR_TEMPLATE_OR_TOAST_REQUIRED;
        }
      }
    },
    {
      __copyFrom__: 'foam.nanos.notification.Notification.EMAIL_ARGS',
      label: "Email Template Args",
      visibility: 'RW',
    },
    {
      class: 'Boolean',
      name: 'showToast',
      label: 'Show Toast (Push)',
      postSet: function(_, n) { if ( ! n ) this.toastMessage = ''; }
    },
    {
      __copyFrom__: 'foam.nanos.notification.Notification.TOAST_MESSAGE',
      onKey: true,
      createVisibility: function(showToast) {
        return showToast ? foam.u2.DisplayMode.RW : foam.u2.DisplayMode.HIDDEN;
      },
      validateObj: function(showToast, toastMessage) {
        if ( showToast && ( ! toastMessage.length || ! toastMessage.trim() ) ) {
          return this.TOAST_REQUIRED;
        }
      }
    },
    {
      __copyFrom__: 'foam.nanos.notification.Notification.TOAST_SUB_MESSAGE',
      onKey: true,
      createVisibility: function(showToast) {
        return showToast ? foam.u2.DisplayMode.RW : foam.u2.DisplayMode.HIDDEN;
      }
    }
  ],

  methods: [
    function toSummary() {
      return this.NOTIFICAITON_SUMMARY;
    }
  ],

  actions: [
    {
      name: 'send',
      buttonStyle: 'PRIMARY',
      confirmationView: function() { return true; },
      isEnabled: function(errors_) {
        return ! errors_;
      },
      code: function() {
        var self = this;
        var notif = this.BroadcastNotification.create({
          template: this.template,
          body: this.body,
          toastMessage: this.toastMessage,
          toastSubMessage: this.toastSubMessage,
          groupId: this.groupId,
          users: this.users,
          emailArgs: this.emailArgs,
          severity: 'INFO',
          transient: false,
          toastState: this.showToast ? 'REQUESTED' : 'NONE'
        });
        if ( this.users && this.users.length > 0 ) {
          this.broadcastNotificationDAO.put(notif).then(obj => {
            this.users.forEach((uid) => {
              var n = notif;
              n.groupId = undefined;
              n.userId = uid;
              this.notificationDAO.put(n).then(() => {
              }, e => {
                this.ctrl.notify(this.NOTIFICATION_ERROR, e.message, 'ERROR', true);
              });
            });
            // Reset all props
            this.notificationTemplate = undefined;
            this.template = undefined;
            this.body = undefined;
            this.toastMessage = undefined;
            this.toastSubMessage = undefined;
            this.showToast = undefined;
            this.groupId = undefined;
            this.users = undefined;
            this.emailArgs = undefined;
            this.ctrl.notify(this.NOTIFICATION_SENT, '', 'INFO', true);
          });
        } else if ( this.groupId ) {
          this.broadcastNotificationDAO.put(notif).then(obj => {
            this.notificationDAO.put(notif).then(() => {
              // Reset all props
              this.notificationTemplate = undefined;
              this.template = undefined;
              this.body = undefined;
              this.toastMessage = undefined;
              this.toastSubMessage = undefined;
              this.showToast = undefined;
              this.groupId = undefined;
              this.users = undefined;
              this.emailArgs = undefined;
              this.ctrl.notify(this.NOTIFICATION_SENT, '', 'INFO', true);
            }, e => {
              this.ctrl.notify(this.NOTIFICATION_ERROR, e.message, 'ERROR', true);
            });
          });
        }
      }
    }
  ]
});
