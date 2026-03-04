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
	/** Minimum ms per character for natural typing (default: same as speed) */
	minSpeed?: number;
	/** Maximum ms per character for natural typing (default: same as speed) */
	maxSpeed?: number;
}

export interface TypewriterInstance {
	update(options: TypewriterOptions): void;
	destroy(): void;
}

interface CursorPreset {
	char: string;
	css: string;
}

const CURSOR_PRESETS: Record<string, CursorPreset> = {
	block: { char: '\u2588', css: '' },
	line: { char: '', css: 'border-right: 2px solid currentColor; margin-left: 1px;' },
	underscore: { char: '_', css: '' },
	none: { char: '', css: '' }
};

const STYLE_ID = 'typewriter-scroll-styles';
let currentBlinkSpeed = 0;

function ensureStyles(blinkSpeed: number): void {
	const existing = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (existing && blinkSpeed === currentBlinkSpeed) return;

	const style = existing ?? document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
		@keyframes typewriter-scroll-blink {
			50% { opacity: 0; }
		}
		.typewriter-scroll-cursor {
			animation: typewriter-scroll-blink ${blinkSpeed}ms step-end infinite;
			font-weight: 100;
			font-size: 1em;
			line-height: 1;
			user-select: none;
			display: inline;
		}
	`;
	currentBlinkSpeed = blinkSpeed;
	if (!existing) document.head.appendChild(style);
}

interface Token {
	type: 'tag' | 'char';
	value: string;
}

function tokenize(html: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < html.length) {
		if (html[i] === '<') {
			const end = html.indexOf('>', i);
			if (end !== -1) {
				tokens.push({ type: 'tag', value: html.slice(i, end + 1) });
				i = end + 1;
			} else {
				tokens.push({ type: 'char', value: html[i] });
				i++;
			}
		} else if (html[i] === '&') {
			const end = html.indexOf(';', i);
			if (end !== -1 && end - i < 10) {
				tokens.push({ type: 'char', value: html.slice(i, end + 1) });
				i = end + 1;
			} else {
				tokens.push({ type: 'char', value: html[i] });
				i++;
			}
		} else {
			tokens.push({ type: 'char', value: html[i] });
			i++;
		}
	}
	return tokens;
}

type ResolvedOptions = Required<TypewriterOptions>;

function resolveCursor(cursorStyle: string): CursorPreset {
	if (cursorStyle in CURSOR_PRESETS) return CURSOR_PRESETS[cursorStyle];
	return { char: cursorStyle, css: '' };
}

function resolveOptions(options: TypewriterOptions = {}): ResolvedOptions {
	const speed = options.speed ?? 50;
	return {
		speed,
		startDelay: options.startDelay ?? 0,
		cursorStyle: options.cursorStyle ?? 'block',
		cursorBlink: options.cursorBlink ?? 700,
		cursorColor: options.cursorColor ?? null,
		loop: options.loop ?? false,
		threshold: options.threshold ?? 0.1,
		onStart: options.onStart ?? null,
		onEnd: options.onEnd ?? null,
		minSpeed: options.minSpeed ?? speed,
		maxSpeed: options.maxSpeed ?? speed
	};
}

function getTypingDelay(opts: ResolvedOptions): number {
	if (opts.minSpeed === opts.maxSpeed) return opts.speed;
	return Math.floor(Math.random() * (opts.maxSpeed - opts.minSpeed + 1)) + opts.minSpeed;
}

function applyCursorStyle(cursor: HTMLSpanElement, opts: ResolvedOptions): void {
	const preset = resolveCursor(opts.cursorStyle as string);
	cursor.textContent = preset.char;
	cursor.style.cssText = preset.css;
	if (opts.cursorColor) cursor.style.color = opts.cursorColor;
	cursor.style.display = opts.cursorStyle === 'none' ? 'none' : '';
}

export function createTypewriter(node: HTMLElement, options: TypewriterOptions = {}): TypewriterInstance {
	let opts = resolveOptions(options);

	ensureStyles(opts.cursorBlink);

	const originalHTML = node.innerHTML;
	node.innerHTML = '';

	const cursor = document.createElement('span');
	cursor.className = 'typewriter-scroll-cursor';
	cursor.setAttribute('aria-hidden', 'true');
	applyCursorStyle(cursor, opts);
	node.appendChild(cursor);

	let typing = false;
	let finished = false;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function reset(): void {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		typing = false;
		finished = false;
		node.innerHTML = '';
		node.appendChild(cursor);
	}

	function startTyping(): void {
		typing = true;
		finished = false;
		if (opts.onStart) opts.onStart();

		const tokens = tokenize(originalHTML);
		let tokenIndex = 0;
		let currentHTML = '';

		function typeNext(): void {
			if (!typing || tokenIndex >= tokens.length) {
				if (typing) {
					finished = true;
					if (opts.onEnd) opts.onEnd();
				}
				return;
			}

			const token = tokens[tokenIndex];
			currentHTML += token.value;
			tokenIndex++;

			node.innerHTML = currentHTML;
			node.appendChild(cursor);

			if (token.type === 'tag') {
				typeNext();
			} else {
				timeoutId = setTimeout(typeNext, getTypingDelay(opts));
			}
		}

		typeNext();
	}

	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting && !typing) {
				if (!opts.loop && finished) return;
				timeoutId = setTimeout(startTyping, opts.startDelay);
			} else if (!entry.isIntersecting) {
				if (opts.loop) {
					reset();
				} else if (typing && !finished) {
					if (timeoutId) clearTimeout(timeoutId);
					timeoutId = null;
					typing = false;
				}
			}
		},
		{ threshold: opts.threshold }
	);

	observer.observe(node);

	return {
		update(newOptions: TypewriterOptions): void {
			opts = resolveOptions(newOptions);
			applyCursorStyle(cursor, opts);
			ensureStyles(opts.cursorBlink);
		},
		destroy(): void {
			if (timeoutId) clearTimeout(timeoutId);
			observer.disconnect();
		}
	};
}

/** Alias — works directly as a Svelte action via use:typewriter */
export const typewriter = createTypewriter;
