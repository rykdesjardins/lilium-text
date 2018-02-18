class LiliumTextCommand {
    execute() { throw new Error("execute() method was not overridden in child class.") }
    make(editor) { 
        this.editor = editor;
        const el = document.createElement("i");
        el.className = "liliumtext-topbar-command liliumtext-topbar-command-" + this.webName + " " + (this.cssClass || "liliumtext-topbar-noicon");
        el.dataset.command = this.webName;

        if (this.text) {
            const txt = document.createElement('span');
            txt.className = "liliumtext-command-text";
            txt.textContent = this.text;

            el.classList.add("liliumtext-command-withtext");
            el.appendChild(txt);
        }

        el.addEventListener('click', (ev) => { 
            editor.log('Executed command ' + this.webName + (this.param ? (" with parameter '" + this.param + "'") : ''));
            editor.fire('command', this.webName);
            this.execute(ev, this, editor); 
        });

        return el;
    }
}

class LiliumTextWebCommand extends LiliumTextCommand {
    constructor(webName, param, cssClass, imageURL, text) {
        super();

        this.webName = webName;
        this.param = param;
        this.cssClass = cssClass;
        this.imageURL = imageURL;
        this.text = text;
    }

    correctSelection() {
        /**
         * New logic to implement -
         *  Since browsers don't behave the same way when execCommand is fired, it'd be best to use it as little as possible. 
         *  The TextWebCommand logic would be the following : 
         *
         *
         *
         *  If selection is Caret
         *      Find if caret is inside command tag
         *      Then : 
         *          insertBefore everything and remove
         *      Else : 
         *          Create element, insert before, move selection inside new node
         *  Else if selection is Range
         *      Find if command tag is within range
         *      Then :  
         *          Move what's outside of command tag inside either before or after
         *      Else, if entire range is within command tag :
         *          If command tag is span
         *          Then :
         *              Unwrap selection, duplicate first node, wrap remaining in cloned node
         *          Else, if command tag is block :
         *              insertBefore entire tag content, remove tag
         *     Else:
         *          Create new node, insert before selection, move selection inside new node
         *      
         *
         *
         * This will also make it possible to select what node name we want for bold and italic (b, strong, i, em) 
         * through the options.
         **/

        // Command types : text, removeFormat, block, exec
        const selection = window.getSelection();
        if (selection.type == "Caret") {
            const context = this.createSelectionContext(selection);
            const parentNodeType = selection.focusNode.parentElement.nodeName.toLowerCase();

            if (["strong", "b", "i", "em", "u", "a"].includes(parentNodeType)) {
                this.selectParent(selection);
            } else {
                this.selectWord(selection);
            }
        }
    }

    executeText() {
        const selection = this.editor.restoreSelection();
        const nodetype = this.param;

        if (selection.type == "Caret") {
            const context = this.editor.createSelectionContext(selection.focusNode);
            let maybeCtxElem = context.find(x => x.type == nodetype);
            if (maybeCtxElem) {
                this.editor.log('Unwrapping element of node type ' + nodetype);
                const el = maybeCtxElem.element;
                this.editor.unwrap(el);

                selection.removeAllRanges();
            } else {
                this.editor.log('Selecting word and wrapping with element of node type ' + nodetype);
                this.editor.selectWord(selection);
                this.editor.wrap(selection, document.createElement(nodetype));
            }
        } else if (selection.type == "Range") {
            const [left, leftAt, right, rightAt] = selection.anchorNode.compareDocumentPosition(selection.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING ? 
                [selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset] : 
                [selection.focusNode, selection.focusOffset, selection.anchorNode, selection.anchorOffset]; 

            const [leftCtx, rightCtx] = [this.editor.createSelectionContext(left), this.editor.createSelectionContext(right)];
            const [leftExistWrap, rightExistWrap] = [leftCtx.find(x => x.type == nodetype), rightCtx.find(x => x.type == nodetype)];
            
            if (left.parentElement === right.parentElement && !leftExistWrap) {
                this.editor.log("Quick range wrap with element of node type " + nodetype);
                this.editor.wrap(selection, document.createElement(nodetype));
            } else if (left === right) {
                this.editor.log("Quick range unwrap from node " + nodetype);
            } else {
                this.editor.log("Long logic with range using node type " + nodetype);
                // This is the most fun part

            }
        }
    }

    executeExec() {

    }

    executeBlock() {

    }

    executeRemove() {
        if (this.param) {
            const el = this.editor.restoreSelection().focusNode.parentElement;
            const context = this.editor.createSelectionContext(el);

            const wrapperCtx = context.find(x => x.type == this.param);
            if (wrapperCtx) {
                this.editor.log('Unwrapping node ' + this.param);
                this.editor.unwrap(wrapperCtx.element);
            }
        } else {
            this.editor.log('Executing native command removeFormat');
            this.editor.restoreSelection();
            document.execCommand('removeFormat', false, "");
        }
    }

    execute(ev) {
        switch (this.webName) {
            case "text":            this.executeText();         break;
            case "exec":            this.executeExec();         break;
            case "block":           this.executeBlock();        break;
            case "remove":          this.executeRemove();       break;

            // Default is noOp, but display warning for easier debugging
            default:                this.editor.log(`Warning : Tried to execute command with unknown webName [${this.webName}]`);
        }

        ev.stopPropagation();
        ev.preventDefault();
        return false;
    }
}

class LiliumTextCustomCommand extends LiliumTextCommand {
    constructor(id, callback, cssClass, imageURL, text) {
        super();

        this.webName = id;
        this.callback = callback;
        this.cssClass = cssClass;
        this.imageURL = imageURL;
        this.text = text;
    }

