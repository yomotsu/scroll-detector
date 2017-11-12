/*!
 * scroll-detector
 * https://github.com/yomotsu/scroll-detector
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.scrollDetector = factory());
}(this, (function () { 'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	// based on https://github.com/mrdoob/eventdispatcher.js

	var EventEmitter = function () {
		function EventEmitter() {
			_classCallCheck(this, EventEmitter);

			this._listeners = {};
		}

		EventEmitter.prototype.on = function on(type, listener) {

			var listeners = this._listeners;

			if (listeners[type] === undefined) {

				listeners[type] = [];
			}

			if (listeners[type].indexOf(listener) === -1) {

				listeners[type].push(listener);
			}
		};

		EventEmitter.prototype.hasListener = function hasListener(type, listener) {

			var listeners = this._listeners;

			if (listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1) {

				return true;
			}

			return false;
		};

		EventEmitter.prototype.off = function off(type, listener) {

			var listeners = this._listeners;
			var listenerArray = listeners[type];

			if (listenerArray !== undefined) {

				var index = listenerArray.indexOf(listener);

				if (index !== -1) {

					listenerArray.splice(index, 1);
				}
			}
		};

		EventEmitter.prototype.emit = function emit(event) {

			var listeners = this._listeners;
			var listenerArray = listeners[event.type];

			if (listenerArray !== undefined) {

				event.target = this;

				var array = [],
				    i = 0;
				var length = listenerArray.length;

				for (i = 0; i < length; i++) {

					array[i] = listenerArray[i];
				}

				for (i = 0; i < length; i++) {

					array[i].call(this, event);
				}
			}
		};

		return EventEmitter;
	}();

	function throttle(fn, threshhold) {

		var last = void 0,
		    deferTimer = void 0;

		return function () {

			var now = Date.now();

			if (last && now < last + threshhold) {

				clearTimeout(deferTimer);
				deferTimer = setTimeout(function () {

					last = now;
					fn();
				}, threshhold);
			} else {

				last = now;
				fn();
			}
		};
	}

	var THRESHOLD = 30;
	var ENUM_AT_TOP = 0;
	var ENUM_AT_BOTTOM = 1;

	var scrollDetector = new EventEmitter();
	var html = document.documentElement;
	var body = document.body;

	var scrollY = null;
	var lastScrollY = null;
	var lastWindowHeight = window.innerHeight;
	var previousAt = null;
	var directionStartY = lastScrollY;
	var isMuted = false;
	var isUpScroll = null;
	var eventFired = false;

	// mute中はイベントをエミットしない
	scrollDetector.mute = function () {

		isMuted = true;
	};

	scrollDetector.unmute = function () {

		lastScrollY = getScrollY();
		isMuted = false;
	};

	scrollDetector.getScrollTop = function () {
		return scrollY;
	};

	window.addEventListener('scroll', throttle(function () {

		if (isMuted) return;

		scrollY = getScrollY();

		// ページ表示後に初めて、自動で発生するスクロール。
		// ブラウザにより自動で引き起こされる。
		// ユーザーによる操作ではないので、スクロール方向判定は無視する
		if (!lastScrollY) {

			lastScrollY = scrollY;
			directionStartY = lastScrollY;
			scrollDetector.emit({ type: 'scroll' });
			return;
		}

		var pageHeight = html.scrollHeight;
		var windowHeight = window.innerHeight;
		var maxScroll = pageHeight - windowHeight;
		// iOSの場合、慣性スクロールでマイナスになる。
		var isPageTop = scrollY <= 0;
		// iOSの場合、慣性スクロールでページ高さ以上になる。
		var isPageBottom = maxScroll <= scrollY;

		// ページ表示直後、Chromeではスクロールをしていないのに
		// 数回scrollイベントが発動する。
		// それを抑止する。
		// このとき、ページをスクロールした状態でのリロードだった場合、1pxの誤差がある
		if (Math.abs(scrollY - lastScrollY) <= 1 && !isPageTop && !isPageBottom) {

			return;
		}

		scrollDetector.emit({ type: 'scroll' });

		if (isPageTop) {

			if (previousAt !== ENUM_AT_TOP) {

				scrollDetector.emit({ type: 'at:top' });
				previousAt = ENUM_AT_TOP;
			}

			lastScrollY = 0;
			return;
		}

		if (isPageBottom) {

			if (previousAt !== ENUM_AT_BOTTOM) {

				scrollDetector.emit({ type: 'at:bottom' });
				previousAt = ENUM_AT_BOTTOM;
			}

			lastScrollY = maxScroll;
			return;
		}

		previousAt = null;

		var isWindowResized = windowHeight !== lastWindowHeight;
		lastWindowHeight = windowHeight;

		// スクロール中にiOSのURLバーの有無などでウインドウサイズが変わると
		// スクロール方向を正しく計算できない
		// その場合、スクロール方向判定は無視する
		if (isWindowResized) {

			lastScrollY = scrollY;
			return;
		}

		var isUpScrollPrev = isUpScroll;
		isUpScroll = scrollY - lastScrollY < 0;
		lastScrollY = scrollY;
		var isDirectionChanged = isUpScrollPrev !== isUpScroll;

		if (isUpScroll) scrollDetector.emit({ type: 'scroll:up' });
		if (!isUpScroll) scrollDetector.emit({ type: 'scroll:down' });

		if (isDirectionChanged) {

			directionStartY = scrollY;
			eventFired = false;

			if (!isUpScroll) scrollDetector.emit({ type: 'change:down' });
		}

		if (!eventFired && Math.abs(directionStartY - scrollY) >= THRESHOLD) {

			eventFired = true;

			if (isUpScroll) scrollDetector.emit({ type: 'delay:up' });
			// if ( ! isUpScroll ) scrollDetector.emit( { type: 'delay:down' } );
		}
	}), 60);

	function getScrollY() {

		return html.scrollTop || body.scrollTop;
	}

	return scrollDetector;

})));
