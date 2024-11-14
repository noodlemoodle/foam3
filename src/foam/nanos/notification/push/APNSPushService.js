/**
 * @license
 * Copyright 2024 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.notification.push',
  name: 'APNSPushService',

  documentation: `Not called directly, called through WebPushService
  TODO: not very msp friendly at the moment, there is no way for WebPushService to find the right apnsPushService for a given app`,

  implements: [
    'foam.nanos.notification.push.PushService',
    'foam.nanos.auth.ServiceProviderAware'
  ],

  javaCode: `
    public void send(iOSNativePushRegistration sub, HashMap msg) {
      send(sub, msg, 0);
    }
  `,

  constants: [
    {
      type: 'int',
      name: 'MAX_RETRY_ATTEMPTS',
      documentation: 'Number of times service will try to deliver a notification if an exception is thrown',
      value: 3
    }
  ],

  javaImports: [
    'foam.core.X',
    'foam.dao.*',
    'foam.dao.ArraySink',
    'foam.nanos.auth.*',
    'foam.nanos.logger.Loggers',
    'foam.mlang.MLang',
    'foam.util.SafetyUtil',

    'java.security.Security',
    'java.util.List',
    'java.util.HashMap',
    'java.io.IOException',
    'java.util.concurrent.ExecutionException',

    'com.eatthepath.pushy.apns.*',
    'com.eatthepath.pushy.apns.util.*',
    'com.eatthepath.pushy.apns.util.concurrent.*',

    'foam.nanos.security.KeyStoreManager',
    'java.security.cert.X509Certificate',

    'java.time.temporal.ChronoUnit',
    'java.time.*'
  ],

  properties: [
    {
      class: 'Object',
      of: 'com.eatthepath.pushy.apns.ApnsClient',
      name: 'apnsClient',
      transient: true,
      javaFactory: `
        return buildClient();
      `
    },
    {
      class: 'String',
      name: 'apnsCredentialId',
      documentation: 'credential id to find for host and key data'
    },
    {
      class: 'Object',
      of: 'foam.nanos.notification.push.APNSCredential',
      name: 'apnsCredential',
      transient: true,
      javaFactory: `
        return getCredentials(getX());
      `
    }
  ],

  methods: [
    {
      name: 'sendPushById',
      javaCode:
      `
        //NO-OP
        return false;
      `
    },
    {
      name: 'sendPush',
      javaCode:
      `
        //NO-OP
        return false;
      `
    },
    {
      name: 'buildClient',
      type: 'ApnsClient',
      throws: 'IOException',
      javaCode:
      `
      return null;
        // Implement in a refinement, based on certificate and pub priv key location
      `
    },
    {
      name: 'send',
      args: 'iOSNativePushRegistration sub, HashMap msg, int attempt',
      type: 'Void',
      javaCode: `
          // Dont send notifications to subs that are in denied state
          if ( SafetyUtil.equals(sub.getLastKnownState(), "DENIED") ) {
            return;
          } 

          APNSCredential cred = (APNSCredential) getApnsCredential();
          if ( getApnsClient() == null || cred == null) {
            // TODO: replace with alarm
            System.err.println("Missing APNS Client/Credential");
          }

          final ApnsPayloadBuilder payloadBuilder = new SimpleApnsPayloadBuilder();
          payloadBuilder.setAlertBody((String) msg.get("body"));
          payloadBuilder.setAlertTitle((String) msg.get("title"));
          String payload = payloadBuilder.build();
          // Add a ttl for notifications on the payload
          String token = TokenUtil.sanitizeTokenString(sub.getEndpoint());

          // TTL for notification delivery, after this time apns will stop trying to deliver this notification
          // Currently hardcoded to 7 days
          Instant instant = Instant.now();
          instant = instant.plus(7, ChronoUnit.DAYS);
          SimpleApnsPushNotification pushNotification = new SimpleApnsPushNotification(token, cred.getAppBundleId(), payload, instant);

         try {
            // Asking the APNs client to send the notification
            // and creating the future that will return the status
            // of the push after it's sent.
            final PushNotificationFuture<SimpleApnsPushNotification, PushNotificationResponse<SimpleApnsPushNotification>> sendNotificationFuture = ((com.eatthepath.pushy.apns.ApnsClient) getApnsClient()).sendNotification(pushNotification);

            // getting the response from APNs
            final PushNotificationResponse<SimpleApnsPushNotification> pushNotificationResponse = sendNotificationFuture.get();
            if (pushNotificationResponse.isAccepted()) {
                // TODO: Replace with log
                System.out.println("Push notification accepted by APNs gateway.");
            } else {
                //TODO: Replace with alarms
                System.out.println("Notification rejected by the APNs gateway: " +
                        pushNotificationResponse.getRejectionReason());

                if (pushNotificationResponse.getTokenInvalidationTimestamp() != null) {
                    System.out.println("\t…and the token is invalid as of " +
                        pushNotificationResponse.getTokenInvalidationTimestamp());

                    // If notification is rejected with invalidation timestamp, change it's status
                    sub.setLastKnownState("DENIED");
                    ((DAO) getX().get("pushRegistrationDAO")).put(sub);
                }
            }
          } catch (final ExecutionException e) {
            // Should retry if it fails without explanation i.e. we never get a response from apple's servers however a rejection from the apple server should be considered permanent and no retry should be attempted
            System.err.println("Failed to send push notification.");
            e.printStackTrace();
            if ( attempt < MAX_RETRY_ATTEMPTS ) {
              attempt++;
              send(sub, msg, attempt);
            } 
          } catch (final Exception e) {
            // TODO: Replace with loggers
            System.err.println("Failed to send push notification.");
            e.printStackTrace();
          }
      `
    },

    {
      name: 'getCredentials',
      args: 'X x',
      type: 'APNSCredential',
      javaCode: `
        APNSCredential credentials = null;
        DAO credentialDAO = (DAO) x.get("credentialsDAO");
        credentials = (APNSCredential) credentialDAO.find(MLang.EQ(APNSCredential.ID, getApnsCredentialId()));
        return credentials;
      `
    }
  ]
});
