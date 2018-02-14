class LiliumTextCommand {
    execute() { throw new Error("execute() method was not overridden in child class.") }
    make(editor) { 
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

    execute(ev) {
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
                new LiliumTextWebCommand("bold", undefined, "far fa-bold"), 
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

    _focused() {
        const eventresult = this.fire('focus');
        if (!eventresult || !eventresult.includes(false)) {
            document.execCommand("defaultParagraphSeparator", false, this.settings.breaktag);
        }
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

        this.fire('init');
        this.log('Initialized object');
        this.initialized = true;
    }

    addCommand(command, setIndex = this.commandsets.length - 1) {
        let set = this.commandsets[setIndex];
        set ? set.push(command) : this.commandsets.push([command]);
        this.render();
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