# typewriter-scroll

A framework-agnostic typewriter animation triggered by scroll visibility. Zero dependencies. Works with vanilla JS, Svelte, React, Vue, or any DOM environment.

Text is typed out character by character with a blinking terminal cursor when the element scrolls into view. Supports HTML content, multiple cursor styles, custom colors, looping, and lifecycle callbacks.

## Install

```bash
npm install typewriter-scroll
```

## Quick start

```js
import { createTypewriter } from 'typewriter-scroll'

createTypewriter(document.getElementById('my-element'))
```

That's it. The element's existing text content will be typed out when it scrolls into view.

## API

### `createTypewriter(element, options?)`

Attaches the typewriter effect to a DOM element. Returns a `TypewriterInstance`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `element` | `HTMLElement` | The DOM element whose content will be typed out |
| `options` | `TypewriterOptions` | Optional configuration object |

**Returns:** `TypewriterInstance`

```ts
interface TypewriterInstance {
  update(options: TypewriterOptions): void  // Update options at any time
  destroy(): void                           // Remove observer and clean up
}
```

### `typewriter(element, options?)`

Alias for `createTypewriter`. Exported so it can be used directly as a Svelte action with `use:typewriter`.

---

## Options

All options are optional. Pass them as the second argument to `createTypewriter`.

```js
createTypewriter(element, {
  speed: 50,
  startDelay: 0,
  cursorStyle: 'block',
  cursorBlink: 700,
  cursorColor: null,
  loop: false,
  threshold: 0.1,
  onStart: null,
  onEnd: null,
  minSpeed: 50,
  maxSpeed: 50,
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `speed` | `number` | `50` | Milliseconds per character. Lower = faster. |
| `startDelay` | `number` | `0` | Milliseconds to wait after the element enters the viewport before typing begins. |
| `cursorStyle` | `string` | `'block'` | Cursor appearance. See [Cursor styles](#cursor-styles) below. |
| `cursorBlink` | `number` | `700` | Cursor blink interval in milliseconds. |
| `cursorColor` | `string \| null` | `null` | Any valid CSS color string. `null` inherits the element's text color. |
| `loop` | `boolean` | `false` | When `true`, the text clears when the element scrolls out of view and retypes when it scrolls back in. |
| `threshold` | `number` | `0.1` | IntersectionObserver threshold (0 to 1). Controls how much of the element must be visible before typing starts. |
| `onStart` | `() => void \| null` | `null` | Callback fired when typing begins. |
| `onEnd` | `() => void \| null` | `null` | Callback fired when typing completes. |
| `minSpeed` | `number` | Same as `speed` | Minimum milliseconds per character. Used with `maxSpeed` for natural, randomized typing. |
| `maxSpeed` | `number` | Same as `speed` | Maximum milliseconds per character. Used with `minSpeed` for natural, randomized typing. |

### Natural typing speed

By default, every character is typed at a fixed interval (`speed`). To create a more natural, human-like typing rhythm, set `minSpeed` and `maxSpeed` to define a range. Each character will be typed after a random delay within that range.

```js
// Natural typing: each character takes between 30ms and 120ms
createTypewriter(element, {
  minSpeed: 30,
  maxSpeed: 120,
})
```

When `minSpeed` and `maxSpeed` are not provided, they both default to the value of `speed`, preserving the original uniform behavior. If all three are provided, `minSpeed` and `maxSpeed` take priority — `speed` is only used as the fallback default.

---

### Cursor styles

The `cursorStyle` option accepts these preset values:

| Value | Appearance | Description |
|-------|------------|-------------|
| `'block'` | `█` | Full block character (default) |
| `'line'` | `▏` | Thin vertical line rendered with CSS `border-right` |
| `'underscore'` | `_` | Underscore character |
| `'none'` | *(hidden)* | No visible cursor |

You can also pass **any string** to use as a custom cursor character:

```js
createTypewriter(element, { cursorStyle: '>' })
createTypewriter(element, { cursorStyle: '|' })
createTypewriter(element, { cursorStyle: '▌' })
```

---

## Framework examples

### Vanilla JS / HTML

```html
<p id="intro">Hello, I'm a typewriter effect.</p>
<p id="fast">This one types fast with a green line cursor.</p>

<script type="module">
  import { createTypewriter } from 'typewriter-scroll'

  createTypewriter(document.getElementById('intro'))

  createTypewriter(document.getElementById('fast'), {
    speed: 20,
    cursorStyle: 'line',
    cursorColor: '#00ff00',
  })
</script>
```

#### Cleaning up

If you need to remove the effect (e.g. when removing the element from the DOM), call `destroy()`:

```js
const tw = createTypewriter(document.getElementById('intro'))

