docker-logregator
=================

This is a [docker-logger](https://github.com/peebles/docker-logger) compatible library for logging.
It uses the newer light weight [logregator](https://github.com/peebles/logregator) server instead of
an ELK stack.  Application code and configuration should not have to change much to use this lib
instead of the older one.

## Changes Required

```sh
npm uninstall docker-logger
npm install docker-logregator
```

Find where docker-logger is required and change the library name.

You may need to edit "config.json" and remove the "syslog" port.  This library will default it to
12201, which is what logregator uses by default.  You can remove the syslog protocol too.

