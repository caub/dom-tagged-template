## DOM helper to create elements/fragments similarly to jsx

```js
const $ = require('dom-tagged-template');

const div = $`<div>
	<u onClick=${console.log}>Hello ${'!'.repeat(4)}</u>
</div>`.firstChild;

const ul = $`<ul onClick=${e => {e.target.style.color=`hsl(${Math.floor(360*Math.random())},100%,50%)`}}>
	${[1,2,3].map(x => $`<li>${x}</li>`)}
</ul>`.firstChild;

const fragment = $`
	<i>hello</i>
	@
	<br/>
	<marquee>world</marquee>
`;

```