// Later:
tw.destroy()
```

#### Updating options

You can change options on the fly:

```js
const tw = createTypewriter(element, { speed: 50 })

// Later, make it faster:
tw.update({ speed: 20, cursorColor: 'red' })
```

---

### Svelte

The exported `typewriter` function matches Svelte's action signature `(node, options) => { update, destroy }`, so it works directly with `use:`:

```html
<script>
  import { typewriter } from 'typewriter-scroll'
</script>

<!-- Basic usage -->
<p use:typewriter>Hello world</p>

<!-- With options -->
<p use:typewriter={{ speed: 30, cursorStyle: 'line' }}>
  Fast typing with a line cursor.
</p>

<!-- Loop mode with custom color -->
<p use:typewriter={{ loop: true, cursorColor: '#00ff00' }}>
  This retypes every time you scroll back.
</p>

<!-- HTML content is supported -->
<p use:typewriter={{ cursorStyle: 'underscore' }}>
  Line one, <br /> line two.
</p>
```

Options are reactive. If you bind them to state, the cursor updates when values change:

```html
<script>
  import { typewriter } from 'typewriter-scroll'

  let speed = 50
</script>

<input type="range" min="10" max="200" bind:value={speed} />
<p use:typewriter={{ speed }}>Adjustable speed</p>
```

---

### React

Use `createTypewriter` with a ref and an effect:

```tsx
import { useRef, useEffect } from 'react'
import { createTypewriter } from 'typewriter-scroll'

function TypedText() {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const tw = createTypewriter(ref.current, {
      speed: 40,
      cursorStyle: 'line',
    })
    return () => tw.destroy()
  }, [])

  return <p ref={ref}>Hello from React</p>
}
```

#### Reusable hook

If you use it in multiple places, extract a hook:

```tsx
import { useRef, useEffect } from 'react'
import { createTypewriter, type TypewriterOptions } from 'typewriter-scroll'

function useTypewriter(options: TypewriterOptions = {}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const tw = createTypewriter(ref.current, options)
    return () => tw.destroy()
  }, [])

  return ref
}

// Usage:
function App() {
  const ref = useTypewriter({ speed: 30, cursorColor: 'green' })
  return <p ref={ref}>Hello world</p>
}
```

---

### Vue

Use a template ref with `onMounted`:

```html
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createTypewriter } from 'typewriter-scroll'

const el = ref(null)
let tw

onMounted(() => {
  tw = createTypewriter(el.value, {
    speed: 40,
    cursorStyle: 'underscore',
  })
})

onUnmounted(() => {
  tw?.destroy()
})
</script>

<template>
  <p ref="el">Hello from Vue</p>
</template>
```

#### Vue directive

For reuse across components, register a custom directive:

```js
// directives/typewriter.js
import { createTypewriter } from 'typewriter-scroll'

export const vTypewriter = {
  mounted(el, binding) {
    el._tw = createTypewriter(el, binding.value || {})
  },
  updated(el, binding) {
    el._tw?.update(binding.value || {})
  },
  unmounted(el) {
    el._tw?.destroy()
  },
}
```

```html
<template>
  <p v-typewriter="{ speed: 30, cursorStyle: 'line' }">Hello</p>
</template>
```

---

## HTML support

The typewriter handles inline HTML. Tags like `<br>`, `<strong>`, `<em>`, and `<a>` are inserted instantly (not typed character by character), while text content is typed out:

```html
<p id="html-demo">This is <strong>bold</strong> and has a <br /> line break.</p>

<script type="module">
  import { createTypewriter } from 'typewriter-scroll'
  createTypewriter(document.getElementById('html-demo'))
</script>
```

HTML entities like `&amp;` and `&lt;` are treated as single characters.

---

## How it works

1. On initialization, the element's `innerHTML` is captured and the element is cleared.
2. A blinking cursor `<span>` is appended to the element.
3. An `IntersectionObserver` watches for the element to enter the viewport.
4. When visible, the original content is typed back character by character using `setTimeout`.
5. HTML tags are parsed and inserted atomically (not character by character).
6. When `loop: true`, scrolling the element out of view clears the content and resets the animation. Scrolling back in triggers it again.

---

## TypeScript

The package is written in TypeScript and ships with full type declarations. Import the types directly:

```ts
import {
  createTypewriter,
  typewriter,
  type TypewriterOptions,
  type TypewriterInstance,
} from 'typewriter-scroll'
```

---

## Browser support

Works in all modern browsers that support `IntersectionObserver` (Chrome, Firefox, Safari, Edge). No polyfills needed.

## License

MIT
