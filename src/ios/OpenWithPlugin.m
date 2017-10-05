#import <Cordova/CDV.h>

/*
 * Helper function to deal with cordova command arguments
 */
// static BOOL getBoolArgument(CDVInvokedUrlCommand *command, int index, BOOL default_) {
//     NSNumber *value = [command argumentAtIndex:index withDefault:[NSNumber numberWithBool: default_] andClass:[NSNumber class]];
//     return value.boolValue;
// }

static int getIntArgument(CDVInvokedUrlCommand *command, int index, int default_) {
    NSNumber *value = [command argumentAtIndex:index withDefault:[NSNumber numberWithInt: default_] andClass:[NSNumber class]];
    return value.integerValue;
}

static NSString *getStringArgument(CDVInvokedUrlCommand *command, int index, NSString *default_) {
    return [command argumentAtIndex:index withDefault:default_ andClass:[NSString class]];
}

/*
 * Constants
 */

#define VERBOSITY_DEBUG  0
#define VERBOSITY_INFO  10
#define VERBOSITY_WARN  20
#define VERBOSITY_ERROR 30

/*
 * State variables
 */

static NSDictionary* launchOptions = nil;

/*
 * OpenWithPlugin definition
 */

@interface OpenWithPlugin : CDVPlugin {
    NSString* _loggerCallback;
    NSString* _handlerCallback;
    int _verbosityLevel;
}

@property (nonatomic,retain) NSString* loggerCallback;
@property (nonatomic,retain) NSString* handlerCallback;
@property (nonatomic) int verbosityLevel;
@end

/*
 * OpenWithPlugin implementation
 */

@implementation OpenWithPlugin

@synthesize loggerCallback = _loggerCallback;
@synthesize handlerCallback = _handlerCallback;
@synthesize verbosityLevel = _verbosityLevel;

//
// Retrieve launchOptions
//
// The plugin mechanism doesn’t provide an easy mechanism to capture the
// launchOptions which are passed to the AppDelegate’s didFinishLaunching: method.
//
// Therefore we added an observer for the
// UIApplicationDidFinishLaunchingNotification notification when the class is loaded.
//
// Source: https://www.plotprojects.com/blog/developing-a-cordova-phonegap-plugin-for-ios/
//
+ (void) load {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didFinishLaunching:)
                                               name:UIApplicationDidFinishLaunchingNotification
                                             object:nil];
}

+ (void) didFinishLaunching:(NSNotification*)notification {
    launchOptions = notification.userInfo;
    if (launchOptions == nil) {
        //launchOptions is nil when not start because of notification or url open
        launchOptions = [NSDictionary dictionary];
    }
}

- (void) log:(int)level message:(NSString*)message {
    if (level >= self.verbosityLevel) {
        NSLog(@"[OpenWithPlugin.m]%@", message);
        if (self.loggerCallback != nil) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:message];
            pluginResult.keepCallback = [NSNumber  numberWithBool:YES];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loggerCallback];
        }
    }
}
- (void) debug:(NSString*)message { [self log:VERBOSITY_DEBUG message:message]; }
- (void) info:(NSString*)message { [self log:VERBOSITY_INFO message:message]; }
- (void) warn:(NSString*)message { [self log:VERBOSITY_WARN message:message]; }
- (void) error:(NSString*)message { [self log:VERBOSITY_ERROR message:message]; }

- (void) pluginInitialize {
    // You can listen to more app notifications, see:
    // http://developer.apple.com/library/ios/#DOCUMENTATION/UIKit/Reference/UIApplication_Class/Reference/Reference.html#//apple_ref/doc/uid/TP40006728-CH3-DontLinkElementID_4

    // NOTE: if you want to use these, make sure you uncomment the corresponding notification handler

    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onOrientationWillChange) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onOrientationDidChange) name:UIApplicationDidChangeStatusBarOrientationNotification object:nil];

    // Added in 2.5.0
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(pageDidLoad:) name:CDVPageDidLoadNotification object:self.webView];
    //Added in 4.3.0
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewWillAppear:) name:CDVViewWillAppearNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewDidAppear:) name:CDVViewDidAppearNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewWillDisappear:) name:CDVViewWillDisappearNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewDidDisappear:) name:CDVViewDidDisappearNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewWillLayoutSubviews:) name:CDVViewWillLayoutSubviewsNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewDidLayoutSubviews:) name:CDVViewDidLayoutSubviewsNotification object:nil];
    // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(viewWillTransitionToSize:) name:CDVViewWillTransitionToSizeNotification object:nil];
    [self onReset];
    [self info:@"[pluginInitialize] OK"];
}

- (void) onReset {
    [self info:@"[onReset]"];
    self.verbosityLevel = VERBOSITY_INFO;
    self.loggerCallback = nil;
    self.handlerCallback = nil;
}

/*
//
// NOTE: calls into JavaScript must not call or trigger any blocking UI, like alerts.
//
- (void) handleOpenURLWithApplicationSourceAndAnnotation: (NSNotification*)notification {
    
    // override to handle urls sent to your app
    // register your url schemes in your App-Info.plist
    
    // The notification object is an NSDictionary which contains
    // - url which is a type of NSURL
    // - sourceApplication which is a type of NSString and represents the package id of the app that calls our app
    // - annotation which a type of Property list which can be several different types
    // please see https://developer.apple.com/library/content/documentation/General/Conceptual/DevPedia-CocoaCore/PropertyList.html
    
    NSDictionary*  notificationData = [notification object];
    
    if ([notificationData isKindOfClass: NSDictionary.class]){
        
        NSURL* url = notificationData[@"url"];
        NSString* sourceApplication = notificationData[@"sourceApplication"];
        id annotation = notificationData[@"annotation"];
        
        if ([url isKindOfClass:NSURL.class] && [sourceApplication isKindOfClass:NSString.class] && annotation) {
            // TODO: Do your thing!
        }
    }
}
*/

- (void) setVerbosity:(CDVInvokedUrlCommand*)command {
    self.verbosityLevel = getIntArgument(command, VERBOSITY_INFO, NO);
    [self debug:[NSString stringWithFormat:@"[setVerbosity] %d", self.verbosityLevel]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) setLogger:(CDVInvokedUrlCommand*)command {
    self.loggerCallback = command.callbackId;
    [self debug:[NSString stringWithFormat:@"[setLogger] %@", self.loggerCallback]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT];
    pluginResult.keepCallback = [NSNumber  numberWithBool:YES];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) setHandler:(CDVInvokedUrlCommand*)command {
    self.handlerCallback = command.callbackId;
    [self debug:[NSString stringWithFormat:@"[setHandler] %@", self.handlerCallback]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT];
    pluginResult.keepCallback = [NSNumber  numberWithBool:YES];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// Initialize the plugin
- (void) init:(CDVInvokedUrlCommand*)command {
    [self debug:@"[init]"];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

    // Check launchOptions, emit an 'Intent' if applicable.
    // TODO
}

// Load data from URL
- (void) load:(CDVInvokedUrlCommand*)command {
    [self debug:@"[load]"];
    NSString *url = getStringArgument(command, 0, nil);
    if (url != nil) {
    }
}

@end
// vim: ts=4:sw=4:et
