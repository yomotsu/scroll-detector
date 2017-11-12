# scrollDetector

`scrollDetector` detects scroll event types: scroll derection and whether page-top or page-bottom or middle.

[![Latest NPM release](https://img.shields.io/npm/v/scroll-detector.svg)](https://www.npmjs.com/package/scroll-detector)
![MIT License](https://img.shields.io/npm/l/scroll-detector.svg)

## Example

- [basic](https://yomotsu.github.io/scroll-detector/examples/basic.html)

## Usage

```shell
$ npm install --save scroll-detector
```

then

```javascript
import scrollDetector from 'scroll-detector';

scrollDetector.on( 'scroll', () => {
	console.log( 'scroll' );
} );

scrollDetector.on( 'scroll:up', () => {
	console.log( 'scroll:up' );
} );

scrollDetector.on( 'scroll:down', () => {
	console.log( 'scroll:down' );
} );

scrollDetector.on( 'at:top', () => {
	console.log( 'at:top' );
} );

scrollDetector.on( 'at:bottom', () => {
	console.log( 'at:bottom' );
} );
```

## Other features

- `scrollDetector.off( eventName, func )` to remove the listener.
- `scrollDetector.getScrollTop()` will return scrollTop amount in pixels.
- `scrollDetector.mute()` to disabled the detector.
- `scrollDetector.unmute()` to re-enable the detector.

