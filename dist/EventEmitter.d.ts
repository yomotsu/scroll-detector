export declare type Listener = (event?: DispatcherEvent) => void;
export interface DispatcherEvent {
    type: string;
    [key: string]: any;
}
export default class EventEmitter {
    private _listeners;
    on(type: string, listener: Listener): void;
    hasListener(type: string, listener: Listener): boolean;
    off(type: string, listener: Listener): void;
    emit(event: DispatcherEvent): void;
}
