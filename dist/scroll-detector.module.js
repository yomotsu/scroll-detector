/*!
 * scroll-detector
 * https://github.com/yomotsu/scroll-detector
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
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

var ENUM_AT_TOP = 0;
var ENUM_AT_BOTTOM = 1;

var scrollDetector = new EventEmitter();
var html = document.documentElement;
var body = document.body;

var scrollY = null;
var lastScrollY = null;
var lastWindowHeight = window.innerHeight;
var previousAt = null;
var isMuted = false;
var isUpScroll = null;

var throttleLast = void 0;
var throttleDeferTimer = void 0;

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

function getScrollY() {

	return html.scrollTop || body.scrollTop;
}

function onScroll() {

	if (isMuted) return;

	scrollY = getScrollY();

	// ページ表示後に初めて、自動で発生するスクロール。
	// ブラウザにより自動で引き起こされる。
	// ユーザーによる操作ではないので、スクロール方向判定は無視する
	if (!lastScrollY) {

		lastScrollY = scrollY;
		scrollDetector.emit({ type: 'scroll' });
		return;
	}

	var pageHeight = html.scrollHeight;
	var windowHeight = window.innerHeight;
	var maxScroll = pageHeight - windowHeight;

	// ページ表示直後以外はスクロールをthrottleする。
	// ただし、ページ上部付近、下部付近では
	// at top / at bottom 到達判定の精度向上のためにthrottleしない
	var now = Date.now();
	var isNearPageTop = scrollY <= 100;
	var isNearPageBottom = maxScroll <= scrollY + 100;
	var throttleThreshhold = isNearPageTop || isNearPageBottom ? 0 : 100; //ms
	var isThrottled = throttleLast && now < throttleLast + throttleThreshhold;

	if (isThrottled) {

		clearTimeout(throttleDeferTimer);
		throttleDeferTimer = setTimeout(function () {

			throttleLast = now;
			onScroll();
		}, throttleThreshhold);

		return;
	} else {

		throttleLast = now;
	}

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
	var isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== isUpScroll;

	if (isDirectionChanged) {

		if (isUpScroll) scrollDetector.emit({ type: 'change:up' });
		if (!isUpScroll) scrollDetector.emit({ type: 'change:down' });
	}

	if (isUpScroll) scrollDetector.emit({ type: 'scroll:up' });
	if (!isUpScroll) scrollDetector.emit({ type: 'scroll:down' });
}

window.addEventListener('scroll', onScroll);

export default scrollDetector;
