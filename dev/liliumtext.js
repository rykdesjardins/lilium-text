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

        el.addEventListener('mousedown', (ev) => { 
            editor.log('Executed command ' + this.webName + (this.param ? (" with parameter '" + this.param + "'") : ''));
            editor.fire('command', this.webName);
            this.execute(ev, this, editor); 
        });

        return el;
    }

    createSelectionContext(sel) {
        let elem = sel.focusNode;
        const context = [];

        do {
            context.push({ type : elem.nodeName, element : elem });
            elem = elem.parentElement;
        } while (elem != this.editor.contentel && elem);

        return context;
    }

    elevateToNodeType(sel, nodename) {
        nodename = nodename.toUpperCase();
        let par = sel.focusNode.parentElement;
        while (par.nodeName != nodename) {
            par = par.parentElement;

            if (par == editor.contentel || !par) {
                return false;
            }
        }

        return par;
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

    selectParent(sel) {
        const range = document.createRange();
        range.selectNode(sel.focusNode.parentNode);

        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
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

    execute(ev) {
        this.correctSelection();

        document.execCommand(this.webName, false, this.param);
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
            height : "420px",
            breaktag : "p",
            content : "",
            urldetection : /^((https?):\/)\/?([^:\/\s]+)((\/\w+)*\/?)([\w\-\.])+/i
        }
    }

    static createDefaultCommands(editor) {
        return [
            [
                new LiliumTextWebCommand("bo<F5>ld", undefined, "far fa-bold"), 
                new LiliumTextWebCommand("italic", undefined, "far fa-italic"), 
                new LiliumTextWebCommand("underline", undefined, "far fa-underline"),  
                new LiliumTextWebCommand("strikethrough", undefined, "far fa-strikethrough"),
                new LiliumTextWebCommand('removeFormat', undefined, "far fa-eraser")
            ], [
                new LiliumTextWebCommand("undo", undefined, "far fa-undo"), 
                new LiliumTextWebCommand("redo", undefined, "far fa-redo")
            ], [
                new LiliumTextWebCommand('formatBlock', 'p', 'far fa-paragraph'), 
                new LiliumTextWebCommand("formatBlock", "h1", "far fa-h1"), 
                new LiliumTextWebCommand("formatBlock", "h2", "far fa-h2"), 
                new LiliumTextWebCommand("formatBlock", "h3", "far fa-h3"),
                new LiliumTextWebCommand("formatBlock", "blockquote", "far fa-quote-right"),
            ], [
                new LiliumTextWebCommand("insertOrderedList", undefined, "far fa-list-ol"),  
                new LiliumTextWebCommand("insertUnorderedList", undefined, "far fa-list-ul"), 
                new LiliumTextWebCommand('unlink', false, 'far fa-unlink')
            ], [
                new LiliumTextCustomCommand("code", editor.toggleCode.bind(editor), "far fa-code")
            ]
        ]
    }

    static makeLogFunction() {
        return str => console.log(`[LiliumText] ${str}`);
    }

    constructor(nameOrElem, settings = {}) {
        this.initialized = false;
        this.destroyed = false;
        this.codeview = false;
        this.hooks = {};

        this.wrapperel = typeof nameOrElem == "string" ? document.querySelector(nameOrElem) || document.getElementById(nameOrElem) : nameOrElem;
        if (!this.wrapperel) {
            throw new Error("LiliumText - Invalid element, DOM selector, or DOM element ID.");
        }

        this.id = this.wrapperel.id || ("liliumtext-" + btoa(Math.random().toString()));
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

    isRangeInEditor(range) {
        if (range) {
            let par = range.endContainer;
            while (par.parentElement) {
                if (par == this.contentel) {
                    return true;
                }

                par = par.parentElement;
            }
        }

        return false;
    }

    insert(element) {
        let range = this._tempRange || this._makeRange();
        if (!this.isRangeInEditor(range)) {
            this.contentel.focus();
            range = this._makeRange();
        }

        range.insertNode(element);
        range.setStartAfter(element);

        this._tempSelection.removeAllRanges();
        this._tempSelection.addRange(range);
        this._tempRange = range;
    }

    _focused() {
        const eventresult = this.fire('focus');
        if (!eventresult || !eventresult.includes(false)) {
            document.execCommand("defaultParagraphSeparator", false, this.settings.breaktag);
        }
    }

    _makeRange() {
        this._tempSelection = window.getSelection();

        if (this._tempSelection.focusNode) {
            this._tempRange = this._tempSelection.getRangeAt(0).cloneRange();
        }

        return this._tempRange;
    }

    _blurred() {
        this._makeRange();
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
