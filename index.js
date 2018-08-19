const winston = require( 'winston' );
require( 'winston-gelf-pro' );
const path = require( 'path' );
const fs = require( 'fs' );
const mkdirp = require( 'mkdirp' );
const defaultsDeep = require( 'lodash/defaultsDeep' );

function isEmpty( value ) {
  return Boolean(value && typeof value == 'object') && !Object.keys(value).length;
}

function defaultAppname() {
  return path.basename( process.argv[1] ).replace( /\.js$/, '' );
}

let configDefaults = {
  includeNodeEnv: false,
  exitOn: {
    EADDRINFO: true,
    errorFatal: true,
    unhandledRejection: true,
    connectionErrors: false,
  },
  syslog: {
    enabled: false,
    level: 'info',
    port: 12201,
    server: 'localhost',
    type: 'RFC5424',
    facility: 'local0',
  },
  meta: {
    enabled: false,
    level: 'info',
    port: 3031,
    server: 'localhost',
    type: 'RFC5424',
    facility: 'local0',
  },
  console: {
    enabled: true,
    level: 'info',
  },
  file: {
    enabled: false,
    level: 'info',
    location: '/tmp',
  }
};

module.exports = function( _config, _appname ) {

  let config = defaultsDeep( _config, configDefaults );
  let appname = _appname || process.env.APP_NAME || defaultAppname();

  let transports = [];

  if ( config.console.enabled ) {
    transports.push(
      new winston.transports.Console({
	level: config.console.level,
	handleExceptions: true,
	humanReadableUnhandledException: true,
	colorize: true,
	timestamp: true,
	prettyPrint: function( meta ) {
	  if ( meta && meta.trace && meta.stack && meta.stack.length ) {
            if ( Array.isArray( meta.stack ) )
              return "\n" + meta.stack.slice(1).join( "\n" );
            else
              return "\n" + meta.stack;
	  }
	  else if ( meta && meta.message && meta.stack ) {
            return meta.stack;
	  }
	  return JSON.stringify( meta );
	},
      })
    );
  }

  if ( config.syslog.enabled ) {
    let fields = {};
    if ( config.includeNodeEnv ) fields.env = process.env.NODE_ENV;
    fields.program = appname;
    transports.push(
      new winston.transports.GelfPro({
	level: config.syslog.level,
	handleExceptions: true,
	humanReadableUnhandledException: true,
	gelfPro: {
	  fields: fields,
	  transform: [
            function(m) {
              if ( m.process && m.os && m.trace && m.stack ) {
		// This is an uncaught exception.  Format it so it shows up
		// in logregator nicer.
		m.short_message = m.stack.join('\n');
		delete m.date;
		delete m.process;
		delete m.os;
		delete m.trace;
		delete m.stack;
              }
              return m;
            }
	  ],
	  adapterName: 'udp',
	  adapterOptions: {
            protocol: 'udp4',
            host: config.syslog.server,
            port: config.syslog.port,
	  }
	}
      })
    );
  }

  if ( config.file.enabled ) {
    try {
      if ( ! fs.lstatSync( config.file.location ).isDirectory() )
        mkdirp.sync( config.file.location );
    } catch( err ) {
      console.log( 'Failed to create dir to store log file:', err.message );
      console.log( 'Falling back to /tmp...' );
      config.file.location = '/tmp';
    }
    transports.push(
      new (winston.transports.File)({
        handleExceptions: true,
        humanReadableUnhandledException: true,

        json: false,

        level: config.file.level,
        timestamp: true,
	prettyPrint: function( meta ) {
	  if ( meta && meta.trace && meta.stack && meta.stack.length ) {
            if ( Array.isArray( meta.stack ) )
              return "\n" + meta.stack.slice(1).join( "\n" );
            else
              return "\n" + meta.stack;
	  }
	  else if ( meta && meta.message && meta.stack ) {
            return meta.stack;
	  }
          if ( config.includeNodeEnv ) {
            if ( ! meta ) meta = { env: process.env.NODE_ENV };
            else if ( typeof meta === 'object' ) meta['env'] = process.env.NODE_ENV;
          }
	  return JSON.stringify( meta );
	},
        filename: path.join( config.file.location, appname + '.log' ),
      })
    );
  }

  let logger = new (winston.Logger)({
    transports: transports,
  });

  return logger;
}

