/*!
 * scroll-detector
 * https://github.com/[object Object]
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ScrollDetector = factory());
})(this, (function () { 'use strict';

	class EventEmitter {
	    constructor() {
	        this._listeners = {};
	    }
	    on(type, listener) {
	        const listeners = this._listeners;
	        if (listeners[type] === undefined)
	            listeners[type] = [];
	        if (listeners[type].indexOf(listener) === -1)
	            listeners[type].push(listener);
	    }
	    hasListener(type, listener) {
	        const listeners = this._listeners;
	        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	    }
	    off(type, listener) {
	        const listeners = this._listeners;
	        const listenerArray = listeners[type];
	        if (listenerArray !== undefined) {
	            const index = listenerArray.indexOf(listener);
	            if (index !== -1)
	                listenerArray.splice(index, 1);
	        }
	    }
	    emit(event) {
	        const listeners = this._listeners;
	        const listenerArray = listeners[event.type];
	        if (listenerArray !== undefined) {
	            event.target = this;
	            const array = listenerArray.slice(0);
	            for (let i = 0, l = array.length; i < l; i++) {
	                array[i].call(this, event);
	            }
	        }
	    }
	}

	const ENUM_AT_TOP = 0;
	const ENUM_AT_BOTTOM = 1;
	const isBrowser = typeof window !== 'undefined';
	const $html = isBrowser ? document.documentElement : null;
	const $body = isBrowser ? document.body : null;
	class ScrollDetector extends EventEmitter {
	    constructor() {
	        super();
	        const maxScroll = $html ? getPageHeight() - $html.clientHeight : 0;
	        const scrollY = getScrollY();
	        const state = {
	            scrollY,
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
	        this.mute = () => {
	            state.isMuted = true;
	        };
	        this.unmute = () => {
	            state.lastScrollY = getScrollY();
	            state.isMuted = false;
	        };
	        this.getScrollTop = () => state.scrollY;
	        this.getScrollProgress = () => state.scrollProgress;
	        this.isPageTop = () => state.isPageTop;
	        this.isPageBottom = () => state.isPageBottom;
	        const onScroll = () => {
	            if (state.isMuted)
	                return;
	            state.scrollY = getScrollY();
	            state.scrollProgress = $html ? state.scrollY / (getPageHeight() - $html.clientHeight) : 0;
	            const deltaScrollY = state.lastScrollY !== null ? state.scrollY - state.lastScrollY : 0;
	            if (!state.lastScrollY) {
	                state.lastScrollY = state.scrollY;
	                this.emit({ type: 'scroll', deltaScrollY });
	                return;
	            }
	            const pageHeight = getPageHeight();
	            const viewportHeight = $html ? $html.clientHeight : 0;
	            const maxScroll = pageHeight - viewportHeight;
	            const now = Date.now();
	            const isNearPageTop = state.scrollY <= 100;
	            const isNearPageBottom = maxScroll <= state.scrollY + 100;
	            const throttleThreshold = isNearPageTop || isNearPageBottom ? 0 : 100;
	            const isThrottled = state.throttleLast && now < state.throttleLast + throttleThreshold;
	            if (isThrottled) {
	                clearTimeout(state.throttleDeferTimer);
	                state.throttleDeferTimer = window.setTimeout(() => {
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
	            this.emit({ type: 'scroll', deltaScrollY });
	            if (state.isPageTop) {
	                if (state.previousAt !== ENUM_AT_TOP) {
	                    this.emit({ type: 'at:top', deltaScrollY });
	                    state.previousAt = ENUM_AT_TOP;
	                }
	                state.lastScrollY = 0;
	                return;
	            }
	            if (state.isPageBottom) {
	                if (state.previousAt !== ENUM_AT_BOTTOM) {
	                    this.emit({ type: 'at:bottom', deltaScrollY });
	                    state.previousAt = ENUM_AT_BOTTOM;
	                }
	                state.lastScrollY = maxScroll;
	                return;
	            }
	            state.previousAt = null;
	            const isWindowResized = viewportHeight !== state.lastViewportHeight;
	            state.lastViewportHeight = viewportHeight;
	            if (isWindowResized) {
	                state.lastScrollY = state.scrollY;
	                return;
	            }
	            const isUpScrollPrev = state.isUpScroll;
	            state.isUpScroll = state.scrollY - state.lastScrollY < 0;
	            state.lastScrollY = state.scrollY;
	            const isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== state.isUpScroll;
	            if (isDirectionChanged) {
	                if (state.isUpScroll)
	                    this.emit({ type: 'change:up', deltaScrollY });
	                if (!state.isUpScroll)
	                    this.emit({ type: 'change:down', deltaScrollY });
	            }
	            if (state.isUpScroll)
	                this.emit({ type: 'scroll:up', deltaScrollY });
	            if (!state.isUpScroll)
	                this.emit({ type: 'scroll:down', deltaScrollY });
	        };
	        isBrowser && window.addEventListener('scroll', onScroll, { passive: true });
	        this.destroy = () => {
	            isBrowser && window.removeEventListener('scroll', onScroll, { passive: true });
	        };
	    }
	}
	function getScrollY() {
	    return ($html && $body) ? $html.scrollTop || $body.scrollTop : 0;
	}
	function getPageHeight() {
	    return $html ? $html.scrollHeight : 0;
	}

	return ScrollDetector;

}));
