/**
 * @license
 * Copyright 2019 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
package foam.nanos.auth;

import foam.core.AgencyTimerTask;
import foam.core.ContextAgent;
import foam.core.Detachable;
import foam.core.X;
import foam.dao.DAO;
import foam.dao.Sink;
import foam.nanos.crunch.UserCapabilityJunction;
import foam.nanos.logger.Logger;
import foam.nanos.logger.Loggers;
import foam.nanos.logger.StdoutLogger;
import foam.nanos.NanoService;
import foam.util.LRULinkedHashMap;
import java.security.Permission;
import java.util.Timer;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.Map;
import javax.security.auth.AuthPermission;
import static foam.mlang.MLang.TRUE;

/**
 * Decorator to add Caching to AuthService.
 * Stores cache in user Session so that memory is freed when user logs out.
 **/
public class CachingAuthService extends ProxyAuthService implements NanoService, ContextAgent {
  private static final String CACHE_NAME = "UserPermissionCache";
  private static final int    CACHE_SIZE = 2500;
  private static final long   INITIAL_TIMER_DELAY = 0L;

  /**
   * A list of DAOs that will be listened to. When any of these DAOs update, the
   * cache will be invalidated. Use this to listen to DAOs that are specific to
   * your application.
   * FUTURE: Support supplying predicates to pass to the listeners as well.
   */
  protected String[] extraDAOsToListenTo_;

  protected LRULinkedHashMap<Long, Map<String, Boolean>> userPermissionCache_ = new LRULinkedHashMap<>(CACHE_NAME, CACHE_SIZE);

  // Sink for listening to DAOs for permission changes
  private final Sink purgeSink = new Sink() {
    public void put(Object obj, Detachable sub) {
      purgeCache(obj);
    }

    public void remove(Object obj, Detachable sub) {
      purgeCache(obj);
    }

    public void eof() {}

    public void reset(Detachable sub) {
      purgeCache(null);
    }
  };

  public CachingAuthService(AuthService delegate) {
    this(delegate, new String[0]);
  }

  public CachingAuthService(AuthService delegate, String[] extraDAOsToListenTo) {
    setDelegate(delegate);
    extraDAOsToListenTo_ = extraDAOsToListenTo;
  }

  @Override
  public boolean check(foam.core.X x, String permission) {
    if ( x == null || permission == null ) {
      StdoutLogger.instance().debug(getClass().getSimpleName() + ".check", "x or permission not provided", permission);
      return false;
    }

    Permission p = new AuthPermission(permission);

    User user = getUserFromContext(x);
    Map<String, Boolean> map = getPermissionMap(user);

    Logger logger = Loggers.logger(x, this);

    if ( map.containsKey(p.getName()) ) {
      logger.debug("Found cached permission check result", user, p.getName(), map.get(p.getName()));
      return map.get(p.getName());
    }

    boolean permissionCheck = getDelegate().check(x, permission);

    map.put(p.getName(), permissionCheck);
    logger.debug("Cached permission check result", user, p.getName(), permissionCheck);

    return permissionCheck;
  }

  @Override
  public boolean checkUser(foam.core.X x, foam.nanos.auth.User user, String permission) {
    if ( x == null || permission == null ) return false;

    Permission           p   = new AuthPermission(permission);
    Map<String, Boolean> map = getPermissionMap(user);

    if ( map.containsKey(p.getName()) ) return map.get(p.getName());

    boolean permissionCheck = getDelegate().checkUser(x, user, permission);

    map.put(p.getName(), permissionCheck);

    return permissionCheck;
  }

  public void execute(X x) {
    // Configure listeners for explicit permission DAOs
    DAO userDAO = (DAO) getX().get("localUserDAO");
    if ( userDAO != null ) userDAO.listen(purgeSink, TRUE);

    // Capability.permissionsGranted could change check() outcome.
    DAO capabilityDAO = (DAO) getX().get("capabilityDAO");
    if ( capabilityDAO != null ) capabilityDAO.listen(purgeSink, TRUE);

    DAO userCapabilityJunctionDAO = (DAO) getX().get("userCapabilityJunctionDAO");
    if ( userCapabilityJunctionDAO != null ) userCapabilityJunctionDAO.listen(purgeSink, TRUE);

    DAO groupPermissionJunctionDAO = (DAO) getX().get("groupPermissionJunctionDAO");
    if ( groupPermissionJunctionDAO != null ) groupPermissionJunctionDAO.listen(purgeSink, TRUE);

    // Configure listeners for additional permission DAOs
    if ( extraDAOsToListenTo_ != null ) {
      for ( String daoName : extraDAOsToListenTo_ ) {
        DAO dao = (DAO) getX().get(daoName);
        if ( dao != null ) dao.listen(purgeSink, TRUE);
      }
    }
  }

  public void purgeCache(Object obj) {
    // Use Long instead of long so can use as a flag to drive clear user or clear cache
    Long userId = null;

    // Check for supported types to purge single user permission map
    if ( obj instanceof User ) {
      userId = ((User) obj).getId();
    } else if ( obj instanceof UserCapabilityJunction ) {
      userId = ((UserCapabilityJunction) obj).getSourceId();
    } else if ( obj instanceof GroupPermissionJunction ) {
      GroupPermissionJunction gpj = (GroupPermissionJunction) obj;
      for ( Object o  : userPermissionCache_.values() ) {
        Map m = (Map) o;
        String p = gpj.getTargetId();
        if ( p.endsWith(".*") ) {
          p = p.substring(0, p.length()-2);
          for ( Object o2 : m.keySet() ) {
            String p2 = (String) o2;
            if ( p2.startsWith(p) )
              m.remove(p2);
          }
        }
        m.remove(p);
      }
      return;
    }

    if ( userId != null ) {
      // Reset single user permission map
      userPermissionCache_.remove(userId);
    } else {
      // Reset permission cache
      userPermissionCache_.clear();
    }
  }

  @Override
  public void setX(X x) {
    super.setX(x);

    // TODO: Context is set on user permission cache for OM support, this can be removed when OM is removed from LRULinkListHashMap
    userPermissionCache_.setX(getX());
  }

  public void start() throws Exception {
    Timer timer = new Timer(this.getClass().getSimpleName());
    timer.schedule(new AgencyTimerTask(getX(), this), INITIAL_TIMER_DELAY);
  }

  protected Map<String, Boolean> getPermissionMap(User user) {
    long userId = user == null ? -1 : user.getId();
    Map<String, Boolean> map = userPermissionCache_.get(userId);
    if ( map == null ) {
      map = new ConcurrentHashMap<>();
      userPermissionCache_.put(userId, map);
    }

    return map;
  }

  private User getUserFromContext(X x) {
    if ( x != null ) {
      Subject subject = (Subject) x.get("subject");
      return subject.getUser();
    }

    return null;
  }
}
