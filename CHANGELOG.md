# 0.2.1

#### New

 - `fulfilled` event that is triggered once an expectation is met in a received message.

# 0.2.0

#### New

 - `expect([expectation] [, seconds])` method for setting an expectation on the WS instance to receive a message from the server.
 - `assert(data)` method for making assertions on the received message to meet the set expectation.
 - `expect` option for setting an expectation on the WS instance for an incoming message. Defaults to `null`.
 - `expectSeconds` option a timeout in seconds for the above expectation. If not met by that time a `timeout` event is triggered. Defaults to `7`. 
 - `timeout` event triggered when a set expectation is not met by `expectSeconds` seconds. This means the client seems connected but is unable to send and/or receive data  from the server.

#### Changed

 - `expectation` 2nd argument for `send()` method for setting an expectation for a message or simply `true` to activate an expectation using the `expect` option.
 - `seconds` 3rd argument for `send()` method for setting an timeout for expectation for a message.
 - `WS` constructor now allows `null`/`false` values for `typeAttribute`/`dataAttribute` options for disabling them.

# 0.1.3

#### New

 - `retries` option that allows limiting the number of `open()` retries.
 - `noretries` event that is triggered once the counter of open retries is exhausted.

#### Changed

 - `isOpen` is passed as second argument to `error` event handler.

# 0.1.2

#### Fixed:

 - Error when using default events.
