/**
 * @license
 * Copyright 2023 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth.login',
  name: 'ClientLoginService',

  imports: [
    'auth',
    'ctrl',
    'defaultUserLanguage',
    'emailVerificationService',
    'loginSuccess',
    'notify',
    'stack',
    'subject',
    'onUserAgentAndGroupLoaded',
    'sessionID',
    'window',
  ],

  requires: [
    'foam.log.LogLevel',
    'foam.nanos.auth.DuplicateEmailException',
    'foam.nanos.auth.login.SignIn',
    'foam.nanos.auth.oidc.OIDCLoginState',
    'foam.nanos.auth.UnverifiedEmailException',
    'foam.nanos.auth.User',
    'foam.u2.stack.StackBlock'
  ],

  messages: [
    { name: 'SIGNIN_ERR', message: 'There was an issue logging in' },
    { name: 'SIGNUP_ERR', message: 'There was a problem creating your account' },
    { name: 'SIGNUP_SUCCESS_MSG', message: 'Account successfully created' },
    { name: 'SIGNUP_SUCCESS_TITLE', message: 'Success' }
  ],

  methods: [
    {
      name: 'signin',
      code: async function(x, data, wizardFlow) {
        var analyticable = foam.nanos.analytics.Analyticable.isInstance(data);
        try {
          this.ctrl.groupLoadingHandled = true;
          var loginId = data.usernameRequired_ ? data.username : data.identifier;
          let loggedInInUser = await this.auth.login(x, loginId, data.password);

          if ( ! loggedInInUser ) {
            if ( analyticable ) data.report('^fail-missing-subject', ['auth', 'error']);
            return;
          }

          data.email = loggedInInUser.email;
          data.username = loggedInInUser.userName;

          this.subject.user = loggedInInUser;
          this.subject.realUser = loggedInInUser;

          this.loginSuccess = true;
          await this.ctrl.reloadClient();
          this.ctrl.subject = this.subject;

          if ( analyticable ) data.report('^success', ['auth']);

          if ( ! wizardFlow ) {
            await this.onUserAgentAndGroupLoaded();
          }
        } catch (err) {
          let e = err && err.data ? err.data.exception : err;
          if ( this.DuplicateEmailException.isInstance(e) ) {
            data.email = data.identifier;
            if ( this.username ) {
              try {
                loggedInInUser = await this.auth.login(x, data.username, data.password);
                this.subject.user = loggedInInUser;
                this.subject.realUser = loggedInInUser;
                return;
              } catch ( err ) {
                data.username = '';
              }
            }
            data.usernameRequired_ = true;
          }
          if ( this.UnverifiedEmailException.isInstance(e) ) {
            var identifier = data.usernameRequired_ ? data.email : data.identifier;
            // This is a quirk of the way emailVerificationService is implemented, when a username is not required, only one identifier should be sent
            let ret = this.wizardVerifyEmail(x, identifier, data.usernameRequired_ ? data.username : null, data.password);
            var latch = foam.core.Latch.create();
            this.onDetach(this.emailVerificationService.sub('emailVerified', () => latch.resolve(true)));
            ret.then(status => {
              if ( status == 'DISCARDED' || status == 'ERROR' )
                latch.resolve(false);
            });
            let res = await latch;
            // retry signin
            if ( res )
              await this.signin(x, data, wizardFlow);
            return;
          }
          this.notify(err.data, this.SIGNIN_ERR, this.LogLevel.ERROR, true);
        }
      }
    },
    {
      name: 'signInWithOIDC',
      code: async function(provider, signUp = false, signUpUsername = '') {
        // TODO: Validate nonce
        var nonce = crypto.randomUUID();

        var reqParams = {
          response_type: 'code',
          client_id: provider.clientId,
          scope: 'openid email',
          redirect_uri: location.origin + "/service/oidc",
          nonce: nonce,
          state: foam.json.Network.stringify(this.OIDCLoginState.create({
            sessionId: this.sessionID,
            oidcProvider: provider.id,
            returnToApp: true,
            returnToUrl: this.window.location.toString(),
            signUp,
            signUpUsername,
          }), foam.nanos.auth.oidc.OIDCLoginState),
          // TODO: opt_cls here should be this.OIDCLoginState but that causes the outputter to output the
          // class name.
        }

        let authURL = provider.authURL + '?' + Object.entries(reqParams).map(v => v.map(p => encodeURIComponent(p)).join('=')).join('&')
        this.window.location = authURL;

        return;
        // If you want to run the login flow in a separate window
        // set returnToApp: false in the above OIDCLoginState open a window to authURL

        try {
          await new Promise((resolve, reject) => {
            let listener = (e) => {
              if (e.origin == location.origin && e.data && e.data.sessionID == this.sessionID) {
                window.removeEventListener('message', listener);
                if (e.data.msg == "success") {
                  authwindow.close();
                  resolve();
                } else {
                  reject(e.data.error)
                }
              }
            };

            window.addEventListener('message', listener);

            let authwindow = window.open(authURL);
          });
        } catch(e) {
          this.notify(e.message, '', this.LogLevel.ERROR, true);
        }

        this.subject = await this.auth.getCurrentSubject(x);
        await this.ctrl.reloadClient();
        this.loginSuccess = true;
        await this.onUserAgentAndGroupLoaded();
      }
    },
    {
      name: 'signup',
      code: async function(x, data, wizardFlow) {
        let createdUser = this.User.create({
          userName: data.username,
          email: data.email,
          desiredPassword: data.desiredPassword,
          language: this.defaultUserLanguage
        });
        var user = await data.dao_.put(createdUser);
        if ( user ) {
          this.notify(this.SIGNUP_SUCCESS_TITLE, this.SIGNUP_SUCCESS_MSG, this.LogLevel.INFO, true);

          var signinModel = this.SignIn.create({
            identifier: user.userName ? user.userName : user.email,
            username: user.userName,
            email: user.email,
            password: data.desiredPassword,
            usernameRequired: true
          });
          await this.signin(x, signinModel, wizardFlow);
        } else {
          this.notify(err.data, this.SIGNUP_ERR, this.LogLevel.ERROR, true);
        }
      }
    },
    {
      name: 'verifyEmail',
      code: async function(x, email, username, password) {
        var signinModel = this.SignIn.create({ identifier: email, email: email, username: username, password: password });
        this.onDetach(this.emailVerificationService.sub('emailVerified', async () => {
          await this.emailVerifiedListener(x, signinModel);
        }));
        this.stack.push(this.StackBlock.create({
          view: {
            class: 'foam.u2.borders.StatusPageBorder',
            showBack: false,
            children: [{
              class: 'foam.nanos.auth.email.VerificationCodeView',
              data: {
                class: 'foam.nanos.auth.email.EmailVerificationCode',
                email: email,
                userName: username,
                showAction: true
              }
            }]
          }
        }, this));
      }
    },
    {
      name: 'wizardVerifyEmail',
      code: async function(x, email, username, password) {
        var ctx = this.__subContext__.createSubContext({ email: email, username: username })
        const wizardRunner = foam.u2.crunch.WizardRunner.create({
          wizardType: foam.u2.wizard.WizardType.TRANSIENT,
          source: 'net.nanopay.auth.VerifyEmailByCode',
          options: { inline: false }
        }, ctx);

        await wizardRunner.launch();
        return wizardRunner.controller.wizardController.status;
      }
    },
    {
      name: 'generalAdmissionsCheck',
      code: async function() {

      }
    },
    {
      name: 'resetPassword',
      code: async function() {
        this.stack.push({
            class: 'foam.nanos.auth.ChangePasswordView',
            modelOf: 'foam.nanos.auth.RetrievePassword'
        }, this);
      }
    }
  ]
});
