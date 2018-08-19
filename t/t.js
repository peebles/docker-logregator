let config = {
  "console": { "enabled": true, "level": "debug" },
  "file": {"enabled": false },
  "syslog": {
    "enabled": true,
    "level": "debug",
    "server": "192.168.99.100"
  }
};
let appname = 'MYTEST';
const logger = require( '../index' )( config, appname );
logger.info( 'This is a TEST' );
setTimeout(() => {
  process.exit(0);
}, 1000 );
