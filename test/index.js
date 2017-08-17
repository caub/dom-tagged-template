const assert = require('assert');
const {JSDOM} = require('jsdom');
const $ = require('../');

const jsdom = new JSDOM();
global.window = jsdom.window;
global.document = jsdom.window.document;
global.Node = jsdom.window.Node;
global.Element = jsdom.window.Element;
global.DocumentFragment = jsdom.window.DocumentFragment;

if (!Element.prototype.append || !DocumentFragment.prototype.append) { // jsdom lacking that?
	DocumentFragment.prototype.append = Element.prototype.append = function(...a){
		a.forEach(ai => {
			this.appendChild(ai instanceof Node ? ai : document.createTextNode(ai+''));
		})
	}
}




assert.equal($`p`.textContent, 'p');

assert.equal($`<u ok=2/>`.childNodes.length, 1);
assert.equal($`<u lol wat="tt" />`.firstChild.tagName, 'U');
assert.equal($`<u ok="1">k</u>`.childNodes.length, 1);
assert.equal($`<u lol=yt-r wat ></u>`.firstChild.tagName, 'U');

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


const list = $`<ul onClick=${e => {e.target.style.color=`hsl(${Math.floor(360*Math.random())}, 100%, 50%)`}}>
	${[1,2,3].map(x => $`<li>${x}</li>`)}
</ul>`.firstChild;

assert.equal(list.children.length, 3);

console.log('✔️ ok');