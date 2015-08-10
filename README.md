Backbone.WS
===========

Backbone on native WebSockets.

## What is Backbone.WS

A simple and robust facade for Backbone's Models and Collections for using WebSocket as a transport.

## Features

* Gorgeous API.
* Single WebSocket can serve multiple resources.
* Routing of messages to specific resources.
* Handles initial connection and reconnect.
* Can replace the default XHR transport (`sync`) - and allows opting out back to XHR.
* Easy debugging of messages and events.
* Built on top of `Backbone.Event`.

## Usage

### API

## Installing

* Download the source
* Or install via [npm](https://www.npmjs.com/):

```
> npm install backbone.ws
```

* Or install via [Bower](http://bower.io/):

```
> bower install backbone.ws
```

## Supported Browsers

Wherever the native WebSocket is supported, or [see here](http://caniuse.com/#feat=websockets); 

## Testing

Backbone.WS uses Intern as test runner and Chai for assertions.

To run tests do:

```
> npm test
```

## License

Backbone.WS is licensed under the BSD 2-Clause License. Please see the LICENSE file for the full license.

Copyright (c) 2015 Yehonatan Daniv.
