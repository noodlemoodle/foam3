/**
 * @license
 * Copyright 2024 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'UserRegistrationDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: `User registration occurs during sign-up and
verifies:
- an email address was provided
- the username is unique in the spid
and then
- assigns a group according to the theme.
`,

  javaImports: [
    'foam.core.X',
    'foam.dao.DAO',
    'foam.dao.ArraySink',
    'static foam.mlang.MLang.*',
    'foam.nanos.logger.Loggers',
    'foam.nanos.theme.Theme',
    'foam.nanos.theme.Themes',
    'foam.util.SafetyUtil',
    'java.util.List'
  ],

  messages: [
    { name: 'EMAIL_REQUIRED', message: 'Email required' },
    { name: 'DUPLICATE_USER', message: 'User with the same username already exists' }
  ],

  javaCode: `
    public UserRegistrationDAO(X x, DAO delegate) {
      setX(x);
      setDelegate(delegate);
    }
  `,

  methods: [
    {
      name: 'put_',
      javaCode: `
        User user = (User) obj;
        if ( user == null || SafetyUtil.isEmpty(user.getEmail()) ) {
          throw new RuntimeException(EMAIL_REQUIRED);
        }

        String spid = null;
        Theme theme = ((Themes) x.get("themes")).findTheme(x);
        if ( theme != null &&
              ! SafetyUtil.isEmpty(theme.getSpid()) ) {
          spid = theme.getSpid();
          user.setSpid(spid);
          if ( ! SafetyUtil.isEmpty(theme.getRegistrationGroup()) ) {
            user.setGroup(theme.getRegistrationGroup());
          } else {
            throw new RuntimeException("Theme registration group not specified for user registration");
          }
        } else {
          Loggers.logger(x, this).error("Theme not found");
          throw new RuntimeException("Theme not found for user registration");
        }

        List users = (List) ((ArraySink) getDelegate().inX(getX())
          .where(
            AND(
              EQ(User.USER_NAME, user.getUserName()),
              NEQ(User.LIFECYCLE_STATE, LifecycleState.DELETED),
              EQ(User.SPID, user.getSpid())
            ))
           .select(new ArraySink())).getArray();
        if ( users != null && users.size() > 1 ) {
          Loggers.logger(x, this).debug("Duplicate user", user.getUserName());
          throw new DuplicateUserNameException(DUPLICATE_USER);
        }

        return getDelegate().put_(getX(), user);
      `
    },
    {
      name: 'find_',
      javaCode: `
        return null;
      `
    },
    {
      name: 'select_',
      javaCode: `
        // Return an empty sink instead of null to avoid breaking calling code that
        // expects this method to return a sink.
        return new ArraySink();
      `
    },
    {
      name: 'remove_',
      javaCode: `
        return null;
      `
    },
    {
      name: 'cmd_',
      javaCode: `
        if ( "AUTHORIZER?".equals(obj) ) {
          return getClass().getName();
        }

        return super.cmd_(x, obj);
      `
    }
  ]
});
