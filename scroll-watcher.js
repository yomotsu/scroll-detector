import EventEmitter from './EventEmitter.js';
import throttle from './throttle.js';

const THRESHOLD = 30;
const ENUM_AT_TOP = 0;
const ENUM_AT_BOTTOM = 1;

const scrollWatcher = new EventEmitter();
const html = document.documentElement;
const body = document.body;

let scrollY = null;
let lastScrollY = null;
let lastWindowHeight = window.innerHeight;
let previousAt = null;
let directionStartY = lastScrollY;
let isMuted = false;
let isUpScroll = null;
let eventFired = false;

// mute中はイベントをエミットしない
scrollWatcher.mute = () => {

	isMuted = true;

};

scrollWatcher.unmute = () => {

	lastScrollY = getScrollY();
	isMuted = false;

};

scrollWatcher.getScrollTop = () => scrollY;

window.addEventListener( 'scroll', throttle( () => {

	if ( isMuted ) return;

	scrollY = getScrollY();

	// ページ表示後に初めて、自動で発生するスクロール。
	// ブラウザにより自動で引き起こされる。
	// ユーザーによる操作ではないので、スクロール方向判定は無視する
	if ( ! lastScrollY ) {

		lastScrollY = scrollY;
		directionStartY = lastScrollY;
		scrollWatcher.emit( { type: 'scroll' } );
		return;

	}

	const pageHeight = html.scrollHeight;
	const windowHeight = window.innerHeight;
	const maxScroll = pageHeight - windowHeight;
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

	scrollWatcher.emit( { type: 'scroll' } );

	if ( isPageTop ) {

		if ( previousAt !== ENUM_AT_TOP ) {

			scrollWatcher.emit( { type: 'at:top' } );
			previousAt = ENUM_AT_TOP;

		}

		lastScrollY = 0;
		return;

	}

	if ( isPageBottom ) {

		if ( previousAt !== ENUM_AT_BOTTOM ) {

			scrollWatcher.emit( { type: 'at:bottom' } );
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
	const isDirectionChanged = isUpScrollPrev !== isUpScroll;

	if (   isUpScroll ) scrollWatcher.emit( { type: 'scroll:up' } );
	if ( ! isUpScroll ) scrollWatcher.emit( { type: 'scroll:down' } );

	if ( isDirectionChanged ) {

		directionStartY = scrollY;
		eventFired = false;

		if ( ! isUpScroll ) scrollWatcher.emit( { type: 'change:down' } );

	}

	if ( ! eventFired && Math.abs( directionStartY - scrollY ) >= THRESHOLD ) {

		eventFired = true;

		if (   isUpScroll ) scrollWatcher.emit( { type: 'delay:up' } );
		// if ( ! isUpScroll ) scrollWatcher.emit( { type: 'delay:down' } );

	}

} ), 50 );

function getScrollY() {

	return html.scrollTop || body.scrollTop;

}

export default scrollWatcher;
