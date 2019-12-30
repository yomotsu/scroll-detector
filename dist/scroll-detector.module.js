/*!
 * scroll-detector
 * https://github.com/[object Object]
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
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
var html = document.documentElement;
var body = document.body;
var ScrollDetector = (function (_super) {
    __extends(ScrollDetector, _super);
    function ScrollDetector() {
        var _this = _super.call(this) || this;
        var scrollY = getScrollY();
        var lastScrollY = null;
        var lastWindowHeight = window.innerHeight;
        var previousAt = null;
        var isMuted = false;
        var isUpScroll = null;
        var throttleLast;
        var throttleDeferTimer;
        _this.mute = function () {
            isMuted = true;
        };
        _this.unmute = function () {
            lastScrollY = getScrollY();
            isMuted = false;
        };
        _this.getScrollTop = function () {
            return scrollY;
        };
        var that = _this;
        function onScroll() {
            if (isMuted)
                return;
            scrollY = getScrollY();
            if (!lastScrollY) {
                lastScrollY = scrollY;
                that.emit({ type: 'scroll' });
                return;
            }
            var pageHeight = getPageHeight();
            var windowHeight = window.innerHeight;
            var maxScroll = pageHeight - windowHeight;
            var now = Date.now();
            var isNearPageTop = scrollY <= 100;
            var isNearPageBottom = maxScroll <= scrollY + 100;
            var throttleThreshold = isNearPageTop || isNearPageBottom ? 0 : 100;
            var isThrottled = throttleLast && now < throttleLast + throttleThreshold;
            if (isThrottled) {
                clearTimeout(throttleDeferTimer);
                throttleDeferTimer = window.setTimeout(function () {
                    throttleLast = now;
                    onScroll();
                }, throttleThreshold);
                return;
            }
            else {
                throttleLast = now;
            }
            var isPageTop = scrollY <= 0;
            var isPageBottom = maxScroll <= scrollY;
            if (Math.abs(scrollY - lastScrollY) <= 1 &&
                !isPageTop &&
                !isPageBottom) {
                return;
            }
            that.emit({ type: 'scroll' });
            if (isPageTop) {
                if (previousAt !== ENUM_AT_TOP) {
                    that.emit({ type: 'at:top' });
                    previousAt = ENUM_AT_TOP;
                }
                lastScrollY = 0;
                return;
            }
            if (isPageBottom) {
                if (previousAt !== ENUM_AT_BOTTOM) {
                    that.emit({ type: 'at:bottom' });
                    previousAt = ENUM_AT_BOTTOM;
                }
                lastScrollY = maxScroll;
                return;
            }
            previousAt = null;
            var isWindowResized = windowHeight !== lastWindowHeight;
            lastWindowHeight = windowHeight;
            if (isWindowResized) {
                lastScrollY = scrollY;
                return;
            }
            var isUpScrollPrev = isUpScroll;
            isUpScroll = scrollY - lastScrollY < 0;
            lastScrollY = scrollY;
            var isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== isUpScroll;
            if (isDirectionChanged) {
                if (isUpScroll)
                    that.emit({ type: 'change:up' });
                if (!isUpScroll)
                    that.emit({ type: 'change:down' });
            }
            if (isUpScroll)
                that.emit({ type: 'scroll:up' });
            if (!isUpScroll)
                that.emit({ type: 'scroll:down' });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return _this;
    }
    return ScrollDetector;
}(EventEmitter));
var scrollDetector = new ScrollDetector();
function getScrollY() {
    return html.scrollTop || body.scrollTop;
}
function getPageHeight() {
    return html.scrollHeight;
}

export default scrollDetector;
