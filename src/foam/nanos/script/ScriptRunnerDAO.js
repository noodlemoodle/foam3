/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.script',
  name: 'ScriptRunnerDAO',
  extends: 'foam.dao.ProxyDAO',

  javaImports: [
    'foam.core.*',
    'foam.dao.*',
    'foam.nanos.logger.Logger',
    'foam.nanos.logger.PrefixLogger',
    'foam.nanos.logger.StdoutLogger'
  ],

  axioms: [
    {
      name: 'javaExtras',
      buildJavaClass: function(cls) {
        cls.extras.push(
          ` 
            public ScriptRunnerDAO(DAO delegate) {
              setDelegate(delegate);
            }
          `
        );
      }
    }
  ],

  methods: [
    {
      name: 'put_',
      javaCode: `
        Script script = (Script) obj;
        if ( script.getStatus() == ScriptStatus.SCHEDULED ) {
          if ( script.canRun(x) ) {
            script = (Script) getDelegate().put_(x, script);
            runScript(x, script);
          } 
        } else {
          script = (Script) getDelegate().put_(x, script);
        }
        return script;
      `
    },
    {
      name: 'runScript',
      type: 'foam.nanos.script.Script',
      args: [
        { type: 'Context', name: 'x' },
        { type: 'foam.nanos.script.Script', name: 'script' }
      ],
      javaCode: `
          ((Agency) x.get("threadPool")).submit(x, new ContextAgent() {
            @Override
            public void execute(X y) {
              Logger logger = (Logger) y.get("logger");
              if ( logger == null ) {
                logger = new StdoutLogger();
              }
              logger = new PrefixLogger(new Object[] {
                this.getClass().getSimpleName()
              }, logger);
    
              Script s = (Script) script.fclone();
              try {
                s.setStatus(ScriptStatus.RUNNING);
                s = (Script) getDelegate().put_(x, s).fclone();
                logger.debug("agency", s.getId(), "start");
                s.runScript(x);
                logger.debug("agency", s.getId(), "end");
                s.setStatus(ScriptStatus.UNSCHEDULED);
                getDelegate().put_(x, s);
              } catch(Throwable t) {
                t.printStackTrace();
                s.setStatus(ScriptStatus.ERROR);
                getDelegate().put_(x, s);
                logger.error("agency", s.getId(), t);
              }
            }
          }, "Run script: " + script.getId());
        return script;
      `
    }
  ]
});

