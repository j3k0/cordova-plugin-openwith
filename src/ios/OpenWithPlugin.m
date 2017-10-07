#import <Cordova/CDV.h>
#import "ShareViewController.h"
#import <MobileCoreServices/MobileCoreServices.h>

/*
 * Add base64 export to NSData
 */
@interface NSData (Base64)
- (NSString*)convertToBase64;
@end

@implementation NSData (Base64)
- (NSString*)convertToBase64 {
    const uint8_t* input = (const uint8_t*)[self bytes];
    NSInteger length = [self length];

    static char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    NSMutableData* data = [NSMutableData dataWithLength:((length + 2) / 3) * 4];
    uint8_t* output = (uint8_t*)data.mutableBytes;

    NSInteger i;
    for (i=0; i < length; i += 3) {
        NSInteger value = 0;
        NSInteger j;
        for (j = i; j < (i + 3); j++) {
            value <<= 8;

            if (j < length) {
                value |= (0xFF & input[j]);
            }
        }

        NSInteger theIndex = (i / 3) * 4;
        output[theIndex + 0] =                    table[(value >> 18) & 0x3F];
        output[theIndex + 1] =                    table[(value >> 12) & 0x3F];
        output[theIndex + 2] = (i + 1) < length ? table[(value >> 6)  & 0x3F] : '=';
        output[theIndex + 3] = (i + 2) < length ? table[(value >> 0)  & 0x3F] : '=';
    }

    NSString *ret = [[NSString alloc] initWithData:data encoding:NSASCIIStringEncoding];
#if ARC_DISABLED
    [ret autorelease];
#endif
    return ret;
}
@end

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
    NSUserDefaults *_userDefaults;
    int _verbosityLevel;
    NSString *_backURL;
}

@property (nonatomic,retain) NSString* loggerCallback;
@property (nonatomic,retain) NSString* handlerCallback;
@property (nonatomic) int verbosityLevel;
@property (nonatomic,retain) NSUserDefaults *userDefaults;
@property (nonatomic,retain) NSString *backURL;
@end

/*
 * OpenWithPlugin implementation
 */

@implementation OpenWithPlugin

@synthesize loggerCallback = _loggerCallback;
@synthesize handlerCallback = _handlerCallback;
@synthesize verbosityLevel = _verbosityLevel;
@synthesize userDefaults = _userDefaults;
@synthesize backURL = _backURL;

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
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
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
    self.userDefaults = [[NSUserDefaults alloc] initWithSuiteName:SHAREEXT_GROUP_IDENTIFIER];
    self.verbosityLevel = VERBOSITY_INFO;
    self.loggerCallback = nil;
    self.handlerCallback = nil;
}

- (void) onResume {
    [self debug:@"[onResume]"];
    [self checkForFileToShare];
}

- (void) setVerbosity:(CDVInvokedUrlCommand*)command {
    NSNumber *value = [command argumentAtIndex:0
                                   withDefault:[NSNumber numberWithInt: VERBOSITY_INFO]
                                      andClass:[NSNumber class]];
    self.verbosityLevel = value.integerValue;
    [self.userDefaults setInteger:self.verbosityLevel forKey:@"verbosityLevel"];
    [self.userDefaults synchronize];
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

- (NSString *)mimeTypeFromUti: (NSString*)uti {
    if (uti == nil) {
        return nil;
    }
    CFStringRef cret = UTTypeCopyPreferredTagWithClass((__bridge CFStringRef)uti, kUTTagClassMIMEType);
    NSString *ret = (__bridge_transfer NSString *)cret;
    return ret == nil ? uti : ret;
}

- (void) checkForFileToShare {
    [self debug:@"[checkForFileToShare]"];
    if (self.handlerCallback == nil) {
        [self debug:@"[checkForFileToShare] javascript not ready yet."];
        return;
    }

    [self.userDefaults synchronize];
    NSObject *object = [self.userDefaults objectForKey:@"image"];
    if (object == nil) {
        [self debug:@"[checkForFileToShare] Nothing to share"];
        return;
    }

    // Clean-up the object, assume it's been handled from now, prevent double processing
    [self.userDefaults removeObjectForKey:@"image"];

    // Extract sharing data, make sure that it is valid
    if (![object isKindOfClass:[NSDictionary class]]) {
        [self debug:@"[checkForFileToShare] Data object is invalid"];
        return;
    }
    NSDictionary *dict = (NSDictionary*)object;
    NSData *data = dict[@"data"];
    NSString *text = dict[@"text"];
    NSString *name = dict[@"name"];
    self.backURL = dict[@"backURL"];
    NSString *type = [self mimeTypeFromUti:dict[@"uti"]];
    if (![data isKindOfClass:NSData.class] || ![text isKindOfClass:NSString.class]) {
        [self debug:@"[checkForFileToShare] Data content is invalid"];
        return;
    }
    NSArray *utis = dict[@"utis"];
    if (utis == nil) {
        utis = @[];
    }

    // TODO: add the backURL to the shared intent, put it aside in the plugin
    // TODO: implement cordova.openwith.exit(intent), will check if backURL is set

    // Send to javascript
    [self debug:[NSString stringWithFormat:
        @"[checkForFileToShare] Sharing text \"%@\" and a %d bytes image",
        text, data.length]];

    NSString *uri = [NSString stringWithFormat: @"shareextension://index=0,name=%@,type=%@",
        name, type];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{
        @"action": @"SEND",
        @"exit": @YES,
        @"items": @[@{
            @"text" : text,
            @"base64": [data convertToBase64],
            @"type": type,
            @"utis": utis,
            @"uri": uri,
            @"name": name
        }]
    }];
    pluginResult.keepCallback = [NSNumber numberWithBool:YES];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.handlerCallback];
}

// Initialize the plugin
- (void) init:(CDVInvokedUrlCommand*)command {
    [self debug:@"[init]"];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    [self checkForFileToShare];
}

// Load data from URL
- (void) load:(CDVInvokedUrlCommand*)command {
    [self debug:@"[load]"];
    // Base64 data already loaded, so this shouldn't happen
    // the function is defined just to prevent crashes from unexpected client behaviours.
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Load, it shouldn't have been!"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// Exit after sharing
- (void) exit:(CDVInvokedUrlCommand*)command {
    [self debug:[NSString stringWithFormat:@"[exit] %@", self.backURL]];
    if (self.backURL != nil) {
        UIApplication *app = [UIApplication sharedApplication];
        NSURL *url = [NSURL URLWithString:self.backURL];
        if ([app canOpenURL:url]) {
            [app openURL:url];
        }
    }
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
// vim: ts=4:sw=4:et
