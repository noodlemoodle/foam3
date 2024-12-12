/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.u2.navigation',
  name: 'SignUp',

  documentation: `Model used for registering/creating an user.
  Hidden properties create the different functionalities for this view (Ex. coming in with a signUp token)`,

  implements: [
    'foam.mlang.Expressions'
  ],

  imports: [
    'appConfig',
    'auth',
    'ctrl',
    'emailVerificationService',
    'googleTagAgent',
    'logAnalyticEvent',
    'login as importedLogin',
    'loginSuccess',
    'loginView?',
    'notify',
    'oidcProviderDAO',
    'pushMenu',
    'routeTo',
    'stack',
    'subject',
    'theme',
    'translationService',
    'window'
  ],

  requires: [
    'foam.log.LogLevel',
    'foam.nanos.auth.User',
    'foam.u2.stack.StackBlock'
  ],

  constants: [
    {
      name: 'USERNAME_INVALID_ERR',
      type: 'String',
      factory: function() { return foam.nanos.auth.User.INVALID_USERNAME; },
      javaValue: 'foam.nanos.auth.User.INVALID_USERNAME'
    }
  ],

  messages: [
    { name: 'TITLE', message: 'Create an account' },
    { name: 'FOOTER_TXT', message: 'Already have an account?' },
    { name: 'ERROR_MSG', message: 'There was a problem creating your account' },
    { name: 'EMAIL_ERR', message: 'Required' },
    { name: 'EMAIL_INVALID_ERR', message: 'Valid email address required' },
    { name: 'EMAIL_AVAILABILITY_ERR', message: 'This email is already in use. Please sign in or use a different email' },
    { name: 'USERNAME_EMPTY_ERR', message: 'Required' },
    { name: 'USERNAME_AVAILABILITY_ERR', message: 'This username is taken. Please try another.' },
    //TODO: Find out better way to deal with PASSWORD_ERR
    { name: 'PASSWORD_ERR', message: 'Password should be at least 10 characters' },
    { name: 'WEAK_PASSWORD_ERR', message: 'Password is weak' },
    { name: 'SUCCESS_MSG', message: 'Account successfully created' },
    { name: 'SUCCESS_MSG_TITLE', message: 'Success' },
    { name: 'ERROR_MSG_LOGIN', message: 'There was a problem signing into your account' }
  ],

  sections: [
    {
      name: '_defaultSection',
      title: ''
    },
    {
      name: 'footerSection',
      title: '',
      isAvailable: () => false
    }
  ],


  properties: [
    {
      name: 'dao_',
      hidden: true,
      transient: true
    },
    {
      class: 'Boolean',
      name: 'isLoading_',
      documentation: `Condition to synchronize code execution and user response.`,
      hidden: true
    },
    {
      class: 'String',
      name: 'token_',
      documentation: `Input to associate new user with something.`,
      hidden: true
    },
    {
      class: 'Boolean',
      name: 'disableEmail_',
      documentation: `Set this to true to disable the email input field.`,
      hidden: true
    },
    {
      class: 'String',
      name: 'emailAvailable',
      documentation: `Bound property used to display email not available error.`,
      value: 'valid',
      hidden: true
    },
    {
      class: 'EMail',
      name: 'email',
      placeholder: 'example@example.com',
      view: function(_, X) {
        return {
          class: 'foam.u2.view.UserPropertyAvailabilityView',
          icon: 'images/checkmark-small-green.svg',
          isAvailable$: X.data.emailAvailable$,
          type: 'email',
          inputValidation: /\S+@\S+\.\S+/,
          displayMode: X.data.disableEmail_ ? foam.u2.DisplayMode.DISABLED : foam.u2.DisplayMode.RW
        };
      },
      required: true,
      validationPredicates: [
        {
          args: ['emailAvailable', 'email'],
          query: 'emailAvailable!="unavailable"',
          errorMessage: 'EMAIL_AVAILABILITY_ERR'
        }
      ]
    },
    {
      class: 'String',
      name: 'usernameAvailable',
      documentation: `Bound property used to display username not available error.`,
      value: 'valid',
      hidden: true
    },
    {
      class: 'String',
      name: 'userName',
      label: 'Username',
      placeholder: 'example123',
      view: function(_, X) {
        return {
          class: 'foam.u2.view.UserPropertyAvailabilityView',
          icon: 'images/checkmark-small-green.svg',
          isAvailable$: X.data.usernameAvailable$,
          inputValidation: X.data.User.USER_NAME_MATCHER
        };
      },
      required: true,
      validationPredicates: [
        {
          args: ['usernameAvailable', 'userName'],
          query: 'usernameAvailable!="invalid"',
          errorMessage: 'USERNAME_INVALID_ERR'
        },
        {
          args: ['usernameAvailable', 'userName'],
          query: 'usernameAvailable!="unavailable"',
          errorMessage: 'USERNAME_AVAILABILITY_ERR'
        }
      ]
    },
    {
      class: 'Boolean',
      name: 'passwordAvailable',
      value: true,
      hidden: true
    },
    {
      class: 'Password',
      name: 'desiredPassword',
      label: 'Password',
      view: function(_, X) {
        return {
          class: 'foam.u2.view.PasswordView',
          isAvailable$: X.data.passwordAvailable$,
          passwordIcon: true,
          autocomplete: 'new-password'
        }
      },
      validateObj: function(desiredPassword, passwordAvailable) {
        if ( ! desiredPassword || desiredPassword.length < 10 ) return this.PASSWORD_ERR;
        if ( ! passwordAvailable ) return this.WEAK_PASSWORD_ERR;
      }
    },
    {
      class: 'Boolean',
      name: 'showAction',
      visibility: 'HIDDEN',
      value: true,
      documentation: 'Optional boolean used to display this model without login action'
    },
    {
      class: 'Boolean',
      name: 'pureLoginFunction',
      documentation: 'Set to true, if we just want to login without application redirecting.',
      hidden: true
    },
    {
      class: 'String',
      name: 'referralToken',
      documentation: `Input to associate new user with something.`,
      postSet(_, n) {
        if ( n ) {
          this.logAnalyticEvent({ name: 'SIGNUP_WITH_REFERRAL_CODE', extra: foam.json.stringify({ referralToken: n }) });
        }
      },
      factory: function() {
        var searchParams = new URLSearchParams(location.search);
        return searchParams.get('referral');
      },
      hidden: true
    },
    {
      name: 'disclaimer',
      value: true,
      hidden: true,
      documentation: `
        Show disclaimer for t&c and privacyPolicy in loginview
      `
    }
  ],

  listeners: [
    {
      name: 'emailVerifiedListener',
      code: async function() {
        try {
          await this.importedLogin(this.userName, this.desiredPassword);
        } catch (err) {
          this.notify(this.ERROR_MSG_LOGIN, '', this.LogLevel.ERROR, true);
          this.pushMenu('sign-in', true);
        }
      }
    }
  ],

  methods: [
    {
      name: 'nextStep',
      code: async function() {
        await this.verifyEmail(this.__subContext__, this.email, this.userName);
      }
    },
    {
      name: 'verifyEmail',
      code: async function() {
        if ( this.subject.user.emailVerified ) {
          // When a link was sent to user to SignUp, they will have already verified thier email,
          // thus thier user.emailVerified should be true and they can simply login from here.
          this.window.history.replaceState(null, null, this.window.location.origin);
          location.reload();
        } else {
          // login function in signup sets the subject to the signed up user without logging in
          // here we save the new user info to be used later in emailverification
          // and reset the subject to the anonymous subject before verification step
          var user = this.subject.user;
          this.subject = await this.auth.getCurrentSubject(null);
          this.onDetach(this.emailVerificationService.sub('emailVerified', this.emailVerifiedListener));
          this.ctrl.groupLoadingHandled = true;

          var ctx = this.__subContext__.createSubContext({ email: user.email, username: user.username })
          const wizardRunner = foam.u2.crunch.WizardRunner.create({
            wizardType: foam.u2.wizard.WizardType.TRANSIENT,
            source: 'net.nanopay.auth.VerifyEmailByCode',
            options: { inline: true }
          }, ctx);
          wizardRunner.sequence
          .remove('ReturnToLaunchPointAgent')
          .addBefore('ConfigureFlowAgent', {
            class: 'foam.u2.wizard.agents.AnalyticEventsAgent',
            createTraceID: true,
            traceIDKey: 'wizardTraceID',
            wizardName: 'VERIFY_EMAIL_WIZARD'
          })
          .addBefore('ConfigureFlowAgent', {
            class: 'foam.u2.wizard.analytics.AnalyticsEventHandlerAgent'
          });
          await wizardRunner.launch();
        }
      }
    },
    {
      name: 'defaultUserLanguage',
      code: function() {
        let l = foam.locale.split('-');
        let code = l[0];
        let variant = l[1];
        let language = foam.nanos.auth.Language.create({ code: code });
        if ( variant ) language.variant = variant;
        return language;
      }
    },
    {
      name: 'login_',
      code: async function(x) {
        var urlParams = new URLSearchParams(window.location.search);
        var eventExtras = {
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign')
        }
        this.logAnalyticEvent({ name: 'USER_CLICKED_GET_STARTED', extra: foam.json.stringify(eventExtras) });
        let createdUser = this.User.create({
          userName: this.userName,
          email: this.email,
          desiredPassword: this.desiredPassword,
          signUpToken: this.token_,
          language: this.defaultUserLanguage(),
          referralCode: this.referralToken
        });
        var user;
        try {
          user = await this.dao_.put(createdUser);
        } catch (err) {
          this.notify(err.message, '', this.LogLevel.ERROR, true);
          return;
        }

        if ( user ) {
          this.subject.realUser = user;
          this.subject.user = user;
          eventExtras['User ID'] = user.id;
          eventExtras['Email'] = user.email;
          this.logAnalyticEvent({ name: 'USER_CREATED_SIGN_UP', extra: foam.json.stringify(eventExtras) });
          this.googleTagAgent?.pub('userCreated');
          if ( ! this.pureLoginFunction ) await this.nextStep(x);
          this.notify(this.SUCCESS_MSG_TITLE, this.SUCCESS_MSG, this.LogLevel.INFO, true);
        } else {
          this.loginFailed = true;
          this.notify(this.ERROR_MSG, '', this.LogLevel.ERROR, true);
        }
        // TODO: Add functionality to push to sign in if the user email already exists
      }
    }
  ],

  actions: [
    {
      name: 'login',
      label: 'Get started',
      section: 'footerSection',
      buttonStyle: 'PRIMARY',
      isEnabled: function(errors_, isLoading_) {
        return ! errors_ && ! isLoading_;
      },
      isAvailable: function(showAction) { return showAction; },
      code: async function(x) {
        this.login_(x);
      }
    },
    {
      name: 'footer',
      section: 'footerSection',
      label: 'Sign in',
      buttonStyle: 'TEXT',
      code: function(X) {
        X.routeTo('sign-in');
      }
    },
    {
      name: 'subFooter',
      section: 'footerSection',
      isAvailable: () => false,
      code: () => {}
    }
  ]
});
