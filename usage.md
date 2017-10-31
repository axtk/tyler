# Usage

Tyler provides two types of components: *Elements* and *Services*. Elements represent visual blocks of a user interface, the purpose of Services is to store and process data.

(In terms of the MV* design patterns, such as [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel) and [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), Elements can be regarded as views and view models, while Services as controllers and models. Still, Tyler doesn't require to stick to these design patterns and roles.)

The following example highlights the concepts and features of this little framework, and the idea behind it.

## Element

```js
// the Pane is a constructor of a new Tyler Element;
// all its instances will have the custom methods defined here
var Pane = tyler.createElement({
    initialize() {
        // the instance's `.node` property refers to the DOM node it was created for
        this.node.querySelector('button')
            // every button click will cause a custom 'button clicked' event
            .addEventListener('click', () => this.fire('button clicked'));
        // all subscriptions of this instance to the 'ready' event can now be removed
        this.off('ready');
        // if it were necessary to unsubscribe a specific event handler from the component,
        // the handler could be passed as the second argument
    },
    render(message) {
        this.node.querySelector('.status').textContent = message;
    }
})
// the constructor exposes the `.on()` method to register event handlers
// which will be available on all its future instances
.on('ready', function() {
    this.initialize();
})
.on('data loaded', function(event, options) {
    this.render(options.message);
});

// an instance of a Tyler Element requires a DOM node, or a portion of HTML markup
// which will be converted to a DOM node under the hood
new Pane(document.querySelector('#pane'));
```

## Service

```js
// data processing will reside on the utility component
new tyler.Service({
    load() {
        return fetch('/latest').then(response => response.json());
    }
})
.on('ready', function() {
    this.load().then(data => this.fire('data loaded', data));
});
// it maintains an interaction with the previous component by sending and receiving events,
// without directly referring to another component, thus maintaining a great deal of independence
```

## Dispatcher

```js
// all events are managed by the `tyler.dispatcher` object created behind the scenes;
// here it fires the initial event
tyler.dispatcher.fire('ready');
```

```js
// optionally, an event interception callback can be setup on the dispatcher,
// which can be helpful for event logging
tyler.dispatcher.intercept(console.log).fire('ready');
```

```js
// when invoked, the garbage collector removes event handlers associated with
// components detached from the layout;
// this can be helpful when there are a lot of event handlers and layout rearrangements
tyler.dispatcher.gc();
```