var $ = typeof window==='undefined' ? require('../') : $;

const assert = typeof window==='undefined' ? require('assert') : {equal: (a, b) => console.assert(a === b)};

if (typeof window==='undefined') require('./_globals');



assert.equal($`p`.textContent, 'p');

assert.equal($`<u ok=2/>`.childNodes.length, 1);
assert.equal($`<u lol wat="tt" />`.firstChild.tagName, 'U');
assert.equal($`<u lol wat="tt" />`.firstChild.attributes.length, 2);
assert.equal($`<u ok="1">k</u>`.childNodes.length, 1);
assert.equal($`<u ok="1">k</u>`.firstChild.childNodes.length, 1);
assert.equal($`<u lol=yt-r wat ></u>`.firstChild.tagName, 'U');
assert.equal($`<u lol=yt-r wat ></u>`.firstChild.attributes.length, 2);

assert.equal($`<u>test</u>`.textContent, 'test');
assert.equal($`<u>test</u>`.lastChild.textContent, 'test');

assert.equal($`<u onMouseMove=${e=>{}}>${1+1}</u>`.textContent, '2');
assert.equal($`<u>hello ${'world'}!</u>`.firstChild.textContent, 'hello world!');


const fragment = $`
	<i>hello</i>
	@
	<br/>
	<marquee>world</marquee>
`;

assert.equal(fragment.childNodes.length, 4);
assert.equal(fragment.childElementCount, 3);

const div = $`<div/>`.firstChild;
div.append(fragment);
assert.equal(div.innerHTML, `<i>hello</i>
	@
	<br><marquee>world</marquee>`);


const list = $`<ul onClick=${e => {e.target.style.color=`hsl(${Math.floor(360*Math.random())}, 100%, 50%)`}}>
	${[1,2,3].map(x => $`<li>${x}</li>`)}
</ul>`.firstChild;

assert.equal(list.children.length, 3);

assert.equal($`<svg/>`.firstChild.tagName, 'svg');

const svg = $`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 30 30"><line x1="1" y1="-8.8" x2="11.2" y2=".56"/></svg>`.firstChild;

assert.equal(
	svg.innerHTML,
	'<line x1="1" y1="-8.8" x2="11.2" y2=".56"></line>'
);

assert.equal(
	svg.firstElementChild.tagName,
	'line'
);

document.body.append(svg);

console.log('✔️ ok');
