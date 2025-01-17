/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.notification.email',
  name: 'EmailTemplateEngine',

  javaImports: [
    'foam.core.Agency',
    'foam.core.ContextAgent',
    'foam.core.X',
    'foam.dao.DAO',
    'foam.lib.json.*',
    'foam.lib.parse.*',
    'foam.nanos.logger.Logger',
    'foam.nanos.logger.Loggers',
    'foam.nanos.logger.PrefixLogger',
    'foam.nanos.notification.email.EmailTemplateSupport',
    'java.util.Map'
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.lib.parse.Grammar',
      name: 'grammar',
      documentation: `grammar for parsing "{{ val }}", "{% if/else}}" symbols`,
      javaFactory: `
        Grammar grammar = new Grammar();
        grammar.addSymbol("START", grammar.sym("markup"));

        // markup symbol defines the pattern for the whole string
        grammar.addSymbol("markup", new Repeat0(new Alt(grammar.sym("IF_ELSE"),
          grammar.sym("IF"), grammar.sym("SIMPLE_VAL"), grammar.sym("ANY_CHAR"))));
        Action markup = new Action() {
          @Override
          public Object execute(Object value, ParserContext x) {
            return (StringBuilder) x.get("sb");
          }
        };
        grammar.addAction("markup", markup);

        // ANY_KEY symbol applies to any char that doesn't match any other pattern
        grammar.addSymbol("ANY_CHAR", AnyChar.instance());
        Action anyCharAction = new Action() {
          @Override
          public Object execute(Object val, ParserContext x) {
            ((StringBuilder) x.get("sb")).append(val);
            return val;
          }
        };
        grammar.addAction("ANY_CHAR", anyCharAction);

        // simple value syntax: "qwerty {{ simple_value }} qwerty"
        grammar.addSymbol("SIMPLE_VAL", new Seq1(1, Literal.create("{{"), new Until(Literal.create("}}") )));
        Action simpleValAction = new Action() {
          @Override
          public Object execute(Object val, ParserContext x) {
            Object[] val0    = (Object[]) val;
            StringBuilder v = new StringBuilder();
            for ( int i = 0 ; i < val0.length ; i++ ) {
              if ( ! Character.isWhitespace((char) val0[i]) ) v.append(val0[i]);
            }
            String value = (String) ((Map) x.get("values")).get(v.toString());
            if ( value == null ) {
              value = "";
              foam.nanos.logger.StdoutLogger.instance().warning("No value provided for variable",v);
            }
            ((StringBuilder) x.get("sb")).append(value);
            return value;
          }
        };
        grammar.addAction("SIMPLE_VAL", simpleValAction);

        /* IF_ELSE syntax: "qwerty {% if var_name_provided_in_map %} qwer {{ possible_simple_value }} erty
        {% else %} qwerty {% endif %}" */
        Parser ifElseParser = new SeqI(new int[] { 4, 5, 10 },
          Literal.create("{%"),
          Whitespace.instance(),
          Literal.create("if"),
          Whitespace.instance(),
          new Until(Literal.create("%}")),
          new Until(Literal.create("{%")),
          Whitespace.instance(),
          Literal.create("else"),
          Whitespace.instance(),
          Literal.create("%}"),
          new Until(Literal.create("{%")),
          Whitespace.instance(),
          Literal.create("endif"),
          Whitespace.instance(),
          Literal.create("%}")
        );

        grammar.addSymbol("IF_ELSE", ifElseParser);
        Action ifElseAction  = new Action() {
          @Override
          public Object execute(Object val, foam.lib.parse.ParserContext x) {
            Object[] valArr  = (Object[]) val;
            Object[] val0    = (Object[]) valArr[0];
            StringBuilder ifCond = new StringBuilder();
            for ( int i = 0 ; i < val0.length ; i++ ) {
              if ( ! Character.isWhitespace((char)val0[i]) ) ifCond.append(val0[i]);
            }

            StringBuilder finalVal = new StringBuilder();
            if ( ((Map) x.get("values")).get(ifCond.toString() ) != null ) {
              Object[] val1 = (Object[]) valArr[1];
              for ( int i = 0 ; i < val1.length ; i++ ) {
                finalVal.append(val1[i]);
              }
            } else {
              Object[] val2 = (Object[]) valArr[2];
              for ( int i = 0 ; i < val2.length ; i++ ) {
                finalVal.append(val2[i]);
              }
            }
            StringPStream finalValPs = new StringPStream();
            finalValPs.setString(finalVal);
            ((Parser) grammar.sym("markup")).parse(finalValPs, x);
            return val;
          }
        };
        grammar.addAction("IF_ELSE", ifElseAction);


        /* IF symbol syntax: "qwerty {% if var_name_provided_in_map %} qwer {{ possible_simple_value }}
        qwerty {% endif %}" */
        Parser ifParser = new Seq2(4, 5,
          Literal.create("{%"),
          Whitespace.instance(),
          Literal.create("if"),
          Whitespace.instance(),
          new Until(Literal.create("%}")),
          new Until(Literal.create("{%")),
          Whitespace.instance(),
          Literal.create("endif"),
          Whitespace.instance(),
          Literal.create("%}")
        );

        grammar.addSymbol("IF", ifParser);
        Action ifAction  = new Action() {
          @Override
          public Object execute(Object val, foam.lib.parse.ParserContext x) {
            Object[] valArr  = (Object[]) val;
//            Object[] tempVal = (Object[]) valArr[0];
            Object[] val0    = (Object[]) valArr[0];
            StringBuilder ifCond = new StringBuilder();
            for ( int i = 0 ; i < val0.length ; i++ ) {
              if ( ! Character.isWhitespace((char) val0[i]) ) ifCond.append(val0[i]);
            }

            StringBuilder finalVal = new StringBuilder();
            if ( ((Map) x.get("values")).get(ifCond.toString() ) != null ) {
              Object[] val1 = (Object[]) valArr[1];
              for ( int i = 0 ; i < val1.length ; i++ ) {
                finalVal.append(val1[i]);
              }
              StringPStream finalValPs = new StringPStream();
              finalValPs.setString(finalVal);
              ((Parser) grammar.sym("markup")).parse(finalValPs, x);
            }
            return val;
          }
        };
        grammar.addAction("IF", ifAction);

        return grammar;
      `
    },
    {
      class: 'FObjectProperty',
      of: 'foam.lib.parse.Grammar',
      name: 'contentGrammar',
      documentation: `grammar for parsing "{{ val }}", "{% if/else}}" symbols`,
      javaFactory: `
        Grammar grammar = new Grammar();
        grammar.addSymbol("START", grammar.sym("markup"));
        grammar.addSymbol("markup", new Repeat0(new Alt(grammar.sym("SUPER_BLOCK_CONTENT"),
          grammar.sym("ANY_CHAR"))));

        grammar.addSymbol("ANY_CHAR", AnyChar.instance());
        Action anyCharAction = new Action() {
          @Override
          public Object execute(Object val, ParserContext x) {
            ((StringBuilder) x.get("sb")).append(val);
            return val;
          }
        };
        grammar.addAction("ANY_CHAR", anyCharAction);

        /* SUPER_BLOCK_CONTENT finds pattern <content></content> and inserts content
        from extending template */
        grammar.addSymbol("SUPER_BLOCK_CONTENT", new Seq(
          Literal.create("<"),
          Whitespace.instance(),
          Literal.create("content"),
          Whitespace.instance(),
          Literal.create(">"),
          Literal.create("</"),
          Whitespace.instance(),
          Literal.create("content"),
          Whitespace.instance(),
          Literal.create(">")
        ));
        Action superBlockAction = new Action() {
          @Override
          public Object execute(Object val, ParserContext x) {
            ((StringBuilder) x.get("sb")).append(x.get("content"));
            return val;
          }
        };
        grammar.addAction("SUPER_BLOCK_CONTENT", superBlockAction);
        return grammar;
      `
    },
    {
      class: 'FObjectProperty',
      of: 'foam.lib.parse.Grammar',
      name: 'includeGrammar',
      documentation: `grammar for parsing "{{ val }}", "{% if/else}}" symbols`,
      javaFactory: `
        Grammar grammar = new Grammar();
        grammar.addSymbol("START", grammar.sym("markup"));

        grammar.addSymbol("markup", new Repeat0(new Alt(grammar.sym("INCLUDE_CONTENT"),
        grammar.sym("ANY_CHAR"))));

        grammar.addSymbol("ANY_CHAR", AnyChar.instance());
        Action anyAction = new Action() {
          @Override
          public Object execute(Object val, ParserContext x) {
            ((StringBuilder) x.get("sb")).append(val);
            return val;
          }
        };
        grammar.addAction("ANY_CHAR", anyAction);

        /* INCLUDE_CONTENT symbol syntax: "qwerty <include name="templ_name"> some content
          </include>*/
        Parser include = new Seq2(7, 11,
          Literal.create("<include"),
          Whitespace.instance(),
          Literal.create("template"),
          Whitespace.instance(),
          Literal.create("="),
          Whitespace.instance(),
          Literal.create("'"),
          new Until(Literal.create("'")),
          Whitespace.instance(),
          Literal.create(">"),
          Whitespace.instance(),
          new Until(Literal.create("</include>"))
          );
        grammar.addSymbol("INCLUDE_CONTENT", include);
        Action includeContentAction  = new Action() {
          @Override
          public Object execute(Object val, foam.lib.parse.ParserContext x) {
            Object[] valArr  = (Object[]) val;
            Object[] val0    = (Object[]) valArr[0];
            StringBuilder templateName = new StringBuilder();
            for ( int i = 0 ; i < val0.length ; i++ ) {
              templateName.append(val0[i]);
            }

            // At runtime, getX() is valid, during test case run
            // notice passed context is set on ParserContext
            X y = (X) x.get("x");
            if ( y == null || y.get("emailTemplateDAO") == null ) {
              y = getX();
            }
            // XLocator is valid.  Need to determine which X to use.
            if ( y == null || y.get("emailTemplateDAO") == null ) {
              y = foam.core.XLocator.get();
            }
            EmailTemplate extendedEmailTemplate = EmailTemplateSupport.findTemplate(y, templateName.toString());
            if ( extendedEmailTemplate == null ) {
              foam.nanos.logger.StdoutLogger.instance().warning("Extended template not found", templateName);
              return val;
            }
            StringBuilder content = new StringBuilder();
            Object[] val1 = (Object[]) valArr[1];
            for ( int i = 0 ; i < val1.length ; i++ ) {
              content.append(val1[i]);
            }
            String body = extendedEmailTemplate.getBody();
            x.set("isNextTemplateExtending", body.contains("<include template=") || body.contains("<include template ="));
            ((StringBuilder) x.get("sb")).append(outputContent(extendedEmailTemplate.getBody(), content.toString()));
            return val;
          }
        };
        grammar.addAction("INCLUDE_CONTENT", includeContentAction);
        return grammar;
      `
    }
  ],

  methods: [
    {
      name: 'renderTemplateById',
      args: [
        { name: 'x',      type: 'Context' },
        { name: 'id',     type: 'String' },
        { name: 'values', type: 'Map' }
      ],
      type: 'StringBuilder',
      javaCode: `
      Logger logger = new PrefixLogger( new Object[] {
        this.getClass().getSimpleName(),
        "template",
        id
      }, (Logger) x.get("logger"));
      EmailTemplate template = EmailTemplateSupport.findTemplate(x, id);
      if ( template == null ) {
        logger.warning("Template not found");
        throw new RuntimeException("Template not found");
      }
      return renderTemplate(x.put("logger", logger), template.getBody(), values);
      `
    },
    {
      name: 'renderTemplate',
      args: [
        { name: 'x',      type: 'Context' },
        { name: 'str',    type: 'String' },
        { name: 'values', type: 'Map' }
      ],
      type: 'StringBuilder',
      javaCode: `
      StringBuilder joinedTempl = joinTemplates(x, str);

      StringPStream ps = new StringPStream();
      ps.setString(joinedTempl);
      ParserContext parserX = new ParserContextImpl();
      StringBuilder sb = sb_.get();
      parserX.set("sb", sb);
      parserX.set("values", values);
      parserX.set("logger", x.get("logger"));
      parserX.set("alarmDAO", x.get("alarmDAO"));
      getGrammar().parse(ps, parserX, "");
      return sb;
      `
    },
    {
      name: 'outputContent',
      args: [
        { name: 'body',    type: 'String' },
        { name: 'content', type: 'String' }
      ],
      type: 'StringBuilder',
      javaCode: `
      StringBuilder sbContent = sbContent_.get();
      StringPStream ps = new StringPStream();
      ps.setString(body);
      ParserContext parserX = new ParserContextImpl();
      parserX.set("sb", sbContent);
      parserX.set("content", content);
      getContentGrammar().parse(ps, parserX, "");

      return sbContent;
      `
    },
    {
      name: 'joinTemplates',
      args: [
        { name: 'x',    type: 'Context' },
        { name: 'body', type: 'CharSequence' }
      ],
      type: 'StringBuilder',
      documentation: `joins two templates where one extends another
      (e.g. <include template = "tempalte_name"> extending template content </include>).
      In case when there is more than one template extended, joinTemplates is called recursively`,
      javaCode: `
      StringBuilder sbJoin = sbJoin_.get();

      StringPStream ps = new StringPStream();
      ps.setString(body);
      ParserContext parserX = new ParserContextImpl();
      parserX.set("sb", sbJoin);
      parserX.set("x", x);
      parserX.set("logger", x.get("logger"));
      parserX.set("alarmDAO", x.get("alarmDAO"));
      parserX.set("isNextTemplateExtending", false);
      getIncludeGrammar().parse(ps, parserX, "");
      if ( ! (Boolean) parserX.get("isNextTemplateExtending") ) return sbJoin;

      return joinTemplates(x, sbJoin);
      `
    }
  ],

  javaCode: `
    protected static ThreadLocal<StringBuilder> sb_ = new ThreadLocal<StringBuilder>() {
      @Override
      protected StringBuilder initialValue() {
        return new StringBuilder();
      }
      @Override
      public StringBuilder get() {
        StringBuilder b = super.get();
        b.setLength(0);
        return b;
      }
    };

    protected static ThreadLocal<StringBuilder> sbContent_ = new ThreadLocal<StringBuilder>() {
      @Override
      protected StringBuilder initialValue() {
        return new StringBuilder();
      }
      @Override
      public StringBuilder get() {
        StringBuilder b = super.get();
        b.setLength(0);
        return b;
      }
    };

    protected static ThreadLocal<StringBuilder> sbJoin_ = new ThreadLocal<StringBuilder>() {
      @Override
      protected StringBuilder initialValue() {
        return new StringBuilder();
      }
      @Override
      public StringBuilder get() {
        StringBuilder b = super.get();
        b.setLength(0);
        return b;
      }
    };
  `
});
