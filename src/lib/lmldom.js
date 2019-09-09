import { Component, h } from 'preact';

export class LiliumTextBlock extends Component {
    render() {
        return (
            <div contenteditable="true">

            </div>
        );
    }
} 

let __LML_DOM_INDEX = Math.floor(Math.random() * 10000);
export function nextLMLDOMIndex() {
    return ++__LML_DOM_INDEX;
}

export class LMLDOM extends Component {
    constructor(htmlstring) {
        this.markup = htmlstring || "";
        this.dom = document.createElement('div');
        this.dom.innerHTML = this.markup;
        this.blocks = Array.from(this.dom.children).map(el => ({
            block : el,
            id : nextLMLDOMIndex()
        }));
    }

    getBlocks() {
        
    }

    getMarkup() {
        return this.dom.innerHTML;
    }

    render() {
        return (
            <div class="lmltxt-dom">
                { this.blocks.map(blk => (
                    <LiliumTextBlock block={blk} />
                )) }
            </div>
        );
    }
}
