# cordova-plugin-openwith

<a href="https://fovea.cc"><img alt="Logo Fovea" src="https://fovea.cc/blog/wp-content/uploads/2017/09/fovea-logo-flat-128.png" height="50" /></a> &amp; <a href="https://www.interactivetools.com"><img alt="Logo InteractiveTools" src="https://www.interactivetools.com/assets/images/header/logo.png" height="59" /></a>

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> This plugin for [Apache Cordova](https://cordova.apache.org/) registers your app to handle certain types of files.

## Overview

You'd like your app to be listed in the **Send to...** section for certain types of files, on both **Android** and **iOS**? This is THE plugin! No need to meddle into Android's manifests and iOS's plist files, it's (almost) all managed for you by a no brainer one liner installation command.

## Table of Contents

- [Background](#background)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [License](#license)


## Background

iOS and Android each have their own ways of handing over files to an app. This plugin abstracts them behind a single and simplified interface. It does not expose all subtleties of each system, be this should be enough for 99% of people. Are you the 1% that needs more? Fork and PR if it makes sense, or [ask for help](mailto://contact@fovea.cc).

The plugin's API mostly follows Android's terminology.

Below is a short introduction to how the technology works on Android and iOS.

#### Android

On Android, the app defines, in its __AndroidManifest.xml__ file, the **mime type** of file types it can handle. Wildcard are accepted, so `image/*` can be used to accept all images regardless of the sub-type. The app also defines the type of actions accepted for this file types. By default, only the [SEND](https://developer.android.com/reference/android/content/Intent.html#ACTION_SEND) event is declared by the plugin. Other events that can be of interest are `SEND_MULTIPLE` and `VIEW`.

When a user sends a file to your app, the system provides an [Intent](https://developer.android.com/reference/android/content/Intent.html) to the application. An Intent is just an abstract description of an operation to be performed. This Intent defines an action and can be linked with internal URIs to one or more files through the ["stream" property](https://developer.android.com/reference/android/content/Intent.html#EXTRA_STREAM) attached to the intent. Starting Android 4.4 KitKat, [ClipData](https://developer.android.com/reference/android/content/ClipData.html) was introduced to mimick a sort of Clipboard used to exchange data between apps. Both methods are supported.

If you are interested to learn more, the documentations for [Intent.ACTION_SEND](https://developer.android.com/reference/android/content/Intent.html#ACTION_SEND), [ClipData](https://developer.android.com/reference/android/content/ClipData.html) and the [Clipboard Framework](https://developer.android.com/guide/topics/text/copy-paste.html) are good places to start.

#### iOS

On iOS, there are many ways apps can communicate. This plugin uses a [Share Extension](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/Share.html#//apple_ref/doc/uid/TP40014214-CH12-SW1). This is a particular type of App Extension which intent is, as Apple puts it: _"to post to a sharing website or share content with others"_.

A share extension can be used to share any type of content. You have to define which you want to support using an [Universal Type Identifier](https://developer.apple.com/library/content/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_intro/understand_utis_intro.html) (or UTI). For a full list of what your options are, please check [Apple's System-Declared UTI](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/UTIRef/Articles/System-DeclaredUniformTypeIdentifiers.html#//apple_ref/doc/uid/TP40009259-SW1).

As with all extensions, the flow of events is expected to be handled by a small app, external to your Cordova App but bundled with it. When installing the plugin, we will add a new target called **ShareExtension** to your XCode project which implements this Extension App. The Extension and the Cordova App live in different processes and can only communicate with each other using inter-app communication methods.

When a user posts some content using the Share Extension, the content will be stored in a Shared User-Preferences Container. To enable this, the Cordova App and Share Extension should define a group and add both the app and extension to it, manually. At the moment, it seems like it's not possible to automate the process. You can read more about this [here](http://www.atomicbird.com/blog/sharing-with-app-extensions).

Once the data is in place in the Shared User-Preferences Container, the Share Extension will open the Cordova App by calling a [Custom URL Scheme](https://developer.apple.com/library/content/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/Inter-AppCommunication/Inter-AppCommunication.html#//apple_ref/doc/uid/TP40007072-CH6-SW1). This seems a little borderline as Apple tries hard to prevent this from being possible, but brave iOS developers always find [solutions](https://stackoverflow.com/questions/24297273/openurl-not-work-in-action-extension/24614589#24614589)... So as for now there is one and it seems like people got their app pass the review process with it. The recommended solution is be to implement the posting logic in the Share Extension, but this doesn't play well with Cordova Apps architecture...

On the Cordova App side, the plugin checks listens for app start or resume events. When this happens, it looks into the Shared User-Preferences Container for any content to share and report it to the javascript application.

## Installation

Here's the promised one liner:

```
cordova plugin add cc.fovea.cordova.openwith \
  --variable ANDROID_MIME_TYPE="image/*" \
  --variable IOS_URL_SCHEME=ccfoveaopenwithdemo \
  --variable IOS_UNIFORM_TYPE_IDENTIFIER=public.image
```

| variable | example | notes |
|---|---|---|
| `ANDROID_MIME_TYPE` | image/* | **Android only** Mime type of documents you want to share (wildcards accepted) |
| `IOS_URL_SCHEME` | uniquelonglowercase | **iOS only** Any random long string of lowercase alphabetical characters |
| `IOS_UNIFORM_TYPE_IDENTIFIER` | public.image | **iOS only** UTI of documents you want to share (check [Apple's System-Declared UTI](https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/UTIRef/Articles/System-DeclaredUniformTypeIdentifiers.html#//apple_ref/doc/uid/TP40009259-SW1)) |
| `IOS_GROUP_IDENTIFIER` | group.my.app.id | **iOS only** Custom app group name. Default is `group.<YOUR_APP_BUNDLE_ID>.shareextension`. |
| `SHAREEXT_PROVISIONING_PROFILE` | 9dfsdf-.... | **iOS only** UUID of provisioning profile for singing |
| `SHAREEXT_DEVELOPMENT_TEAM` | 00B000A09l | **iOS only** Developer account teamId |

It shouldn't be too hard. But just in case, I [posted a screencast of it](https://youtu.be/eaE4m_xO1mg).

### Advanced installation options

If you do not need anything fancy, you can skip this section.

**Android: accept extra actions**

On Android, you can define more supported actions (see the "Background" section above to learn more about this).

Use the `ANDROID_EXTRA_ACTIONS` to accept additional actions. The variable should contain one or more valid XML action-elements. Example:

```
MY_EXTRA_ACTIONS='<action android:name="android.intent.action.VIEW" />'
cordova plugin add cc.fovea.cordova.openwith \
  --variable ANDROID_MIME_TYPE="image/*" \
  --variable "ANDROID_EXTRA_ACTIONS=$MY_EXTRA_ACTIONS"
```

To specify more than one extra action, just put them all in the `ANDROID_EXTRA_ACTIONS`:

```
MY_EXTRA_ACTIONS='<action ... /><action ... />'
```

## Usage

```js
document.addEventListener('deviceready', setupOpenwith, false);

function setupOpenwith() {

  // Increase verbosity if you need more logs
  //cordova.openwith.setVerbosity(cordova.openwith.DEBUG);

  // Initialize the plugin
  cordova.openwith.init(initSuccess, initError);

  function initSuccess()  { console.log('init success!'); }
  function initError(err) { console.log('init failed: ' + err); }

  // Define your file handler
  cordova.openwith.addHandler(myHandler);

  function myHandler(intent) {
    console.log('intent received');

    console.log('  action: ' + intent.action); // type of action requested by the user
    console.log('  exit: ' + intent.exit); // if true, you should exit the app after processing

    for (var i = 0; i < intent.items.length; ++i) {
      var item = intent.items[i];
      console.log('  type: ', item.type);   // mime type
      console.log('  uri:  ', item.uri);     // uri to the file, probably NOT a web uri

      // some optional additional info
      console.log('  text: ', item.text);   // text to share alongside the item, iOS only
      console.log('  name: ', item.name);   // suggested name of the image, iOS 11+ only
      console.log('  utis: ', item.utis);
      console.log('  path: ', item.path);   // path on the device, generally undefined
    }

    // ...
    // Here, you probably want to do something useful with the data
    // ...
    // An example...

    if (intent.items.length > 0) {
      cordova.openwith.load(intent.items[0], function(data, item) {

        // data is a long base64 string with the content of the file
        console.log("the item weights " + data.length + " bytes");
        uploadToServer(item);

        // "exit" when done.
        // Note that there is no need to wait for the upload to finish,
        // the app can continue while in background.
        if (intent.exit) { cordova.openwith.exit(); }
      });
    }
    else {
      if (intent.exit) { cordova.openwith.exit(); }
    }
  }
}
```

Check out the [demo project](https://github.com/j3k0/cordova-plugin-openwith-demo) for a functional example.

## API

### cordova.openwith.setVerbosity(level)

Change the verbosity level of the plugin.

`level` can be set to:

 - `cordova.openwith.DEBUG` for maximal verbosity, log everything.
 - `cordova.openwith.INFO` for the default verbosity, log interesting stuff only.
 - `cordova.openwith.WARN` for low verbosity, log only warnings and errors.
 - `cordova.openwith.ERROR` for minimal verbosity, log only errors.

### cordova.openwith.addHandler(handlerFunction)

Add an handler function, that will get notified when a file is received.

**Handler function**

The signature for the handler function is `function handlerFunction(intent)`. See below for what an intent is.

**Intent**

`intent` describe the operation to perform, toghether with the associated data. It has the following fields:

 - `action`: the desired action. see below for possible values.
 - `exit`: true if the app should exit after processing.
 - `items`: an array containing one or more data descriptor.

**Action**

Here are the possible actions.

 - `cordova.openwith.SEND`: when the user wants to send the file(s)
 - `cordova.openwith.VIEW`: when the user wants to view the file(s)

**Data descriptor**

A data descriptor describe one file. It is a javascript object with the following fields:

 - `uri`: uri to the file.
   - _probably NOT a web uri, use `load()` if you want the data from this uri._
 - `type`: the mime type.
 - `text`: text entered by the user when sharing (**iOS only**)
 - `name`: suggested file name, generally undefined.
 - `path`: path on the device, generally undefined.
 - `utis`: list of UTIs the file belongs to (**iOS only**).
 - `base64`: a long base64 string with the content of the file.
   - _might be undefined until `load()` has been called and completed successfully._

### cordova.openwith.load(dataDescriptor, loadSuccessCallback, loadErrorCallback)

Load data for an item. `dataDescriptor` is an item in an intent's items list, see the section about `addHandler()` above for details.

**loadSuccessCallback**: function (base64, dataDescriptor)

When data has been successfully loaded, `loadSuccessCallback` will be called. It is expected to have the following signature: `function (base64, dataDescriptor)`

`base64` is a long string containing the data. `dataDescriptor` is the loaded `dataDescriptor`, extended to contain the `base64` field.

**loadErrorCallback**: function (err, dataDescriptor)

Called when data can't be loaded.

### cordova.openwith.exit()

Attempt to return the the calling app when sharing is done. Your app will be backgrounded,
it should be able to finish the upload.

On iOS, this call might have no effects. The plugin needs to recognize the app
you are sharing from in order to send you back to it. The user can still select the
"Back-to-app" button visible on the top left. Make sure your UI shows the user
that he can now safely go back to what he was doing.

On Android, the app will be backgrounded no matter what.

## Contribute

Contributions in the form of GitHub pull requests are welcome. Please adhere to the following guidelines:
  - Before embarking on a significant change, please create an issue to discuss the proposed change and ensure that it is likely to be merged.
  - Follow the coding conventions used throughout the project. Many conventions are enforced using eslint and pmd. Run `npm t` to make sure of that.
  - Any contributions must be licensed under the MIT license.

## License

[MIT](./LICENSE) © Fovea.cc
