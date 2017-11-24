/**
parser:

Fragment ::= Node*
Node ::= Element | Text | Fragment | Expr(evaluating as HTMLNode)
Element ::= <Tag Attribute* /> | <Tag Attribute*>Node*</Tag>

Attribute ::= AttrName=AttrValue
AttrName ::= [\w-]+
AttrValue ::= Expr | "[^"]*"
Tag ::= \w+
Text ::= [^<]*
Expr (string template expression)


example usage:

dom`<div><u onClick=${console.log}>Hello ${'!'.repeat(4)}</u></div>`
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.dom = factory());
}(this, function () {

function dom(strs, ...o) {
	const stack = strs[0].trim() ? [typeof strs === 'string' ? strs : strs[0]] : [];

	o.forEach((oi, i) => {
		if (oi!=null && oi!==false) {
			if (typeof oi === 'object' || typeof oi === 'function') {
				stack.push(oi);
				if (strs[i+1].trim()) stack.push(strs[i+1]);

			} else {
				const str = (oi + strs[i+1]).trim();
				if (str) {
					if (typeof stack[stack.length-1] === 'string') {
						stack[stack.length-1] += oi + strs[i+1];
					} else {
						stack.push(oi + strs[i+1]);
					}
				}
			}
		}
	});
	const frag = document.createDocumentFragment();
	parseText(frag, stack);

	return frag;
}

/** 
 * stack is a mix of strings and elements, (strings are collapsed into one)
 * I: stack index
 * J: index inside stack[I] when it's a string
 * @return [newI, newJ, closingTag]
 */
function parseText(container, stack, I=0, J=0, createElement = x => document.createElement(x)) {
	let i=I, j=J;
	while (i<stack.length) {
		const item = stack[i];

		if (typeof item === 'string') {
			const tagIdx = item.indexOf('<', j);
			
			if (tagIdx > -1) {

				if (item.slice(j, tagIdx).trim()) container.append(item.slice(j, tagIdx));

				const [w, tag] = item.slice(tagIdx+1).match(/\/?(\w*)/);

				if (w[0] === '/') {
					return [i, tagIdx + 2 + w.length, tag];
				}

				const createEl = tag==='svg' ? x => document.createElementNS('http://www.w3.org/2000/svg', x) : 
					tag==='foreignObject' ? x => document.createElement(x) : createElement

				const el = createEl(tag);

				const [i2, j2, isAutoClosed] = parseAttributes(el, stack, i, tagIdx + 1 + tag.length); // sets attributes on el
				
				container.append(el);

				i = i2;
				j = j2;

				if (!isAutoClosed) { // recurse with the inside of this tag

					const [i3, j3, endTag] = parseText(el, stack, i, j, createEl);
					i = i3;
					j = j3;

					if (endTag!==tag) throw new Error(`non-matching tags <${tag}>..</${endTag}>`);
				}

			} else {
				if (item.slice(j).trim()) container.append(item.slice(j));
				i++;
				j = 0;
			}

		} else {
			container.append(...(Array.isArray(item) ? item : [item]));
			i++;
			j = 0;
		}
	}

	// useless to return anything, it's the outer document fragment, or a missed closing tag
}


const ATTR_NAME__RE = /^\s*([\w-]+)\s*/;
const ATTR_VALUE__RE = /^\s*=\s*(?:(?!")([^ />]+)(?=\/?\s*>|\s+)|"([^"]*)")?/;

/** 
 * @return [newI, newJ, isAutoClosing]
 */
function parseAttributes(element, stack, I=0, J=0) { // todo handle svg prefixed attr , ex: .setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', ..) -- no longer needed in next svg spec?
	let i = I, j = J;
	while (i < stack.length) {
		const item = stack[i];

		if (typeof item === 'string') {
			const match = item.slice(j).match(ATTR_NAME__RE); // search an attribute name

			if (match) {
				const name = match[1]==='className' ? 'class' : match[1]==='htmlFor' ? 'for' : match[1];
				j += match.index + match[0].length;

				const m = item.slice(j).match(ATTR_VALUE__RE); // search an attribute value

				if (m) {
					j += m.index + m[0].length;
					const value = m[1] || m[2];

					if (value !== undefined) {
						element.setAttribute(name, value);

					} else if (typeof stack[i+1]==='function') {
						element.addEventListener(name.slice(2).toLowerCase(), stack[i+1]);
						i += 2;
						j = 0;

					} else if (typeof stack[i+1]==='object') {
						if (name === 'style') {
							Object.assign(element.style, stack[i+1]);
						} else if (name === 'data') {
							Object.assign(element.dataset, stack[i+1]);
						} else {
							element.setAttribute(name, stack[i+1]);
						}
						i += 2;
						j = 0;
					}
	
				} else {
					element.setAttribute(name, '');
				}
			} else {
				break;
			}
		} else {
			throw new Error(`unexpected attribute type ${item}`);
		}
	}

	if (typeof stack[i] === 'string') {
		const m = stack[i].slice(j).match(/\/?\s*>/); // end of attributes
		if (m) {
			return [i, j+m.index+m[0].length, m[0].length>1];
		}
	}

	throw new Error(`failed to parse attributes ${stack[i]}`);
	// shouldn't reach this point
}

return dom;

}));
