import EventEmitter from './EventEmitter';

const ENUM_AT_TOP = 0;
const ENUM_AT_BOTTOM = 1;

const html = document.documentElement;
const body = document.body;

class ScrollDetector extends EventEmitter {

	mute: () => void;
	unmute: () => void;
	getScrollTop: () => number;

	constructor() {

		super();

		let scrollY = getScrollY();
		let lastScrollY: number | null = null;
		let lastWindowHeight = window.innerHeight;
		let previousAt: number | null = null;
		let isMuted = false;
		let isUpScroll: boolean | null = null;

		let throttleLast: number;
		let throttleDeferTimer: number;

		// mute中はイベントをエミットしない
		this.mute = (): void => {

			isMuted = true;

		};

		this.unmute = (): void =>  {

			lastScrollY = getScrollY();
			isMuted = false;

		};

		this.getScrollTop = (): number => {

			return 	scrollY;

		};

		const that = this;

		function onScroll() {

			if ( isMuted ) return;

			scrollY = getScrollY();

			// ページ表示後に初めて、自動で発生するスクロール。
			// ブラウザにより自動で引き起こされる。
			// ユーザーによる操作ではないので、スクロール方向判定は無視する
			if ( ! lastScrollY ) {

				lastScrollY = scrollY;
				that.emit( { type: 'scroll' } );
				return;

			}

			const pageHeight = getPageHeight();
			const windowHeight = window.innerHeight;
			const maxScroll = pageHeight - windowHeight;

			// ページ表示直後以外はスクロールをthrottleする。
			// ただし、ページ上部付近、下部付近では
			// at top / at bottom 到達判定の精度向上のためにthrottleしない
			const now = Date.now();
			const isNearPageTop = scrollY <= 100;
			const isNearPageBottom = maxScroll <= scrollY + 100;
			const throttleThreshold = isNearPageTop || isNearPageBottom ? 0 : 100; //ms
			const isThrottled = throttleLast && now < throttleLast + throttleThreshold;

			if ( isThrottled ) {

				clearTimeout( throttleDeferTimer );
				throttleDeferTimer = window.setTimeout( () => {

					throttleLast = now;
					onScroll();

				}, throttleThreshold );

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

			that.emit( { type: 'scroll' } );

			if ( isPageTop ) {

				if ( previousAt !== ENUM_AT_TOP ) {

					that.emit( { type: 'at:top' } );
					previousAt = ENUM_AT_TOP;

				}

				lastScrollY = 0;
				return;

			}

			if ( isPageBottom ) {

				if ( previousAt !== ENUM_AT_BOTTOM ) {

					that.emit( { type: 'at:bottom' } );
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

				if (   isUpScroll ) that.emit( { type: 'change:up' } );
				if ( ! isUpScroll ) that.emit( { type: 'change:down' } );

			}

			if (   isUpScroll ) that.emit( { type: 'scroll:up' } );
			if ( ! isUpScroll ) that.emit( { type: 'scroll:down' } );

		}

		window.addEventListener( 'scroll', onScroll, { passive: true } );

	}

}

export default new ScrollDetector();

function getScrollY(): number {

	return html.scrollTop || body.scrollTop;

}

function getPageHeight(): number {

	return html.scrollHeight;

}
