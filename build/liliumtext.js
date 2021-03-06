"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LiliumTextCommand = function () {
    function LiliumTextCommand() {
        _classCallCheck(this, LiliumTextCommand);
    }

    _createClass(LiliumTextCommand, [{
        key: "execute",
        value: function execute() {
            throw new Error("execute() method was not overridden in child class.");
        }
    }, {
        key: "make",
        value: function make(editor) {
            var _this = this;

            this.editor = editor;
            var el = document.createElement("i");
            el.className = "liliumtext-topbar-command liliumtext-topbar-command-" + this.webName + " " + (this.cssClass || "liliumtext-topbar-noicon");
            el.dataset.command = this.webName;

            if (this.text) {
                var txt = document.createElement('span');
                txt.className = "liliumtext-command-text";
                txt.textContent = this.text;

                el.classList.add("liliumtext-command-withtext");
                el.appendChild(txt);
            }

            el.addEventListener('mousedown', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            });

            el.addEventListener('mouseup', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();

                editor.log('Executed command ' + _this.webName + (_this.param ? " with parameter '" + _this.param + "'" : ''));
                editor.fire('command', _this.webName);
                _this.execute(ev, _this, editor);

                return false;
            });

            return el;
        }
    }]);

    return LiliumTextCommand;
}();

var LiliumTextBrowserCompat = function () {
    function LiliumTextBrowserCompat() {
        _classCallCheck(this, LiliumTextBrowserCompat);
    }

    _createClass(LiliumTextBrowserCompat, null, [{
        key: "runCommandOrFallback",
        value: function runCommandOrFallback(command, arg, cb) {
            document.execCommand(command, false, arg) || cb(command, arg);
        }
    }, {
        key: "nodeToCommand",
        value: function nodeToCommand(nodetype) {
            switch (nodetype) {
                case "strong":
                case "b":
                    return "bold";

                case "italic":
                case "i":
                case "em":
                    return "italic";

                case "underline":
                case "u":
                    return "underline";

                case "strike":
                case "s":
                    return "strikeThrough";

                // I hate not having a default case...
                default:
                    return undefined;
            }
        }
    }, {
        key: "getStrategyKind",
        value: function getStrategyKind() {
            if (window.navigator) {
                if (document.execCommand) {
                    return "exec";
                } else {
                    return "logic";
                }
            } else {
                return "old";
            }
        }
    }]);

    return LiliumTextBrowserCompat;
}();

