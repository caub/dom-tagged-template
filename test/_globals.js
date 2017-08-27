const {JSDOM} = require('jsdom');

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