    execute() {
        this.callback(...arguments);
        return false;
    }
}

class LiliumText {
    static get defaultSettings() {
        return {
            initrender : true,
            removepastedstyles : true,
            dev : false,
            hooks : {},
            theme : "minim",
            width : "auto",
            boldnode : "strong",
            italicnode : "em",
            underlinenode : "u",
            strikenode : "strike",
            height : "420px",
            breaktag : "p",
            blockelements : ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "ol", "ul", "article", "dd", "dl", "dt", "figure", "header", "hr", "main", "section", "table", "tfoot"],
            inlineelements : ["a", "b", "big", "code", "em", "i", "img", "small", "span", "strong", "sub", "sup", "time", "var"],
            content : "",
            urldetection : /^((https?):\/)\/?([^:\/\s]+)((\/\w+)*\/?)([\w\-\.])+/i
        }
    }

    static createDefaultCommands(editor) {
        return [
            [
                new LiliumTextWebCommand('text', editor.settings.boldnode || "strong", "far fa-bold"), 
                new LiliumTextWebCommand('text', editor.settings.italicnode || "em", "far fa-italic"), 
                new LiliumTextWebCommand('text', editor.settings.underlinenode || "u", "far fa-underline"),  
                new LiliumTextWebCommand('text', editor.settings.strikenode || "strike", "far fa-strikethrough"),
                new LiliumTextWebCommand('remove', undefined, "far fa-eraser")
            ], [
                new LiliumTextWebCommand('exec', "undo", "far fa-undo"), 
                new LiliumTextWebCommand('exec', "redo", "far fa-redo")
            ], [
                new LiliumTextWebCommand('block', editor.settings.breaktag || 'p', 'far fa-paragraph'), 
                new LiliumTextWebCommand("block", "h1", "far fa-h1"), 
                new LiliumTextWebCommand("block", "h2", "far fa-h2"), 
                new LiliumTextWebCommand("block", "h3", "far fa-h3"),
                new LiliumTextWebCommand("block", "blockquote", "far fa-quote-right"),
            ], [
                new LiliumTextWebCommand('exec', "insertOrderedList",   "far fa-list-ol"),  
                new LiliumTextWebCommand('exec', "insertUnorderedList", "far fa-list-ul"), 
                new LiliumTextWebCommand('remove', 'a', 'far fa-unlink')
            ], [
                new LiliumTextCustomCommand("code", editor.toggleCode.bind(editor), "far fa-code")
            ]
        ]
    }

    static makeLogFunction() {
        return str => console.log(`[LiliumText] ${str}`);
    }

    constructor(nameOrElem, settings = {}) {
        this.initat = window.performance.now();
        this.initialized = false;
        this.destroyed = false;
        this.codeview = false;
        this.focused = false;
        this.hooks = {};

        this.wrapperel = typeof nameOrElem == "string" ? document.querySelector(nameOrElem) || document.getElementById(nameOrElem) : nameOrElem;
        if (!this.wrapperel) {
            throw new Error("LiliumText - Invalid element, DOM selector, or DOM element ID.");
        }

        this.id = this.wrapperel.id || ("liliumtext-" + btoa(Math.random().toString()).slice(0, -2));
        LiliumText.instances[this.id] = this;

        this.settings = Object.assign(LiliumText.defaultSettings, settings);
        this.commandsets = this.settings.commandsets || LiliumText.createDefaultCommands(this);
        this.log = this.settings.dev ? LiliumText.makeLogFunction() : (function() {});
        this.log('Created LiliumText object');

        this.log('Firing document event');
        document.dispatchEvent(new CustomEvent("liliumTextCreated", { detail : this }));

        this.wrapperel.classList.add('liliumtext');
        this.wrapperel.classList.add('theme-' + this.settings.theme);
        Object.keys(this.settings.hooks).forEach(ev => {
            this.bind(ev, this.settings.hooks[ev]);
        });

        this._init();
        this.settings.initrender && this.render(); 

        this.log('Ready in ' + (window.performance.now() - this.initat) + 'ms');
    }

