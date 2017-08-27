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

$`<div><u onClick=${console.log}>Hello ${'!'.repeat(4)}</u></div>`
*/

if (typeof module==='object') {
	module.exports = $;
} else {
	if (!window.$) window.$ = $;
	window.HTML = $;
}


function $(strs, ...o) {
	const stack = strs[0].trim() ? [strs[0]] : [];

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
function parseText(container, stack, I=0, J=0, createElement=x=>document.createElement(x)) {
	let i=I, j=J;
	while (i<stack.length) {
		const item = stack[i];

		if (typeof item === 'string') {
			const tagIdx = item.indexOf('<', j);
			
			if (tagIdx===-1) {
				if (item.slice(j).trim()) container.append(item.slice(j));
				i++;
				j = 0;

			} else if (item[tagIdx+1] === '/') { // </ end tag
				if (item.slice(j, tagIdx).trim()) container.append(item.slice(j, tagIdx));

				const [tag] = item.slice(tagIdx+2).match(/\w+/) || [];
				return [i, tagIdx+2+tag.length+1, tag];

			} else {
				if (item.slice(j, tagIdx).trim()) container.append(item.slice(j, tagIdx));

				const [tag] = item.slice(tagIdx+1).match(/\w+/) || [];

				const createEl = tag==='svg'||tag==='SVG' ? x=>document.createElementNS('http://www.w3.org/2000/svg', x) : createElement

				const el = createEl(tag);

				const [i2, j2, isAutoClosed] = parseAttributes(el, stack, i, tagIdx+1+tag.length); // sets attributes on el
				
				container.append(el);

				i = i2;
				j = j2;

				if (!isAutoClosed) { // recurse with the inside of this tag

					const [i3, j3, endTag] = parseText(el, stack, i, j, createEl);
					i = i3;
					j = j3;

					if (endTag!==tag) throw new Error(`non-matching tags <${tag}>..</${endTag}>`);
				}
			}

		} else {
			container.append(...(Array.isArray(item) ? item : [item]));
			i++;
			j = 0;
		}
	}

	return [i, j]; // useless to return anything, it's the outer document fragment
}


/** 
 * @return [newI, newJ, isAutoClosing]
 */
function parseAttributes(element, stack, I=0, J=0) { // todo handle svg prefixed attr , ex: .setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', ..)
	let i=I, j=J;
	while (i<stack.length) {
		const item = stack[i];

		// console.log('parse attr', item, j);

		if (typeof item === 'string') {
			const match = item.slice(j).match(/^\s*([\w-]+)\s*/); // search an attribute name

			if (match) {
				const name = match[1]==='className' ? 'class' : match[1]==='htmlFor' ? 'for' : match[1];
				j += match.index + match[0].length;

				const m = item.slice(j).match(/^\s*=\s*(?:(?!")([^ /]+)|"([^"]*)")?/); // search an attribute value

				if (m) {
					j += m.index + m[0].length;

					const value = m[1]||m[2];

					if (value !== undefined) {
						element.setAttribute(name, value);

					} else if (typeof stack[i+1]==='function'/* && !item.slice(j).trim()*/) {

						element.addEventListener(name.slice(2).toLowerCase(), stack[i+1]);
						i+=2;
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

	const m = stack[i].slice(j).match(/\/?\s*>/); // end of attributes

	if (m) {
		return [i, j+m.index+m[0].length, m[0].length>1]
	}

	throw new Error(`failed to parse attributes ${stack[i]}`);
	// shouldn't reach this point
}
