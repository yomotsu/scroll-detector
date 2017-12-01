import EventEmitter from './EventEmitter.js';

const ENUM_AT_TOP = 0;
const ENUM_AT_BOTTOM = 1;

const scrollDetector = new EventEmitter();
const html = document.documentElement;
const body = document.body;

let scrollY = null;
let lastScrollY = null;
let lastWindowHeight = window.innerHeight;
let previousAt = null;
let directionStartY = lastScrollY;
let isMuted = false;
let isUpScroll = null;

let throttleLast;
let throttleDeferTimer;

// mute中はイベントをエミットしない
scrollDetector.mute = () => {

	isMuted = true;

};

scrollDetector.unmute = () => {

	lastScrollY = getScrollY();
	isMuted = false;

};

scrollDetector.getScrollTop = () => scrollY;


function getScrollY() {

	return html.scrollTop || body.scrollTop;

}

function onScroll() {

	if ( isMuted ) return;

	scrollY = getScrollY();

	// ページ表示後に初めて、自動で発生するスクロール。
	// ブラウザにより自動で引き起こされる。
	// ユーザーによる操作ではないので、スクロール方向判定は無視する
	if ( ! lastScrollY ) {

		lastScrollY = scrollY;
		directionStartY = lastScrollY;
		scrollDetector.emit( { type: 'scroll' } );
		return;

	}

	const pageHeight = html.scrollHeight;
	const windowHeight = window.innerHeight;
	const maxScroll = pageHeight - windowHeight;


	// ページ表示直後以外はスクロールをthrottleする。
	// ただし、ページ上部付近、下部付近では
	// at top / at bottom 到達判定の精度向上のためにthrottleしない
	const now = Date.now();
	const isNearPageTop = scrollY <= 100;
	const isNearPageBottom = maxScroll <= scrollY + 100;
	const throttleThreshhold = isNearPageTop || isNearPageBottom ? 0 : 100; //ms
	const isThrottled = throttleLast && now < throttleLast + throttleThreshhold;

	if ( isThrottled ) {

		clearTimeout( throttleDeferTimer );
		throttleDeferTimer = setTimeout( () => {

			throttleLast = now;
			onScroll();

		}, throttleThreshhold );

		return;

	} else {

		throttleLast = now;

	}


	// iOSの場合、慣性スクロールでマイナスになる。
	const isPageTop = scrollY <= 0;
	// iOSの場合、慣性スクロールでページ高さ以上になる。
	const isPageBottom = maxScroll <= scrollY;


	// ページ表示直後、Chromeではスクロールをしていないのに
	// 数回scrollイベントが発動する。
	// それを抑止する。
	// このとき、ページをスクロールした状態でのリロードだった場合、1pxの誤差がある
	if (
		Math.abs( scrollY - lastScrollY ) <= 1 &&
		! isPageTop &&
		! isPageBottom
	) {

		return;

	}


	scrollDetector.emit( { type: 'scroll' } );

	if ( isPageTop ) {

		if ( previousAt !== ENUM_AT_TOP ) {

			scrollDetector.emit( { type: 'at:top' } );
			previousAt = ENUM_AT_TOP;

		}

		lastScrollY = 0;
		return;

	}

	if ( isPageBottom ) {

		if ( previousAt !== ENUM_AT_BOTTOM ) {

			scrollDetector.emit( { type: 'at:bottom' } );
			previousAt = ENUM_AT_BOTTOM;

		}

		lastScrollY = maxScroll;
		return;

	}

	previousAt = null;

	const isWindowResized = windowHeight !== lastWindowHeight;
	lastWindowHeight = windowHeight;

	// スクロール中にiOSのURLバーの有無などでウインドウサイズが変わると
	// スクロール方向を正しく計算できない
	// その場合、スクロール方向判定は無視する
	if ( isWindowResized ) {

		lastScrollY = scrollY;
		return;

	}

	const isUpScrollPrev = isUpScroll;
	isUpScroll = scrollY - lastScrollY < 0;
	lastScrollY = scrollY;
	const isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== isUpScroll;

	if ( isDirectionChanged ) {

		directionStartY = scrollY;

		if (   isUpScroll ) scrollDetector.emit( { type: 'change:up' } );
		if ( ! isUpScroll ) scrollDetector.emit( { type: 'change:down' } );

	}

	if (   isUpScroll ) scrollDetector.emit( { type: 'scroll:up' } );
	if ( ! isUpScroll ) scrollDetector.emit( { type: 'scroll:down' } );

}

window.addEventListener( 'scroll', onScroll );

export default scrollDetector;
