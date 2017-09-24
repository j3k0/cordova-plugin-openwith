# cordova-plugin-openwith

<a href="https://fovea.cc"><img alt="Logo Fovea" src="https://fovea.cc/blog/wp-content/uploads/2017/09/fovea-logo-flat-128.png" height="59" /></a> &amp; <a href="https://www.interactivetools.com"><img alt="Logo InteractiveTools" src="https://www.interactivetools.com/assets/images/header/logo.png" height="59" /></a>

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> This plugin for [Apache Cordova](https://cordova.apache.org/) registers your app to open certain types of files.

## Overview
You'd like your app to be listed in the **Open With...** section for certain types of files, on both **Android** and **iOS**? This is THE plugin! No need to meddle into Android's manifests and iOS's plist files, it's all managed for you by a no brainer one liner installation command.

## Table of Contents

- [Background](#background)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API](#api)
- [License](#license)


## Background
_If your module depends on important but not widely known abstractions or other ecosystems, explain them here. This is also a good place to explain the module's motivation if similar modules already exist._

 * https://stackoverflow.com/questions/2774343/how-do-i-associate-file-types-with-an-iphone-application/2781290#2781290
 * https://stackoverflow.com/questions/3760276/android-intent-filter-associate-app-with-file-extension

## Installation

    cordova plugin add .. --variable MIME_TYPE="image/*"

## Configuration
_If your module requires configuration before developers can use it, explain it in this section._

## Usage
_Show developers what a module looks like in action so they can quickly determine whether the example meets their needs. This section should contain clear, runnable code examples._

Check out a [demo project](https://github.com/j3k0/cordova-plugin-openwith-demo) for an fully functional example.

## API
_The API section should detail the module's objects and functions, their signatures, return types, callbacks, and events in detail. Types should be included where they aren't obvious. Caveats should be made clear._

## Contribute

Contributions in the form of GitHub pull requests are welcome. Please adhere to the following guidelines:
  - Before embarking on a significant change, please create an issue to discuss the proposed change and ensure that it is likely to be merged.
  - Follow the coding conventions used throughout the project. Many conventions are enforced using eslint.
  - Any contributions must be licensed under the MIT license.


## License

[MIT](./LICENSE) © Fovea.cc
