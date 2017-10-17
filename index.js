;(function() {

if (window.tyler) return;

const EVENT_NAMESPACE = 'tyler/';

var dispatcher = {
    fire(event, options) {
        if (this.interceptionCallback) this.interceptionCallback(event, options);
        window.dispatchEvent(new CustomEvent(EVENT_NAMESPACE + event, { detail: options }));
        return this;
    },
    on(event, handler, context) {
        if (event instanceof Array)
            return event.forEach(item => this.on(item, handler, context)) || this;
        window.addEventListener(
            EVENT_NAMESPACE + event,
            this.registerHandler(event, handler, context || this)
        );
        return this;
    },
    off(event, handler, context) {
        this.discardHandlers(event, handler, context || this).forEach(discardedHandler => {
            window.removeEventListener(EVENT_NAMESPACE + event, discardedHandler);
        });
        return this;
    },
    registerHandler(event, handler, context) {
        var modified = e => handler.call(context, event, e.detail);
        this.handlers.push({ event, original: handler, modified, context });
        return modified;
    },
    discardHandlers(event, handler, context) {
        var discardedHandlers = [], matches;
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            matches = (
                this.handlers[i].event === event &&
                (!handler || this.handlers[i].original === handler) &&
                (!context || this.handlers[i].context === context)
            );
            if (matches) discardedHandlers.push(this.handlers.splice(i, 1)[0].modified);
        }
        return discardedHandlers;
    },
    intercept(callback) {
        this.interceptionCallback = callback;
        return this;
    },
    // garbage collector
    // removes registered event handlers associated with detached DOM nodes
    gc() {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            let node = this.handlers[i].context.node;
            if (node && node.parentNode === null) this.handlers.splice(i, 1);
        }
    },
    handlers: []
};

var Observer = function(extension) {
    Object.assign(this, extension || {});
};

Object.assign(Observer.prototype, {
    fire(event, options) {
        dispatcher.fire(event, Object.assign({ source: this }, options));
        return this;
    },
    on(event, handler) {
        dispatcher.on(event, handler, this);
        return this;
    },
    off(event, handler) {
        dispatcher.off(event, handler, this);
        return this;
    }
});

var toDOM = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;

var createElement = extension => {
    var Element = function(node) {
        Observer.call(this, extension);
        this.node = typeof node === 'string' ? toDOM(node)[0] : node;
        Element.initialHandlers.forEach(item => this.on(item.event, item.handler));
    };

    Element.prototype = Object.create(Observer.prototype);
    Element.initialHandlers = [];

    Element.on = (event, handler) => {
        Element.initialHandlers.push({ event, handler });
        return Element;
    };

    return Element;
};

window.tyler = { Observer, Service: Observer, createElement, dispatcher, toDOM };

})();