    destroy(fulldelete) {
        this.fire('destroy');
        while (this.wrapperel.firstElementChild) {
            this.wrapperel.firstElementChild.remove();
        }

        if (fulldelete) {
            delete LiliumText.instances[this.id];
        } else {
            LiliumText.instances[this.id] = undefined;
        }

        for (let k in this) {
            this[k] = undefined;
        }

        this.destroyed = true;
        document.dispatchEvent(new CustomEvent("liliumTextDestroyed", { detail : this }));
    }

    lock() {
        this.contentel.removeAttribute('contenteditable');
    }

    unlock() {
        this.contentel.contentEditable = true;
    }

    createSelectionContext(elem) {
        const context = [];

        do {
            context.push({ type : elem.nodeName.toLowerCase().replace('#', ''), element : elem });
            elem = elem.parentElement;
        } while (elem != this.contentel && elem);

        return context;
    }

    selectWord(sel) {
        const range = document.createRange();
        range.setStart(sel.anchorNode, sel.anchorOffset);
        range.setEnd(sel.focusNode, sel.focusOffset);
        
        const backwards = range.collapsed;
        range.detach();

        const endNode = sel.focusNode
        const endOffset = sel.focusOffset;
        sel.collapse(sel.anchorNode, sel.anchorOffset);

        const direction = backwards ? ['backward', 'forward'] : ['forward', 'backward'];

        sel.modify("move", direction[0], "character");
        sel.modify("move", direction[1], "word");
        sel.extend(endNode, endOffset);
        sel.modify("extend", direction[1], "character");
        sel.modify("extend", direction[0], "word");
    }

