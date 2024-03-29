import EventEmitter from './EventEmitter';

const ENUM_AT_TOP = 0;
const ENUM_AT_BOTTOM = 1;

const isBrowser = typeof window !== 'undefined';
const $html: HTMLElement | null = isBrowser ? document.documentElement : null;
const $body: HTMLElement | null = isBrowser ? document.body : null;

interface ScrollDetectorState {
	scrollY: number,
	lastScrollY: number | null,
	scrollProgress: number,
	lastViewportHeight: number,
	previousAt: number | null,
	isMuted: boolean,
	isUpScroll: boolean | null,
	isPageTop: boolean,
	isPageBottom: boolean,

	throttleLast: number,
	throttleDeferTimer: number,
}

export default class ScrollDetector extends EventEmitter {

	mute: () => void;
	unmute: () => void;
	getScrollTop: () => number;
	getScrollProgress: () => number;
	isPageTop: () => boolean;
	isPageBottom: () => boolean;
	destroy: () => void;

	constructor() {

		super();

		const maxScroll = $html ? getPageHeight() - $html.clientHeight : 0;
		const scrollY = getScrollY();
		const state: ScrollDetectorState = {
			scrollY,
			lastScrollY: null,
			scrollProgress: $html ? scrollY / ( getPageHeight() - $html.clientHeight ) : 0,
			lastViewportHeight: $html ? $html.clientHeight : 0,
			previousAt: null,
			isMuted: false,
			isUpScroll: null,

			isPageTop: scrollY <= 0,
			isPageBottom: maxScroll <= scrollY,

			throttleLast: - 1,
			throttleDeferTimer: - 1,
		};

		// mute中はイベントをエミットしない
		this.mute = (): void => {

			state.isMuted = true;

		};

		this.unmute = (): void =>  {

			state.lastScrollY = getScrollY();
			state.isMuted = false;

		};

		this.getScrollTop = () => state.scrollY;
		this.getScrollProgress = () => state.scrollProgress;
		this.isPageTop = () => state.isPageTop;
		this.isPageBottom = () => state.isPageBottom;

		const onScroll = () => {

			if ( state.isMuted ) return;

			state.scrollY = getScrollY();
			state.scrollProgress = $html ? state.scrollY / ( getPageHeight() - $html.clientHeight ) : 0;
			const deltaScrollY = state.lastScrollY !== null ? state.scrollY - state.lastScrollY : 0;

			// ページ表示後に初めて、自動で発生するスクロール。
			// ブラウザにより自動で引き起こされる。
			// ユーザーによる操作ではないので、スクロール方向判定は無視する
			if ( ! state.lastScrollY ) {

				state.lastScrollY = state.scrollY;
				this.emit( { type: 'scroll', deltaScrollY } );
				return;

			}

			const pageHeight = getPageHeight();
			const viewportHeight = $html ? $html.clientHeight : 0;
			const maxScroll = pageHeight - viewportHeight;

			// ページ表示直後以外はスクロールをthrottleする。
			// ただし、ページ上部付近、下部付近では
			// at top / at bottom 到達判定の精度向上のためにthrottleしない
			const now = Date.now();
			const isNearPageTop = state.scrollY <= 100;
			const isNearPageBottom = maxScroll <= state.scrollY + 100;
			const throttleThreshold = isNearPageTop || isNearPageBottom ? 0 : 100; //ms
			const isThrottled = state.throttleLast && now < state.throttleLast + throttleThreshold;

			if ( isThrottled ) {

				clearTimeout( state.throttleDeferTimer );
				state.throttleDeferTimer = window.setTimeout( () => {

					state.throttleLast = now;
					onScroll();

				}, throttleThreshold );

				return;

			} else {

				state.throttleLast = now;

			}

			// iOSの場合、慣性スクロールでマイナスになる。
			state.isPageTop = state.scrollY <= 0;
			// iOSの場合、慣性スクロールでページ高さ以上になる。
			state.isPageBottom = maxScroll <= state.scrollY;

			// ページ表示直後、Chromeではスクロールをしていないのに
			// 数回scrollイベントが発動する。
			// それを抑止する。
			// このとき、ページをスクロールした状態でのリロードだった場合、1pxの誤差がある
			if (
				Math.abs( state.scrollY - state.lastScrollY ) <= 1 &&
				! state.isPageTop &&
				! state.isPageBottom
			) {

				return;

			}

			this.emit( { type: 'scroll', deltaScrollY } );

			if ( state.isPageTop ) {

				if ( state.previousAt !== ENUM_AT_TOP ) {

					this.emit( { type: 'at:top', deltaScrollY } );
					state.previousAt = ENUM_AT_TOP;

				}

				state.lastScrollY = 0;
				return;

			}

			if ( state.isPageBottom ) {

				if ( state.previousAt !== ENUM_AT_BOTTOM ) {

					this.emit( { type: 'at:bottom', deltaScrollY } );
					state.previousAt = ENUM_AT_BOTTOM;

				}

				state.lastScrollY = maxScroll;
				return;

			}

			state.previousAt = null;

			const isWindowResized = viewportHeight !== state.lastViewportHeight;
			state.lastViewportHeight = viewportHeight;

			// スクロール中にiOSのURLバーの有無などでウインドウサイズが変わると
			// スクロール方向を正しく計算できない
			// その場合、スクロール方向判定は無視する
			if ( isWindowResized ) {

				state.lastScrollY = state.scrollY;
				return;

			}

			const isUpScrollPrev = state.isUpScroll;
			state.isUpScroll = state.scrollY - state.lastScrollY < 0;
			state.lastScrollY = state.scrollY;
			const isDirectionChanged = isUpScrollPrev !== null && isUpScrollPrev !== state.isUpScroll;

			if ( isDirectionChanged ) {

				if (   state.isUpScroll ) this.emit( { type: 'change:up', deltaScrollY } );
				if ( ! state.isUpScroll ) this.emit( { type: 'change:down', deltaScrollY } );

			}

			if (   state.isUpScroll ) this.emit( { type: 'scroll:up', deltaScrollY } );
			if ( ! state.isUpScroll ) this.emit( { type: 'scroll:down', deltaScrollY } );

		};

		isBrowser && window.addEventListener( 'scroll', onScroll, { passive: true } );


		this.destroy = () => {

			isBrowser && window.removeEventListener( 'scroll', onScroll, { passive: true } as EventListenerOptions );

		}

	}

}

function getScrollY(): number {

	return ( $html && $body ) ? $html.scrollTop || $body.scrollTop : 0;

}

function getPageHeight(): number {

	return $html ? $html.scrollHeight : 0;

}
