const CURSOR_PRESETS = {
    block: { char: '\u2588', css: '' },
    line: { char: '', css: 'border-right: 2px solid currentColor; margin-left: 1px;' },
    underscore: { char: '_', css: '' },
    none: { char: '', css: '' }
};
const STYLE_ID = 'typewriter-scroll-styles';
function ensureStyles(blinkSpeed) {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
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
    document.head.appendChild(style);
}
function tokenize(html) {
    const tokens = [];
    let i = 0;
    while (i < html.length) {
        if (html[i] === '<') {
            const end = html.indexOf('>', i);
            if (end !== -1) {
                tokens.push({ type: 'tag', value: html.slice(i, end + 1) });
                i = end + 1;
            }
            else {
                tokens.push({ type: 'char', value: html[i] });
                i++;
            }
        }
        else if (html[i] === '&') {
            const end = html.indexOf(';', i);
            if (end !== -1 && end - i < 10) {
                tokens.push({ type: 'char', value: html.slice(i, end + 1) });
                i = end + 1;
            }
            else {
                tokens.push({ type: 'char', value: html[i] });
                i++;
            }
        }
        else {
            tokens.push({ type: 'char', value: html[i] });
            i++;
        }
    }
    return tokens;
}
function resolveCursor(cursorStyle) {
    if (cursorStyle in CURSOR_PRESETS)
        return CURSOR_PRESETS[cursorStyle];
    return { char: cursorStyle, css: '' };
}
export function resolveOptions(options = {}) {
    return {
        speed: options.speed ?? 50,
        startDelay: options.startDelay ?? 0,
        cursorStyle: options.cursorStyle ?? 'block',
        cursorBlink: options.cursorBlink ?? 700,
        cursorColor: options.cursorColor ?? null,
        loop: options.loop ?? false,
        threshold: options.threshold ?? 0.1,
        onStart: options.onStart ?? null,
        onEnd: options.onEnd ?? null
    };
}
function applyCursorStyle(cursor, opts) {
    const preset = resolveCursor(opts.cursorStyle);
    cursor.textContent = preset.char;
    cursor.style.cssText = preset.css;
    if (opts.cursorColor)
        cursor.style.color = opts.cursorColor;
    cursor.style.display = opts.cursorStyle === 'none' ? 'none' : '';
}
export function createTypewriter(node, options = {}) {
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
    let timeoutId = null;
    function reset() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        typing = false;
        finished = false;
        node.innerHTML = '';
        node.appendChild(cursor);
    }
    function startTyping() {
        typing = true;
        finished = false;
        if (opts.onStart)
            opts.onStart();
        const tokens = tokenize(originalHTML);
        let tokenIndex = 0;
        let currentHTML = '';
        function typeNext() {
            if (!typing || tokenIndex >= tokens.length) {
                if (typing) {
                    finished = true;
                    if (opts.onEnd)
                        opts.onEnd();
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
            }
            else {
                timeoutId = setTimeout(typeNext, opts.speed);
            }
        }
        typeNext();
    }
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !typing) {
            if (!opts.loop && finished)
                return;
            timeoutId = setTimeout(startTyping, opts.startDelay);
        }
        else if (!entry.isIntersecting) {
            if (opts.loop) {
                reset();
            }
            else if (typing && !finished) {
                if (timeoutId)
                    clearTimeout(timeoutId);
                timeoutId = null;
                typing = false;
            }
        }
    }, { threshold: opts.threshold });
    observer.observe(node);
    return {
        update(newOptions) {
            opts = resolveOptions(newOptions);
            applyCursorStyle(cursor, opts);
            ensureStyles(opts.cursorBlink);
        },
        destroy() {
            if (timeoutId)
                clearTimeout(timeoutId);
            observer.disconnect();
        }
    };
}
/** Alias — works directly as a Svelte action via use:typewriter */
export const typewriter = createTypewriter;
