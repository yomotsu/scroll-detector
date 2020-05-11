import EventEmitter from './EventEmitter';
declare class ScrollDetector extends EventEmitter {
    mute: () => void;
    unmute: () => void;
    getScrollTop: () => number;
    isPageTop: () => boolean;
    isPageBottom: () => boolean;
    constructor();
}
declare const _default: ScrollDetector;
export default _default;
