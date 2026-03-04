export interface TypewriterOptions {
    /** ms per character (default: 50) */
    speed?: number;
    /** ms before typing begins after entering view (default: 0) */
    startDelay?: number;
    /** Cursor preset or custom character (default: 'block') */
    cursorStyle?: 'block' | 'line' | 'underscore' | 'none' | (string & {});
    /** Blink speed in ms (default: 700) */
    cursorBlink?: number;
    /** Cursor color, or null to inherit (default: null) */
    cursorColor?: string | null;
    /** Clear and retype when scrolling back into view (default: false) */
    loop?: boolean;
    /** IntersectionObserver threshold 0-1 (default: 0.1) */
    threshold?: number;
    /** Callback fired when typing begins */
    onStart?: (() => void) | null;
    /** Callback fired when typing completes */
    onEnd?: (() => void) | null;
}
export interface TypewriterInstance {
    update(options: TypewriterOptions): void;
    destroy(): void;
}
type ResolvedOptions = Required<TypewriterOptions>;
export declare function resolveOptions(options?: TypewriterOptions): ResolvedOptions;
export declare function createTypewriter(node: HTMLElement, options?: TypewriterOptions): TypewriterInstance;
/** Alias — works directly as a Svelte action via use:typewriter */
export declare const typewriter: typeof createTypewriter;
export {};
