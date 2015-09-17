# 0.1.3

#### Enhancements

 - New `retries` option that allows limiting the number of `open()` retries.
 - New `noretries` event that is triggered once the counter of open retries is exhausted.
 - `isOpen` is passed as second argument to `error` event handler.

# 0.1.2

#### Bug fixes:

 - Fixed error when using default events.
