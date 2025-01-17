/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

package foam.lib.json;

import foam.core.ClassInfo;
import foam.core.PropertyInfo;
import foam.lib.parse.*;
import foam.parse.NewlineParser;

import java.lang.reflect.InvocationTargetException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Iterator;
import java.util.List;

public class ModelParserFactory {
  protected static ConcurrentHashMap<Class, Parser> parsers_ = new ConcurrentHashMap<Class, Parser>();

  public static Parser getInstance(Class c) {
    if ( parsers_.containsKey(c) ) return parsers_.get(c);

    ClassInfo info = null;

    try {
      info = (ClassInfo) c.getMethod("getOwnClassInfo").invoke(null);
    } catch(NoSuchMethodException|IllegalAccessException|InvocationTargetException e) {
      throw new RuntimeException("Failed to build parser ", e);
    }

    Parser parser = buildInstance_(info);
    parsers_.put(c, parser);
    return parser;
  }

  public static Parser buildInstance_(ClassInfo info) {
    List     properties      = info.getAxiomsByClass(PropertyInfo.class);
    Parser[] propertyParsers = new Parser[properties.size() + 1];
    Iterator iter            = properties.iterator();
    int      i               = 0;

    while ( iter.hasNext() ) {
      propertyParsers[i] = PropertyParser.create((PropertyInfo) iter.next());
      i++;
    }

    // Prevents failure to parse if unknown property found
    propertyParsers[i] = new UnknownPropertyParser();

    return new Repeat0(
      new Seq0( new Optional(new Repeat(new Seq0(Whitespace.instance(), Literal.create("//"),new Until(NewlineParser.create())))),
        Whitespace.instance(), new Alt(propertyParsers)),
      Literal.create(",")
    );
  }
}
