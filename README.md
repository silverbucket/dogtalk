![Dogtalk](http://sockethub.org/img/dogtalk-logo.svg)

An light-weight messaging client, built with [Sockethub](http://sockethub.org) and [remoteStorage](http://remotestorage.io).


## About

Dogtalk is being developed as a proof-of-concept app for [Sockethub](http://sockethub.org).

When completed, it will be a multi-protocol chat application designed to be fully [Unhosted](http://unhosted.org), relying on Sockethub for it's messaging capabilities, and [remoteStorage](http://remotestorage.io), for it's data storage.

The supported protocols will be: XMPP, IRC, Facebook, Twitter.

However inially the focus is just on XMPP. When that is fully functional, IRC will likely be next, followed by Facebook and Twitter.

## Current Status

**still under heavy development and considered pre-alpha**

Platforms:
XMPP: sending and receiving is implemented. TODO: presence, chat status, add/remove from buddy list, multi-accounts
IRC: not implemented
Facebook: not implemented
Twitter: not implemented

## Installation

There is no production build for Dogtalk right now. Currently the only way to use it is from a cloned repository.

### Prerequisites

#### Sockethub

**you must have a Sockethub instance running for Dogtalk to connect to**

For instructions on installing Sockethub, please see the [Sockethub README](http://github.com/sockethub/sockethub/)


### Dogtalk

    $ git clone https://github.com/sockethub/dogtalk.git

    $ cd dogtalk/

    $ python -m SimpleHTTPServer 9000

The above set of commands will check out the latest clone, and run a simple http server to access Dogtalk from your browser.

From a browser you should now be able to access: ```http://localhost:9000```


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/silverbucket/dogtalk/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

