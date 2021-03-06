---
permalink: docs/player/
title: "Playerx - Player element"
eleventyNavigation:
  key: <player-x>
  parent: Elements
  order: 1
tags:
  - docs
layout: layouts/docs.njk
---

# Player Element

The `<player-x>` element embeds any media player in the document and provides a **uniform API** to allow you to control those video and audio players programmatically. The `Playerx` API mimics the <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement" target="_blank">`HTMLMediaElement`</a> API as closely as possible.

<div class="md:w-4/5 relative bg-black">
  <player-x src="https://vimeo.com/357274789" controls></player-x>
</div>

```html
<player-x src="https://vimeo.com/357274789" controls></player-x>
```
