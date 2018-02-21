# Lilium Text
A lightweight, dependency-free, extensible text editor. 

![First Screenshot](https://erikdesjardins.com/static/git/liliumtext-1.jpg)

## About the project
[Narcity Media](https://github.com/narcitymedia/) needed a new Text Editor to replace to current one, and I figured since we don't have anything open source yet (including our *AMAZING* CMS), this would be a good start. The editor doesn't do much yet, and was created overnight. 

I tried to find a great, open-source rich text editor that didn't require other libraries (like jQuery), but couldn't find anything interesting enough. Since the entire CMS is almost dependency-free, I figured the only few dependencies should be dependency-free as well. 

## Compiling
Lilium Text uses [Babel](https://babeljs.io/) to compile ES6 files into "browser Javascript". Simply install all required packages once using `npm install`, then run `npm run build`. Compiled files will be located under `/build`.

## Branches
For now, I'll be pushing to master until we have a working build. I will then switch to a dev branch and will accept pull requests. 

## How to use
```html
<div id="myeditor"></div>

<script>
    const editor = new LiliumText('myeditor', {});
</script>
```

It is possible to hook on various events and customize plenty of stuff. Hooks can be passed as constructor options, or defined afterwards. 

## Options
| Option              | Behaviour                                          | Default                                                 |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| initrender          | Will render right after creating the object.       | true                                                    |
| removepastedstyles  | Removes the "style" attribute when pasting markup. | true                                                    |
| dev                 | Development flag. If true, will output in console. | false                                                   |
| plugins             | An array of LiliumTextPlugin extended classes      | []                                                      |
| theme               | Theme identifier                                   | "minim"                                                 |
| hooks               | Objects containing hooks and callbacks.            | {}                                                      |
| width               | CSS width of the entire text Lilium Text           | "auto"                                                  |
| height              | CSS height of the **editor** text box              | "420px"                                                 |
| boldnode            | Element used to wrap bold text                     | "strong"                                                |
| italicnode          | Element used to wrap italic text                   | "italic"                                                |
| underlinenode       | Element used to wrap underlined text               | "u"                                                     |
| strikenode          | Element used to wrap strikedthrough text           | "strike"                                                |
| breaktag            | Defined the HTML tag used to wrap new lines        | "p"                                                     |
| content             | Initial content                                    | ""                                                      |
| urldetection        | Regular expression used to detect pasted links     | /^((https?):\/)\/?([^:\/\s]+)((\/\w+)*\/?)([\w\-\.])+/i |

## Hooks
Using the previous code example, let `editor` be an instance of `LiliumText`. It is possible to hook on certain events.
```javascript
// Hook during initialization
const editor = new LiliumText('myeditor', {
    hooks : {
        init : thatEditor => {
            // Idea : register new commands in the top bar
        }
    }
});

// Hook after initialization
editor.bind('code', (editor, isCodeView) => {
    if (isCodeView) {
        // Idea : Run some fancy library to do code highlighting
    }
});
```

| Event Name | Occasion                                     | Args                                  |
| ---------- | -------------------------------------------- | ------------------------------------- |
| init       | The editor is finished initializing          |                                       |
| command    | A command is going to be executed            | String `commandName`                  |
| destroy    | The editor object was released               |                                       |
| history    | A state was pushed to history stack          | Entry `LiliumTextHistoryEntry`        |
| focus      | The text portion of the editor was focused   |                                       |
| paste      | The user pasted content into the editor      | Object `DataTransfer`                 |
| code       | Toggle between text view and html view       | Boolean, true if code view            |
| willrender | Editor is about to render                    |                                       |
| render     | Editor rendered                              |                                       |
| set        | The content setter was called                | Object `{ markup }`                   |
| get        | The content getter was called                | Object `{ markup }`                   |
| clicked    | A click inside the content editor            | Context, Event, Selection, Element    |
| undo       | Went back one step in history stack          |                                       |
| redo       | Went forward one step in history stack       |                                       |

Some events will carry arguments as detailed in the "Args" column. When defining a callback, it is important to remember that the first argument is **always** the editor firing the event. If event arguments exist, they will appear as the second argument of the callback. 
```javascript
editor.bind('someEvent', (thatEvent, eventArgs) => {
    editor === thatEvent // true
});
```

This can be useful if you create multiple editors calling the same function. 
```javascript
const init = thatEditor => {
    console.log('Initialized editor with id ' + thatEditor.id);
};

const editor1 = new LiliumText('myeditor1', { hooks : { init }});
const editor2 = new LiliumText('myeditor2', { hooks : { init }});
const editor3 = new LiliumText('myeditor3', { hooks : { init }});

// The previous script should output : 
//  > Initialized editor with id myeditor1 
//  > Initialized editor with id myeditor2
//  > Initialized editor with id myeditor3
```

## Adding commands
It is possible to add custom commands in the top bar. This can be done by calling the `addCommand` instance method, and by passing a new `LiliumTextCustomCommand` object. The following example takes for granted that the programmer uses FontAwesome. 
```javascript
const insertImage = thatEditor => {
    // Show an image picker
    someImagePicker.show(img => {
        // Insert image in content
    });
}

const insertImageCommand = new LiliumTextCustomCommand("insertImageCommand", insertImage, 'far fa-image');
editor.addCommand(insertImageCommand);
```

The `LiliumTextCustomCommand` constructor accepts 5 arguments, 2 required.
 - A unique identifier
 - A callback
 - One or many CSS classes
 - An image URL to use as an icon
 - Text to append to the icon or image

The `addCommand` instance method accept 2 arguments, 1 required.
 - An instance of `LiliumTextCustomCommand`
 - The index of the command group in the topbar

Since the top bar contains multiple groups of commands (2-dim array), it is possible to specify in which group the new command should be added. If the index is out of bounds, it will **create a new one**. If none is speficied, the command will be added to **the last group**.

## Content
There is a getter and a setter associated with the editor's content markup. Using the `content` accessor property, the content can be read or set. 
```javascript
const sendToServer = () => {
    const markup = editor.content;
    someServerAPI.save(markup);
}

const loadFromServer = () => {
    someServerAPI.getContent(markup => {
        editor.content = markup;
    });
}
```

There exist two hooks related to the `content` property. It is possible to hook on both `get` and `set` evemts. That way, a plugin can be created to modify the content the moment it is set. An extra validation could be made to remove all `<script>` tags for instance.
```javascript
const removeScriptTags = (thatEditor, setArgs) => {
    // Parse markup
    const tempDOM = document.createElement('div');
    tempDOM.innerHTML = setArgs.markup;

    // Find script tags and remove them
    Array.prototype.forEach.call(tempDOM.querySelectorAll('script'), elScript => elScript.remove());

    // Set final markup
    setArgs.markup = tempDOM.innerHTML;
});

editor.on('set', removeScriptTags);
```

## Insert content
The `insert` instance method can be used in order to insert an element in the editor. It accepts **one parameter** that is the element to be inserted. If the cursor is not set, the element will be inserted at the top of the content box. It will otherwise be inserted after the cursor. The cursor will then move after the inserted element so that the method can be used multiple times. 
```javascript
const textNode = document.createTextNode('Hello, World!');
editor.insert(textNode);
```

## Plugins
For reusable logic, it is possible to extend the LiliumTextPlugin virtual class and create a plugin to avoid duplicate code. The plugin must override the two virtual methods `register`, `unregister` as well as the constructor. 

For example.
```javascript
class myPlugin extends LiliumTextPlugin {
    // The constructor receives a single argument : and instance of LiliumText
    constructor(editor) {
        // I recommend storing a reference to it like so
        this.editor = editor;
    }

    register() {
        this.boundInsertImage = this.insertImage.bind(this);
        const insertImageCommand = new LiliumTextCustomCommand("myPluginInsertImage", this.boundInsertImage, "far fa-image");

        // Add image insertion command in fourth group (index 3)
        this.instance.addCommand(insertImageCommand, 3);
        this.instance.bind('some-event', this.someOutcome);
    }

    unregister() {
        // Remove command, remove bindings, etc
    }

    insertImage() {
        // Insert new image into content using this.editor reference
    }
}
```

Once the class is ready to be tested, **the class itself** must be passed as an argument to the `registerPlugin` method of a LiliumText instance. It is also possible to pass an array of plugins to register during initialization using the `plugins` options. 

```javascript
const myEditor = new LiliumText('myEditor', { plugins : [myPlugin] });
// OR 

const myEdutir = new LiliumText('myEditor', {});
myEditor.registerPlugin(myPlugin);
```

The `register` method overridden by the `myPlugin` class will be called during the initialization if provided as an option of the LiliumText constructor, or when the `registerPlugin` method is called. 
