;(function() {

if (window.tyler) return;

const EVENT_NAMESPACE = 'tyler/';
const EVENT_SOURCE_SELF_REFERENCE = './';

var dispatcher = {
    fire(event, options) {
        if (this.interceptionCallback) this.interceptionCallback(event, options);
        window.dispatchEvent(new CustomEvent(EVENT_NAMESPACE + event, { detail: options }));
        return this;
    },
    off(event, handler) {
        window.removeEventListener(EVENT_NAMESPACE + event, handler);
        return this;
    },
    on(event, handler, context) {
        if (event instanceof Array)
            return event.forEach(item => this.on(item, handler, context)) || this;

        if (event.indexOf(EVENT_SOURCE_SELF_REFERENCE) === 0) {
            let originalHandler = handler;
            event = event.substring(EVENT_SOURCE_SELF_REFERENCE.length);
            handler = function(e, options) {
                if (options && options.source === context) originalHandler.call(context, e, options);
            };
        }
        else if (context)
            handler = handler.bind(context);

        window.addEventListener(EVENT_NAMESPACE + event, e => handler(e, e.detail), false);
        return this;
    },
    intercept(callback) {
        this.interceptionCallback = callback;
        return this;
    }
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