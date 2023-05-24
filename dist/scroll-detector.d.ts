import EventEmitter from './EventEmitter';
export default class ScrollDetector extends EventEmitter {
    mute: () => void;
    unmute: () => void;
    getScrollTop: () => number;
    getScrollProgress: () => number;
    isPageTop: () => boolean;
    isPageBottom: () => boolean;
    destroy: () => void;
    constructor();
}