var LiliumTextWebCommand = function (_LiliumTextCommand) {
    _inherits(LiliumTextWebCommand, _LiliumTextCommand);

    function LiliumTextWebCommand(webName, param, cssClass, imageURL, text) {
        _classCallCheck(this, LiliumTextWebCommand);

        var _this2 = _possibleConstructorReturn(this, (LiliumTextWebCommand.__proto__ || Object.getPrototypeOf(LiliumTextWebCommand)).call(this));

        _this2.webName = webName;
        _this2.param = param;
        _this2.cssClass = cssClass;
        _this2.imageURL = imageURL;
        _this2.text = text;
        return _this2;
    }

    _createClass(LiliumTextWebCommand, [{
        key: "highlightNode",
        value: function highlightNode(node) {
            var selection = this.editor.restoreSelection();
            var range = document.createRange();

            this.editor.log("Highlighting node " + node.nodeName + " from Web Command");
            range.selectNode(node);
            selection.removeAllRanges();
            selection.addRange(range);

            this.editor.storeRange(range);
        }
    }, {
        key: "executeText",
        value: function executeText() {
            var _this3 = this;

            var selection = this.editor.restoreSelection();
            var nodetype = this.param;
            var cmdtype = LiliumTextBrowserCompat.nodeToCommand(nodetype);

            LiliumTextBrowserCompat.runCommandOrFallback(cmdtype, this.param, function () {
                if (selection.type == "Caret") {
                    var context = _this3.editor.createSelectionContext(selection.focusNode);
                    var maybeCtxElem = context.find(function (x) {
                        return x.type == nodetype;
                    });
                    if (maybeCtxElem) {
                        _this3.editor.log('Unwrapping element of node type ' + nodetype);
                        _this3.editor.unwrap(maybeCtxElem);
                    }
                } else if (selection.type == "Range") {
                    /* 
                     * CONTEXT VARIABLES DEFINITION ------
                     *
                     * left, right : Nodes where selection starts and ends. Everything in between is located inside the fragment.
                     * leftCtx, rightCtx : Array containing nodes from the selected one up to the editor one
                     * leftExistWrap, rightExistWrap : Wrapped node if node already exists, otherwise undefined
                     *
                     * range : current selection range object
                     * frag : fragment containing everything from inside the selection. Not a copy; actual nodes. 
                     *
                     **/

                    var capNodeType = nodetype.toUpperCase();

                    var _ref = selection.anchorNode.compareDocumentPosition(selection.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING ? [selection.anchorNode, selection.focusNode] : [selection.focusNode, selection.anchorNode],
                        _ref2 = _slicedToArray(_ref, 2),
                        left = _ref2[0],
                        right = _ref2[1];

                    var _ref3 = [_this3.editor.createSelectionContext(left), _this3.editor.createSelectionContext(right)],
                        leftCtx = _ref3[0],
                        rightCtx = _ref3[1];
                    var _ref4 = [leftCtx.find(function (x) {
                        return x.nodeName == capNodeType;
                    }), rightCtx.find(function (x) {
                        return x.nodeName == capNodeType;
                    })],
                        leftExistWrap = _ref4[0],
                        rightExistWrap = _ref4[1];

                    // Fun! :D

                    _this3.editor.log("Long logic with range using node type " + nodetype);

                    var range = selection.getRangeAt(0);
                    var frag = range.extractContents();

                    /*
                    if (frag.childNodes[0].nodeName == "#text" && !frag.childNodes[0].data.trim()) {
                        this.editor.log("Removed extra empty text node from fragment");
                        range.insertNode(frag.childNodes[0]);
                    }
                    */

                    var fragWrap = !leftExistWrap && !rightExistWrap && frag.querySelectorAll(nodetype);

                    if (left.parentElement === right.parentElement && !leftExistWrap && !fragWrap.length) {
                        _this3.editor.log("Quick range wrap with element of node type " + nodetype);

                        // Might be worth looking at Range.surroundContents()
                        var newElem = document.createElement(nodetype);
                        newElem.appendChild(frag);
                        selection.getRangeAt(0).insertNode(newElem);

                        _this3.highlightNode(newElem);
                    } else if (!leftExistWrap != !rightExistWrap) {
                        // Apparently there is no XOR in Javascript, so here's a syntax monstrosity
                        // This will not execute the block unless one is truthy and one is falsey
                        _this3.editor.log('XOR range wrapper extension of node type ' + nodetype);

                        var _newElem = document.createElement(nodetype);
                        _newElem.appendChild(frag);
                        selection.getRangeAt(0).insertNode(_newElem);

                        // Extend existing wrapper
                        var wrapper = leftExistWrap || rightExistWrap;
                        Array.prototype.forEach.call(wrapper.querySelectorAll(nodetype), function (node) {
                            _this3.editor.unwrap(node);
                        });

                        _this3.highlightNode(node);
                    } else if (fragWrap.length != 0) {
                        // There is an element inside the fragment with requested node name
                        // Unwrap child element
                        _this3.editor.log('Fragment child unwrap with node type ' + nodetype);
                        Array.prototype.forEach.call(fragWrap, function (elem) {
                            while (elem.firstChild) {
                                elem.parentNode ? elem.parentNode.insertBefore(elem.firstChild, elem) : frag.insertBefore(elem.firstChild, frag);
                            }
                        });

                        Array.prototype.forEach.call(fragWrap, function (elem) {
                            return elem && elem.remove && elem.remove();
                        });

                        selection.getRangeAt(0).insertNode(frag);
                    } else if (leftExistWrap && rightExistWrap && leftExistWrap === rightExistWrap) {
                        // Unwrap both ends, possible solution : while (textnode has next sibling) { insert sibling after wrapper node }
                        _this3.editor.log("Placeholder unwrap from two sources with node types : " + nodetype);
                        var placeholder = document.createElement('liliumtext-placeholder');
                        selection.getRangeAt(0).insertNode(placeholder);

                        var leftEl = leftExistWrap;
                        var clone = leftEl.cloneNode(true);
                        leftEl.parentNode.insertBefore(clone, leftEl);

                        var clonePlaceholder = clone.querySelector('liliumtext-placeholder');
                        while (clonePlaceholder.nextSibling) {
                            clonePlaceholder.nextSibling.remove();
                        }

                        while (placeholder.previousSibling) {
                            placeholder.previousSibling.remove();
                        }

                        leftEl.parentNode.insertBefore(frag, leftEl);
                        placeholder.remove();
                        clonePlaceholder.remove();

                        _this3.highlightNode(clone);
                    } else if (leftExistWrap && rightExistWrap) {
                        _this3.editor.log("Merge wrap from two sources with node types : " + nodetype);
                        // Merge wrap
                        var leftFrag = frag.firstChild;
                        var rightFrag = frag.lastChild;
                        while (leftFrag.nextSibling != rightFrag) {
                            leftFrag.appendChild(leftFrag.nextSibling);
                        }

                        while (rightFrag.firstChild) {
                            leftFrag.appendChild(rightFrag.firstChild);
                        }

                        rightFrag.remove();
                        selection.getRangeAt(0).insertNode(frag);
                    } else if (frag.childNodes.length == 1 && frag.childNodes[0].nodeName == nodetype) {
                        // Entire element is selected, Unwrap entire element
                        _this3.editor.log("Single unwrap of node type : " + nodetype);
                        var wrap = frag.childNodes[0];
                        while (wrap.lastChild) {
                            selection.getRangeAt(0).insertNode(wrap.lastChild);
                        }
                    } else {
                        // Create new element, insert before selection
                        _this3.editor.log("Fragment wrap with node type : " + nodetype);
                        var _newElem2 = document.createElement(nodetype);
                        _newElem2.appendChild(frag);

                        var _range = selection.getRangeAt(0);
                        _range.insertNode(_newElem2);
                        _range.selectNode(_newElem2);

                        selection.removeAllRanges();
                        selection.addRange(_range);
                    }
                }
            });
        }
    }, {
        key: "executeExec",
        value: function executeExec() {
            this.editor.restoreSelection();
            document.execCommand(this.param);
        }
    }, {
        key: "executeBlock",
        value: function executeBlock() {
            var _this4 = this;

            var selection = this.editor.restoreSelection();
            var range = selection.getRangeAt(0);
            var nodetype = this.param;
            var cmdnodearg = nodetype.toUpperCase();

            LiliumTextBrowserCompat.runCommandOrFallback('formatBlock', cmdnodearg, function () {
                var context = _this4.editor.createSelectionContext(selection.focusNode);
                var blocktags = _this4.editor.settings.blockelements;

                var topLevelTag = context && context.length ? context[context.length - 1] : _this4.editor.contentel.children[selection.focusOffset];

                if (topLevelTag.nodeName != nodetype) {
                    var newNode = document.createElement(nodetype);
                    topLevelTag.parentElement.insertBefore(newNode, topLevelTag);

                    if (topLevelTag.data) {
                        newNode.appendChild(topLevelTag);
                    } else {
                        while (topLevelTag.firstChild) {
                            newNode.appendChild(topLevelTag.firstChild);
                        }

                        topLevelTag.remove();
                    }

                    range.setStart(newNode, 0);
                    range.collapse(true);

                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
        }
    }, {
        key: "executeRemove",
        value: function executeRemove() {
            if (this.param == "a") {
                this.editor.restoreSelection();
                document.execCommand('unlink', false);
            } else if (this.param) {
                var el = this.editor.restoreSelection().focusNode.parentNode;
                var context = this.editor.createSelectionContext(el);

                var upperNode = this.param.toUpperCase();
                var wrapperCtx = context.find(function (x) {
                    return x.nodeName == upperNode;
                });
                if (wrapperCtx) {
                    this.editor.log('Unwrapping node ' + this.param);
                    this.editor.unwrap(wrapperCtx);
                }
            } else {
                this.editor.log('Executing native command removeFormat');
                this.editor.restoreSelection();
                document.execCommand('removeFormat', false, "");
            }
        }
    }, {
        key: "executeInsert",
        value: function executeInsert() {
            var nodetype = this.param;
            var newNode = document.createElement(nodetype);

            var selection = this.editor.restoreSelection();
            var el = selection.focusNode;

            if (el == this.editor.contentel) {
                this.editor.contentel.insertBefore(newNode, this.editor.contentel.children[selection.focusOffset]);
            } else {
                var context = this.editor.createSelectionContext(el);
                var topLevelEl = context[context.length - 1];

                this.editor.contentel.insertBefore(newNode, topLevelEl.nextElementSibling);

                if (selection.focusOffset == 0) {} else {
                    var range = selection.getRangeAt(0);
                    range.setStart(newNode.nextElementSibling || topLevelEl.nextElementSibling || newNode, 0);
                    range.collapse(true);

                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
    }, {
        key: "execute",
        value: function execute(ev) {
            switch (this.webName) {
                case "text":
                    this.executeText();break;
                case "exec":
                    this.executeExec();break;
                case "block":
                    this.executeBlock();break;
                case "remove":
                    this.executeRemove();break;
                case "insert":
                    this.executeInsert();break;

                // Default is noOp, but display warning for easier debugging
                default:
                    this.editor.log("Warning : Tried to execute command with unknown webName [" + this.webName + "]");
            }

            this.editor.takeSnapshot();

            ev.stopPropagation();
            ev.preventDefault();
            return false;
        }
    }]);

    return LiliumTextWebCommand;
}(LiliumTextCommand);

var LiliumTextCustomCommand = function (_LiliumTextCommand2) {
    _inherits(LiliumTextCustomCommand, _LiliumTextCommand2);

    function LiliumTextCustomCommand(id, callback, cssClass, imageURL, text) {
        _classCallCheck(this, LiliumTextCustomCommand);

        var _this5 = _possibleConstructorReturn(this, (LiliumTextCustomCommand.__proto__ || Object.getPrototypeOf(LiliumTextCustomCommand)).call(this));

        _this5.webName = id;
        _this5.callback = callback;
        _this5.cssClass = cssClass;
        _this5.imageURL = imageURL;
        _this5.text = text;
        return _this5;
    }

    _createClass(LiliumTextCustomCommand, [{
        key: "execute",
        value: function execute() {
            this.callback.apply(this, arguments) && this.editor.takeSnapshot();
            return false;
        }
    }]);

    return LiliumTextCustomCommand;
}(LiliumTextCommand);

var LiliumTextHistoryEntry = function () {
    function LiliumTextHistoryEntry(type) {
        _classCallCheck(this, LiliumTextHistoryEntry);

        this.type = type;
    }

    _createClass(LiliumTextHistoryEntry, [{
        key: "undo",
        value: function undo() {}
    }], [{
        key: "makeStaticClassesBecauseJavascriptIsStillWeird",
        value: function makeStaticClassesBecauseJavascriptIsStillWeird() {
            // Create nested static classes
            LiliumTextHistoryEntry.ChildListHistoryEntry = function (_LiliumTextHistoryEnt) {
                _inherits(ChildListHistoryEntry, _LiliumTextHistoryEnt);

                function ChildListHistoryEntry(record) {
                    _classCallCheck(this, ChildListHistoryEntry);

                    var _this6 = _possibleConstructorReturn(this, (ChildListHistoryEntry.__proto__ || Object.getPrototypeOf(ChildListHistoryEntry)).call(this, "ChildList"));

                    _this6.record = record;
                    _this6.target = record.target;
                    _this6.previousState = record.oldValue;
                    return _this6;
                }

                return ChildListHistoryEntry;
            }(LiliumTextHistoryEntry);

            LiliumTextHistoryEntry.TextHistoryEntry = function (_LiliumTextHistoryEnt2) {
                _inherits(TextHistoryEntry, _LiliumTextHistoryEnt2);

                function TextHistoryEntry(record) {
                    _classCallCheck(this, TextHistoryEntry);

                    var _this7 = _possibleConstructorReturn(this, (TextHistoryEntry.__proto__ || Object.getPrototypeOf(TextHistoryEntry)).call(this, "Text"));

                    _this7.record = record;
                    return _this7;
                }

                return TextHistoryEntry;
            }(LiliumTextHistoryEntry);

            LiliumTextHistoryEntry.AttributesHistoryEntry = function (_LiliumTextHistoryEnt3) {
                _inherits(AttributesHistoryEntry, _LiliumTextHistoryEnt3);

                function AttributesHistoryEntry(record) {
                    _classCallCheck(this, AttributesHistoryEntry);

                    var _this8 = _possibleConstructorReturn(this, (AttributesHistoryEntry.__proto__ || Object.getPrototypeOf(AttributesHistoryEntry)).call(this, "Attributes"));

                    _this8.record = record;
                    return _this8;
                }

                return AttributesHistoryEntry;
            }(LiliumTextHistoryEntry);

            LiliumTextHistoryEntry.AutomaticSnapshotEntry = function (_LiliumTextHistoryEnt4) {
                _inherits(AutomaticSnapshotEntry, _LiliumTextHistoryEnt4);

                function AutomaticSnapshotEntry(state) {
                    _classCallCheck(this, AutomaticSnapshotEntry);

                    var _this9 = _possibleConstructorReturn(this, (AutomaticSnapshotEntry.__proto__ || Object.getPrototypeOf(AutomaticSnapshotEntry)).call(this, "AutomaticSnapshot"));

                    _this9.markup = state;
                    return _this9;
                }

                _createClass(AutomaticSnapshotEntry, [{
                    key: "undo",
                    value: function undo(editor) {
                        if (editor.content != this.markup) {
                            editor.content = this.markup;
                            return true;
                        }
                    }
                }]);

                return AutomaticSnapshotEntry;
            }(LiliumTextHistoryEntry);

            LiliumTextHistoryEntry.ManualSnapshotEntry = function (_LiliumTextHistoryEnt5) {
                _inherits(ManualSnapshotEntry, _LiliumTextHistoryEnt5);

                function ManualSnapshotEntry(state) {
                    _classCallCheck(this, ManualSnapshotEntry);

                    var _this10 = _possibleConstructorReturn(this, (ManualSnapshotEntry.__proto__ || Object.getPrototypeOf(ManualSnapshotEntry)).call(this, "ManualSnapshot"));

                    _this10.markup = state;
                    return _this10;
                }

                _createClass(ManualSnapshotEntry, [{
                    key: "undo",
                    value: function undo(editor) {
                        if (editor.content != this.markup) {
                            editor.content = this.markup;
                            return true;
                        }
                    }
                }]);

                return ManualSnapshotEntry;
            }(LiliumTextHistoryEntry);
        }
    }, {
        key: "fromRecord",
        value: function fromRecord(record) {
            switch (record.type) {
                case "childList":
                    return new LiliumTextHistoryEntry.ChildListHistoryEntry(record);
                case "characterData":
                    return new LiliumTextHistoryEntry.TextHistoryEntry(record);
                case "attributes":
                    return new LiliumTextHistoryEntry.AttributesHistoryEntry(record);
            }
        }
    }, {
        key: "fromSnapshot",
        value: function fromSnapshot(markup, manual) {
            return manual ? new LiliumTextHistoryEntry.ManualSnapshotEntry(markup) : new LiliumTextHistoryEntry.AutomaticSnapshotEntry(markup);
        }
    }]);

    return LiliumTextHistoryEntry;
}();

LiliumTextHistoryEntry.makeStaticClassesBecauseJavascriptIsStillWeird();

var LiliumTextPlugin = function () {
    function LiliumTextPlugin(identifier) {
        _classCallCheck(this, LiliumTextPlugin);

        this.identifier = identifier;
        this.active = false;
    }

    _createClass(LiliumTextPlugin, [{
        key: "register",
        value: function register() {}
    }, {
        key: "unregister",
        value: function unregister() {}
    }]);

    return LiliumTextPlugin;
}();

var LiliumText = function () {
    _createClass(LiliumText, null, [{
        key: "createDefaultCommands",
        value: function createDefaultCommands(editor) {
            return [[new LiliumTextWebCommand('text', editor.settings.boldnode || "strong", "far fa-bold"), new LiliumTextWebCommand('text', editor.settings.italicnode || "em", "far fa-italic"), new LiliumTextWebCommand('text', editor.settings.underlinenode || "u", "far fa-underline"), new LiliumTextWebCommand('text', editor.settings.strikenode || "strike", "far fa-strikethrough"), new LiliumTextWebCommand('remove', undefined, "far fa-eraser")], [new LiliumTextCustomCommand('undo', editor.undo.bind(editor), 'far fa-undo'), new LiliumTextCustomCommand('redo', editor.redo.bind(editor), 'far fa-redo')], [new LiliumTextWebCommand('block', editor.settings.breaktag || 'p', 'far fa-paragraph'), new LiliumTextWebCommand("block", "h1", "far fa-h1"), new LiliumTextWebCommand("block", "h2", "far fa-h2"), new LiliumTextWebCommand("block", "h3", "far fa-h3"), new LiliumTextWebCommand("block", "blockquote", "far fa-quote-right")], [new LiliumTextWebCommand('insert', 'hr', 'far fa-minus')], [new LiliumTextWebCommand('exec', "insertOrderedList", "far fa-list-ol"), new LiliumTextWebCommand('exec', "insertUnorderedList", "far fa-list-ul"), new LiliumTextWebCommand('remove', 'a', 'far fa-unlink')], [new LiliumTextCustomCommand("code", editor.toggleCode.bind(editor), "far fa-code")]];
        }
    }, {
        key: "makeLogFunction",
        value: function makeLogFunction() {
            return function (str) {
                return console.log("[LiliumText] " + str);
            };
        }
    }, {
        key: "defaultSettings",
        get: function get() {
            return {
                initrender: true,
                removepastedstyles: true,
                dev: false,
                hooks: {},
                plugins: [],
                theme: "minim",
                width: "auto",
                boldnode: "strong",
                italicnode: "em",
                historyInterval: 5000,
                maxHistoryStack: 100,
                underlinenode: "u",
                strikenode: "strike",
                height: "420px",
                breaktag: "p",
                blockelements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "ol", "ul", "article", "dd", "dl", "dt", "figure", "header", "hr", "main", "section", "table", "tfoot"],
                inlineelements: ["a", "b", "big", "code", "em", "i", "img", "small", "span", "strong", "sub", "sup", "time", "var"],
                content: "",
                urldetection: /^((https?):\/)\/?([^:\/\s]+)((\/\w+)*\/?)([\w\-\.])+/i
            };
        }
    }]);

    function LiliumText(nameOrElem) {
        var _this11 = this;

        var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, LiliumText);

        this.initat = window.performance.now();
        this.initialized = false;
        this.destroyed = false;
        this.codeview = false;
        this.focused = false;
        this._historylastState = "";
        this.hooks = {};
        this._plugins = [];

        this.wrapperel = typeof nameOrElem == "string" ? document.querySelector(nameOrElem) || document.getElementById(nameOrElem) : nameOrElem;
        if (!this.wrapperel) {
            throw new Error("LiliumText - Invalid element, DOM selector, or DOM element ID.");
        }

        this.id = this.wrapperel.id || "liliumtext-" + btoa(Math.random().toString()).slice(0, -2);
        LiliumText.instances[this.id] = this;

        this.settings = Object.assign(LiliumText.defaultSettings, settings);
        this.commandsets = this.settings.commandsets || LiliumText.createDefaultCommands(this);
        this.log = this.settings.dev ? LiliumText.makeLogFunction() : function () {};
        this.log('Created LiliumText instance');

        this.log('Firing document event');
        document.dispatchEvent(new CustomEvent("liliumTextCreated", { detail: this }));

        this.wrapperel.classList.add('liliumtext');
        this.wrapperel.classList.add('theme-' + this.settings.theme);
        Object.keys(this.settings.hooks).forEach(function (ev) {
            _this11.bind(ev, _this11.settings.hooks[ev]);
        });

        this._init();
        this.settings.initrender && this.render();

        this.log('Ready in ' + (window.performance.now() - this.initat) + 'ms');
    }

    _createClass(LiliumText, [{
        key: "destroy",
        value: function destroy(fulldelete) {
            this.fire('destroy');
            while (this.wrapperel.firstElementChild) {
                this.wrapperel.firstElementChild.remove();
            }

            if (fulldelete) {
                delete LiliumText.instances[this.id];
            } else {
                LiliumText.instances[this.id] = undefined;
            }

            for (var k in this) {
                this[k] = undefined;
            }

            this.destroyed = true;
            document.dispatchEvent(new CustomEvent("liliumTextDestroyed", { detail: this }));
        }
    }, {
        key: "lock",
        value: function lock() {
            this.contentel.removeAttribute('contenteditable');
        }
    }, {
        key: "unlock",
        value: function unlock() {
            this.contentel.contentEditable = true;
        }
    }, {
        key: "createSelectionContext",
        value: function createSelectionContext(elem) {
            var context = [];

            while (elem != this.contentel && elem) {
                context.push(elem);
                elem = elem.parentNode;
            }

            return context;
        }
    }, {
        key: "selectWord",
        value: function selectWord(sel) {
            var range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);

            var backwards = range.collapsed;
            range.detach();

            var endNode = sel.focusNode;
            var endOffset = sel.focusOffset;
            sel.collapse(sel.anchorNode, sel.anchorOffset);

            var direction = backwards ? ['backward', 'forward'] : ['forward', 'backward'];

            sel.modify("move", direction[0], "character");
            sel.modify("move", direction[1], "word");
            sel.extend(endNode, endOffset);
            sel.modify("extend", direction[1], "character");
            sel.modify("extend", direction[0], "word");
        }
    }, {
        key: "selectParent",
        value: function selectParent(sel, par) {
            var range = document.createRange();
            range.selectNode(par || sel.focusNode.parentNode);

            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    }, {
        key: "unwrap",
        value: function unwrap(el) {
            var par = el.parentNode;
            while (el.firstChild) {
                par.insertBefore(el.firstChild, el);
            }
            el.remove();
        }
    }, {
        key: "_pushToHistory",
        value: function _pushToHistory(entry) {
            this.fire('history', entry);
            this.log("Pushing new entry to history");
            // Push to history, and remove first element if array is too big
            this._history.mutations.push(entry) > this.settings.maxHistoryStack && this._history.mutations.shift();
            this._history.undoStack = [];
        }
    }, {
        key: "_observe",
        value: function _observe(record) {
            var _this12 = this;

            record.forEach(function (x) {
                return _this12._pushToHistory(LiliumTextHistoryEntry.fromRecord(x));
            });
        }
    }, {
        key: "_takeSnapshot",
        value: function _takeSnapshot(manual) {
            if (this.contentel.innerHTML != this._historylastState) {
                this._historylastState = this.contentel.innerHTML;
                this._pushToHistory(LiliumTextHistoryEntry.fromSnapshot(this._historylastState, manual));
            }
        }
    }, {
        key: "_startHistory",
        value: function _startHistory() {
            var _this13 = this;

            if (false && window.MutationObserver) {
                this.observer = new MutationObserver(this._observe.bind(this));
                this.observer.observe(this.contentel, { childList: true, subtree: true });
            } else {
                this.snapshotTimerID = setInterval(function () {
                    _this13._takeSnapshot();
                }, this.settings.historyInterval);
            }
        }
    }, {
        key: "resetSnapshot",
        value: function resetSnapshot() {
            this.snapshotTimerID && clearInterval(this.snapshotTimerID);
            this._startHistory();
        }
    }, {
        key: "takeSnapshot",
        value: function takeSnapshot() {
            this.resetSnapshot();
            this._takeSnapshot(true);
        }
    }, {
        key: "isRangeInEditor",
        value: function isRangeInEditor(range) {
            return range && range.startContainer.compareDocumentPosition(this.contentel) & Node.DOCUMENT_POSITION_CONTAINS;
        }
    }, {
        key: "insert",
        value: function insert(element) {
            var selection = this.restoreSelection();
            var range = this.getRange();
            if (!this.isRangeInEditor(range)) {
                this.contentel.focus();
                range = this.storeRange();
            }

            range.insertNode(element);
            range.setStartAfter(element);

            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, {
        key: "insertBlock",
        value: function insertBlock(element) {
            var selection = this.restoreSelection();
            var context = this.createSelectionContext(selection.focusNode);
            var ctxElem = context[context.length - 1];

            if (selection.focusNode == this.contentel) {
                this.contentel.insertBefore(element, this.contentel.children[selection.focusOffset]);

                var range = selection.getRangeAt(0).cloneRange();
                range.setEndAfter(element);
                range.collapse(false);

                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                if (ctxElem && ctxElem.nextSibling) {
                    var curParag = ctxElem;
                    if (curParag) {
                        curParag.parentNode.insertBefore(element, selection.focusOffset == 0 ? curParag : curParag.nextSibling);
                    }
                } else {
                    this.contentel.appendChild(element);
                }

                if (selection.focusOffset != 0) {
                    var _range2 = selection.getRangeAt(0).cloneRange();
                    _range2.setEndAfter(element);
                    _range2.collapse(false);

                    selection.removeAllRanges();
                    selection.addRange(_range2);
                }
            }
        }
    }, {
        key: "_focused",
        value: function _focused() {
            var eventresult = this.fire('focus');
            this.focused = true;
            if (!eventresult || !eventresult.includes(false)) {
                this._tempSelection = undefined;
                this._tempRange = undefined;
                document.execCommand("defaultParagraphSeparator", false, this.settings.breaktag);
            }
        }
    }, {
        key: "_clicked",
        value: function _clicked(event) {
            var selection = window.getSelection();

            if (selection.focusNode && selection.focusNode.parentElement) {
                var context = this.createSelectionContext(selection.focusNode);
                var element = selection.focusNode.parentElement;
                this.fire('clicked', { context: context, event: event, selection: selection, element: element });
            } else {
                this.fire('clicked', { selection: selection, event: event });
            }

            if (event.target == this.contentel && this.contentel.offsetHeight - event.offsetY < 60 && editor.contentel.scrollHeight - this.contentel.getBoundingClientRect().height - this.contentel.scrollTop < 30) {
                var newParag = document.createElement(this.settings.breaktag);
                newParag.appendChild(document.createElement('br'));
                this.contentel.appendChild(newParag);

                var range = document.createRange();
                range.selectNode(newParag);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                this.contentel.scrollTop = editor.contentel.scrollHeight - this.contentel.getBoundingClientRect().height;
            }
        }
    }, {
        key: "redo",
        value: function redo() {
            if (this._history.undoStack.length != 0) {
                this.log('Restoring from undo stack');
                var undoItem = this._history.undoStack.pop();
                this._history.mutations.push(undoItem.mutation);
                this.content = undoItem.markup;
                this.resetSnapshot();

                this.fire('redo');
            }

            return false;
        }
    }, {
        key: "undo",
        value: function undo() {
            if (this._history.mutations.length != 0) {
                this.log('Going up one state in history');
                var mutation = this._history.mutations.pop();
                var oldMarkup = this.content;

                if (mutation.undo(this)) {
                    this.log('Pushing to undo stack');
                    this._history.undoStack.push({ markup: oldMarkup, mutation: mutation });
                    this.resetSnapshot();
                    this.fire('undo');
                } else {
                    return this.undo();
                }
            } else {
                this.log('Restored original content');
                this.content = this.settings.content;
            }

            return false;
        }
    }, {
        key: "storeRange",
        value: function storeRange(maybeRange) {
            if (maybeRange) {
                this._tempRange = maybeRange;
            } else {
                var tempSelection = window.getSelection();

                if (tempSelection.type == "None" || !tempSelection.focusNode) {
                    var range = document.createRange();
                    range.setStart(this.contentel, 0);
                    this._tempRange = range;
                } else {
                    this._tempRange = tempSelection.getRangeAt(0).cloneRange();
                }
            }

            return this._tempRange;
        }
    }, {
        key: "restoreSelection",
        value: function restoreSelection() {
            var sel = window.getSelection();

            if (!this.focused) {
                sel.removeAllRanges();
                sel.addRange(this.getRange());
            }

            return sel;
        }
    }, {
        key: "getRange",
        value: function getRange() {
            return this._tempRange || this.storeRange();
        }
    }, {
        key: "_blurred",
        value: function _blurred() {
            this.focused = false;
            this.storeRange();
            this.fire('blur');
        }
    }, {
        key: "_keydown",
        value: function _keydown(e) {
            if ((e.ctrlKey || e.metaKey) && String.fromCharCode(e.which).toLowerCase() == 'z') {
                e.preventDefault();
                this.undo();

                return false;
            }
        }
    }, {
        key: "_pasted",
        value: function _pasted(e) {
            var data = e.clipboardData || window.clipboardData;
            var eventresult = this.fire('paste', { dataTransfer: data, event: e });

            if (eventresult && eventresult.includes(false)) {
                return;
            }

            if (data.types.includes('text/html')) {
                e.stopPropagation();
                e.preventDefault();

                var markup = data.getData("text/html");
                var template = document.createElement('div');
                template.innerHTML = markup;
                if (this.settings.removepastedstyles) {
                    Array.prototype.forEach.call(template.querySelectorAll('*'), function (x) {
                        return x.removeAttribute('style');
                    });
                    Array.prototype.forEach.call(template.querySelectorAll('style'), function (x) {
                        return x.remove();
                    });
                }

                document.execCommand('insertHTML', false, template.innerHTML);
            } else {
                var text = data.getData("text");
                if (this.settings.urldetection.exec(text)) {
                    e.stopPropagation();
                    e.preventDefault();

                    document.execCommand('createLink', false, text);
                }
            }
        }
    }, {
        key: "_registerAllPlugins",
        value: function _registerAllPlugins() {
            var _this14 = this;

            this.settings.plugins && this.settings.plugins.forEach(function (pluginClass) {
                return _this14.registerPlugin(pluginClass);
            });
        }
    }, {
        key: "registerPlugin",
        value: function registerPlugin(pluginClass) {
            var pluginInstance = new pluginClass(this);

            this.log('Registering plugin with id ' + pluginInstance.identifier);
            pluginInstance.register();
            this._plugins.push(pluginInstance);
        }
    }, {
        key: "unregisterPlugin",
        value: function unregisterPlugin(id) {
            var index = -1;
            var pluginInstance = this._plugins.find(function (x, i) {
                if (x.identifier == id) {
                    index = i;
                    return x;
                }
            });

            if (pluginInstance) {
                pluginInstance && pluginInstance.unregister();
                this._plugins.splice(index, 1);
            }
        }
    }, {
        key: "_init",
        value: function _init() {
            this.log('Initializing LiliumText instance');
            this.toolbarel = document.createElement('div');
            this.toolbarel.className = "liliumtext-topbar";

            this.contentel = document.createElement('div');
            this.contentel.contentEditable = true;
            this.contentel.className = "liliumtext-editor";

            this.codeel = document.createElement('pre');
            this.codeel.contentEditable = true;
            this.codeel.className = "liliumtext-code";

            this.wrapperel.appendChild(this.toolbarel);
            this.wrapperel.appendChild(this.contentel);
            this.wrapperel.appendChild(this.codeel);

            if (this.settings.content && this.settings.initrender) {
                //setTimeout(() => {
                this.contentel.innerHTML = this.settings.content;
                //}, 10);
            } else {
                this.contentel.appendChild(document.createElement(this.settings.breaktag));
            }

            this.contentel.addEventListener('paste', this.settings.onpaste || this._pasted.bind(this));
            this.contentel.addEventListener('focus', this._focused.bind(this));
            this.contentel.addEventListener('blur', this._blurred.bind(this));
            this.contentel.addEventListener('click', this._clicked.bind(this));
            this.contentel.addEventListener('keydown', this._keydown.bind(this));

            this._history = {
                mutations: [],
                undoStack: []
            };
            this._startHistory();
            this._registerAllPlugins();

            this.fire('init');
            this.log('Initialized LiliumText instance');
            this.initialized = true;
        }
    }, {
        key: "createCommandSet",
        value: function createCommandSet() {
            var set = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
            var index = arguments[1];
            var rerender = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            if (index === -1) {
                this.commandsets = [set].concat(_toConsumableArray(this.commandsets));
            } else if (index < this.commandsets.length) {
                this.commandsets = [].concat(_toConsumableArray(this.commandsets.slice(0, index)), [set], _toConsumableArray(this.commandsets.slice(index)));
            } else {
                this.commandsets.push(set);
            }

            rerender && this.render();
        }
    }, {
        key: "addCommand",
        value: function addCommand(command) {
            var setIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.commandsets.length - 1;
            var rerender = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var set = this.commandsets[setIndex];
            set ? set.push(command) : this.commandsets.push([command]);

            rerender && this.render();
        }
    }, {
        key: "bind",
        value: function bind(eventname, callback) {
            if (!this.hooks[eventname]) {
                this.hooks[eventname] = [callback];
            } else {
                this.hooks[eventname].push(callback);
            }
        }
    }, {
        key: "fire",
        value: function fire(eventname, args) {
            var _this15 = this;

            // this.log('Firing event : ' + eventname);
            return this.hooks[eventname] && this.hooks[eventname].map(function (callback) {
                return callback(_this15, args);
            });
        }
    }, {
        key: "toggleCode",
        value: function toggleCode() {
            this.log("Toggled code view");
            this.codeview = !this.codeview;

            if (this.codeview) {
                this.codeel.textContent = this.contentel.innerHTML;
            } else {
                this.contentel.innerHTML = this.codeel.textContent;
            }

            this.codeel.classList[this.codeview ? "add" : "remove"]("visible");
            this.contentel.classList[this.codeview ? "add" : "remove"]("invisible");

            this.fire('code', this.codeview);
            return true;
        }
    }, {
        key: "render",
        value: function render() {
            var _this16 = this;

            this.log('Rendering LiliumText instance');
            this.fire('willrender');

            this.log('Clearing toolbar');
            this.toolbarel.firstElementChild && this.toolbarel.firstElementChild.remove();

            this.log('Rendering toolbar');
            var toolbarwrap = document.createElement('div');
            toolbarwrap.className = "liliumtext-commands";
            this.commandsets.forEach(function (set) {
                var setel = document.createElement('div');
                setel.className = "liliumtext-commandset";
                toolbarwrap.appendChild(setel);

                set.forEach(function (command) {
                    setel.appendChild(command.make(_this16));
                });
            });

            this.contentel.style.height = this.settings.height;
            this.codeel.style.height = this.settings.height;
            this.wrapperel.style.width = this.settings.width;

            this.toolbarel.appendChild(toolbarwrap);

            this.fire('render');
            this.log('Done rendering');
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.content;
        }
    }, {
        key: "describe",
        value: function describe() {
            var _this17 = this;

            return this.settings.dev ? "[Development LiliumText Editor instance] Wraps DOM element with ID " + (this.wrapperel.id || '[No ID]') + ". This instance currently has " + Object.keys(this.hooks).reduce(function (total, ev) {
                return total + _this17.hooks[ev].length;
            }, 0) + " event hooks." : "[LiliumText Editor]";
        }
    }, {
        key: "content",
        set: function set(markup) {
            var mobject = { markup: markup };
            this.fire('set', mobject);

            this.contentel.innerHTML = mobject.markup;
        },
        get: function get() {
            var mhtml = { markup: this.contentel.innerHTML };
            var content = this.fire('get', mhtml);
            return mhtml.markup;
        }
    }]);

    return LiliumText;
}();

;
LiliumText.instances = {};

if (typeof module !== "undefined") {
    module.exports = { LiliumText: LiliumText, LiliumTextCustomCommand: LiliumTextCustomCommand, LiliumTextWebCommand: LiliumTextWebCommand, LiliumTextCommand: LiliumTextCommand, LiliumTextPlugin: LiliumTextPlugin };
}