    selectParent(sel, par) {
        const range = document.createRange();
        range.selectNode(par || sel.focusNode.parentNode);

        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    wrap(sel, elem) {
        const range = sel.getRangeAt(0).cloneRange();
        range.surroundContents(elem);

        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    unwrap(el) {
        const par = el.parentElement;
        while(el.firstChild) {
            par.insertBefore(el.firstChild, el);
        }
        el.remove();
    }


    isRangeInEditor(range) {
        return range && range.startContainer.compareDocumentPosition(this.contentel) & Node.DOCUMENT_POSITION_CONTAINS;
    }

    insert(element) {
        const selection = this.restoreSelection();
        let range = this.getRange();
        if (!this.isRangeInEditor(range)) {
            this.contentel.focus();
            range = this.storeRange();
        }

        range.insertNode(element);
        range.setStartAfter(element);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    _focused() {
        const eventresult = this.fire('focus');
        this.focused = true;
        if (!eventresult || !eventresult.includes(false)) {
            this._tempSelection = undefined;
            this._tempRange = undefined;
            document.execCommand("defaultParagraphSeparator", false, this.settings.breaktag);
        }
    }

    _clicked(event) {
        const selection = window.getSelection();
        const context = this.createSelectionContext(selection.focusNode);
        const element = selection.focusNode.parentElement;
        this.fire('clicked', { context, event, selection, element });
    }

    storeRange() {
        const tempSelection = window.getSelection();

        if (tempSelection.focusNode) {
            this._tempRange = tempSelection.getRangeAt(0).cloneRange();
        }

        return this._tempRange;
    }

    restoreSelection() {
        const sel = window.getSelection();
        if (!this.focused) {
            sel.removeAllRanges();
            sel.addRange(this.getRange());
        }

        return sel;
    }

    getRange() {
        return this._tempRange || this.storeRange();
    }

    _blurred() {
        this.focused = false;
        this.storeRange();
        this.fire('blur');
    }

    _pasted(e) {
        const data = e.clipboardData || window.clipboardData;
        const eventresult = this.fire('paste', data);
        
        if (eventresult && eventresult.includes(false)) {
            return;
        }

        if (data.types.includes('text/html')) {
            e.stopPropagation();
            e.preventDefault();

            const markup = data.getData("text/html");
            const template = document.createElement('div');
            template.innerHTML = markup;
            this.settings.removepastedstyles && Array.prototype.forEach.call(template.querySelectorAll('*'), x => x.removeAttribute('style'));

            document.execCommand('insertHTML', false, template.innerHTML);
        } else {
            const text = data.getData("text");
            if (this.settings.urldetection.exec(text)) {
                e.stopPropagation();
                e.preventDefault();
    
                document.execCommand('createLink', false, text);
            }
        }
    }

    _init() {
        this.log('Initializing object');
        this.toolbarel = document.createElement('div');
        this.toolbarel.className = "liliumtext-topbar";

        this.contentel = document.createElement('div');
        this.contentel.contentEditable = true;
        this.contentel.className = "liliumtext-editor"

        this.codeel = document.createElement('textarea');
        this.codeel.className = "liliumtext-code";

        this.wrapperel.appendChild(this.toolbarel);
        this.wrapperel.appendChild(this.contentel);
        this.wrapperel.appendChild(this.codeel);

        if (this.settings.content && this.settings.initrender) {
            setTimeout(() => {
                this.contentel.innerHTML = this.settings.content;
            }, 10);
        } else {
            this.contentel.appendChild(document.createElement(this.settings.breaktag));
        }

        this.contentel.addEventListener('paste', this.settings.onpaste || this._pasted.bind(this));
        this.contentel.addEventListener('focus', this._focused.bind(this));
        this.contentel.addEventListener('blur',  this._blurred.bind(this));
        this.contentel.addEventListener('click', this._clicked.bind(this));

        this.fire('init');
        this.log('Initialized object');
        this.initialized = true;
    }

    createCommandSet(set = [], index, rerender = true) {
        if (index === -1) {
            this.commandsets = [set, ...this.commandsets];
        } else if (index < this.commandsets.length) {
            this.commandsets = [...this.commandsets.slice(0, index), set, ...this.commandsets.slice(index)];
        } else {
            this.commandsets.push(set);
        }

        rerender && this.render();
    }

    addCommand(command, setIndex = this.commandsets.length - 1, rerender = true) {
        let set = this.commandsets[setIndex];
        set ? set.push(command) : this.commandsets.push([command]);
        
        rerender && this.render();
    }

    bind(eventname, callback) {
        if (!this.hooks[eventname]) {
            this.hooks[eventname] = [callback];
        } else {
            this.hooks[eventname].push(callback);
        }
    }

    fire(eventname, args) {
        this.log('Firing event : ' + eventname);
        return this.hooks[eventname] && this.hooks[eventname].map(callback => callback(this, args));
    }

    toggleCode() {
        this.log("Toggled code view");
        this.codeview = !this.codeview;

        this.fire('code', this.codeview);
        if (this.codeview) {
            this.codeel.value = this.contentel.innerHTML;
        } else {
            this.contentel.innerHTML = this.codeel.value;
        }

        this.codeel.classList[this.codeview ? "add" : "remove"]("visible");
        this.contentel.classList[this.codeview ? "add" : "remove"]("invisible");
    }

    render() {
        this.log('Rendering object');
        this.fire('willrender');

        this.log('Clearing toolbar');
        this.toolbarel.firstElementChild && this.toolbarel.firstElementChild.remove();

        this.log('Rendering toolbar');
        const toolbarwrap = document.createElement('div');
        toolbarwrap.className = "liliumtext-commands";
        this.commandsets.forEach(set => {
            const setel = document.createElement('div');
            setel.className = "liliumtext-commandset";
            toolbarwrap.appendChild(setel);

            set.forEach(command => {
                setel.appendChild(command.make(this));
            });
        });

        this.contentel.style.height = this.settings.height;
        this.codeel.style.height = this.settings.height;
        this.wrapperel.style.width = this.settings.width;

        this.toolbarel.appendChild(toolbarwrap);

        this.fire('render');
        this.log('Done rendering');
    }

    toString() {
        return this.content;
    }

    describe() {
        return this.settings.dev ? 
            `[Development LiliumText Editor instance] Wraps DOM element with ID ${this.wrapperel.id || '[No ID]'}. This instance currently has ${Object.keys(this.hooks).reduce((total, ev) => total + this.hooks[ev].length, 0)} event hooks.` : 
            "[LiliumText Editor]";
    }

    set content(markup) {
        const mobject = { markup };
        this.fire('set', mobject);

        this.contentel.innerHTML = mobject.markup;
    }

    get content() {
        const mhtml = { markup : this.contentel.innerHTML };
        const content = this.fire('get', mhtml);
        return mhtml.markup;
    }
};
LiliumText.instances = {};

if (typeof module !== "undefined") {
    module.exports = { LiliumText, LiliumTextCustomCommand, LiliumTextWebCommand, LiliumTextCommand }
}
