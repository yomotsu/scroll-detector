/*!
 * scroll-detector
 * https://github.com/[object Object]
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.scrollDetector = factory());
}(this, (function () { 'use strict';

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise */

	var extendStatics = function(d, b) {
	    extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	    return extendStatics(d, b);
	};

	function __extends(d, b) {
	    if (typeof b !== "function" && b !== null)
	        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	    extendStatics(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var EventEmitter = (function () {
	    function EventEmitter() {
	        this._listeners = {};
	    }
	    EventEmitter.prototype.on = function (type, listener) {
	        var listeners = this._listeners;
	        if (listeners[type] === undefined)
	            listeners[type] = [];
	        if (listeners[type].indexOf(listener) === -1)
	            listeners[type].push(listener);
	    };
	    EventEmitter.prototype.hasListener = function (type, listener) {
	        var listeners = this._listeners;
	        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	    };
	    EventEmitter.prototype.off = function (type, listener) {
	        var listeners = this._listeners;
	        var listenerArray = listeners[type];
	        if (listenerArray !== undefined) {
	            var index = listenerArray.indexOf(listener);
	            if (index !== -1)
	                listenerArray.splice(index, 1);
	        }
	    };
	    EventEmitter.prototype.emit = function (event) {
	        var listeners = this._listeners;
	        var listenerArray = listeners[event.type];
	        if (listenerArray !== undefined) {
	            event.target = this;
	            var array = listenerArray.slice(0);
	            for (var i = 0, l = array.length; i < l; i++) {
	                array[i].call(this, event);
	            }
	        }
	    };
	    return EventEmitter;
	}());

	var ENUM_AT_TOP = 0;
	var ENUM_AT_BOTTOM = 1;
	var isBrowser = typeof window !== 'undefined';
	var $html = isBrowser ? document.documentElement : null;
	var $body = isBrowser ? document.body : null;
	var ScrollDetector = (function (_super) {
	    __extends(ScrollDetector, _super);
	    function ScrollDetector() {
	        var _this = _super.call(this) || this;
	        var maxScroll = $html ? getPageHeight() - $html.clientHeight : 0;
	        var scrollY = getScrollY();
	        var state = {
	            scrollY: scrollY,
	            lastScrollY: null,
	            scrollProgress: $html ? scrollY / (getPageHeight() - $html.clientHeight) : 0,
	            lastViewportHeight: $html ? $html.clientHeight : 0,
	            previousAt: null,
	            isMuted: false,
	            isUpScroll: null,
	            isPageTop: scrollY <= 0,
	            isPageBottom: maxScroll <= scrollY,
	            throttleLast: -1,
	            throttleDeferTimer: -1,
	        };
	        _this.mute = function () {
	            state.isMuted = true;
	        };
	        _this.unmute = function () {
	            state.lastScrollY = getScrollY();
	            state.isMuted = false;
	        };
	        _this.getScrollTop = function () { return state.scrollY; };
	        _this.getScrollProgress = function () { return state.scrollProgress; };
	        _this.isPageTop = function () { return state.isPageTop; };
	        _this.isPageBottom = function () { return state.isPageBottom; };
	        var onScroll = function () {
	            if (state.isMuted)
	                return;
	            state.scrollY = getScrollY();
	            state.scrollProgress = $html ? state.scrollY / (getPageHeight() - $html.clientHeight) : 0;
	            if (!state.lastScrollY) {
	                state.lastScrollY = state.scrollY;
	                _this.emit({ type: 'scroll' });
	                return;
	            }
	            var pageHeight = getPageHeight();
	            var viewportHeight = $html ? $html.clientHeight : 0;
	            var maxScroll = pageHeight - viewportHeight;
	            var now = Date.now();
	            var isNearPageTop = state.scrollY <= 100;
	            var isNearPageBottom = maxScroll <= state.scrollY + 100;
	            var throttleThreshold = isNearPageTop || isNearPageBottom ? 0 : 100;
	            var isThrottled = state.throttleLast && now < state.throttleLast + throttleThreshold;
	            if (isThrottled) {
	                clearTimeout(state.throttleDeferTimer);
	                state.throttleDeferTimer = window.setTimeout(function () {
	                    state.throttleLast = now;
	                    onScroll();
	                }, throttleThreshold);
	                return;
	            }
	            else {
	                state.throttleLast = now;
	            }
	            state.isPageTop = state.scrollY <= 0;
	            state.isPageBottom = maxScroll <= state.scrollY;
	            if (Math.abs(state.scrollY - state.lastScrollY) <= 1 &&
	                !state.isPageTop &&
	                !state.isPageBottom) {
	                return;
	            }
	            _this.emit({ type: 'scroll' });
	            if (state.isPageTop) {
	                if (state.previousAt !== ENUM_AT_TOP) {
	                    _this.emit({ type: 'at:top' });
	                    state.previousAt = ENUM_AT_TOP;
	                }
	                state.lastScrollY = 0;
	                return;
	            }
	            if (state.isPageBottom) {
	                if (state.previousAt !== ENUM_AT_BOTTOM) {
	                    _this.emit({ type: 'at:bottom' });
	                    state.previousAt = ENUM_AT_BOTTOM;
	                }
	                state.lastScrollY = maxScroll;
	                return;
	            }
	            state.previousAt = null;
	            var isWindowResized = viewportHeight !== state.lastViewportHeight;
	            state.lastViewportHeight = viewportHeight;
	            if (isWindowResized) {
	                state.lastScrollY = state.scrollY;
	                return;
	            }
	            var isUpScrollPrev = state.isUpScroll;
	            state.isUpScroll = state.scrollY - state.lastScrollY < 0;
	            state.lastScrollY = state.scrollY;
	            var isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== state.isUpScroll;
	            if (isDirectionChanged) {
	                if (state.isUpScroll)
	                    _this.emit({ type: 'change:up' });
	                if (!state.isUpScroll)
	                    _this.emit({ type: 'change:down' });
	            }
	            if (state.isUpScroll)
	                _this.emit({ type: 'scroll:up' });
	            if (!state.isUpScroll)
	                _this.emit({ type: 'scroll:down' });
	        };
	        isBrowser && window.addEventListener('scroll', onScroll, { passive: true });
	        return _this;
	    }
	    return ScrollDetector;
	}(EventEmitter));
	var scrollDetector = new ScrollDetector();
	function getScrollY() {
	    return ($html && $body) ? $html.scrollTop || $body.scrollTop : 0;
	}
	function getPageHeight() {
	    return $html ? $html.scrollHeight : 0;
	}

	return scrollDetector;

})));
