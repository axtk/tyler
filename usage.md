## Usage

Tyler provides two types of components: *Elements* and *Services*. Elements represent visual blocks of a user interface, the purpose of Services is to store and process data.

(In terms of the MV* design patterns, such as [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel) and [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), Elements can be regarded as views and view models, while Services as controllers and models. Still, Tyler doesn't require to stick to these design patterns and roles.)

The following example highlights the features of this little framework and the idea behind it.

```js
// the Pane is a constructor of a new Element;
// all its instances will have the custom methods defined here
var Pane = tyler.createElement({
    initialize() {
        // the instance's `.node` property refers to the DOM node it was created for
        this.node.querySelector('button')
            // every button click will cause a 'button clicked' event
            .addEventListener('click', () => this.fire('button clicked'));
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
// since there might be other 'button click' event sources, in order to handle
// only the events coming from itself, a prefix can be added to the event name
.on('./button clicked', function() {
    this.render('clicked');
})
.on('data loaded', function(event, options) {
    this.render(options.message);
});

// an instance of an Element requires a DOM node, or a portion of HTML markup
// which will be converted to a DOM node under the hood
new Pane(document.querySelector('#pane'));
```

Here is another component, a Service. It knows nothing about the previous component, nor does it attempt to refer to it. So, removing one of them wouldn't break the other. And still they interact with each other by sending and receiving events.

```js
new tyler.Service({
    load() {
        return fetch('/latest').then(response => response.json());
    }
})
.on('ready', function() {
    this.load().then(data => this.fire('data loaded', data));
});
```

All events are managed by the `tyler.dispatcher` object created behind the scenes. Here it will fire the initial event.

```js
tyler.dispatcher.fire('ready');
// optionally, an event interception callback can be setup on the dispatcher,
// which can be helpful for event logging
// tyler.dispatcher.intercept(console.log).fire('ready');
```