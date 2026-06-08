import pkg from '../package.json' with { type: 'json' }

export const PKG_VERSION = pkg.version
export const PKG_NAME = pkg.name
