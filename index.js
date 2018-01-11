{

let dispatcher = {
    fire(event, options) {
        if (this.interceptionCallback) this.interceptionCallback(event, options);
        this.listeners.forEach(listener => {
            if (listener.event === event) listener.handler.call(listener.context, event, options);
        });
        return this;
    },
    on(event, handler, context) {
        if (event instanceof Array)
            event.forEach(item => this.on(item, handler, context));
        else this.listeners.push({ event, handler, context });
        return this;
    },
    off(event, handler, context) {
        for (let i = this.listeners.length - 1; i >= 0; i--) {
            let matches = (
                this.listeners[i].event === event &&
                (!handler || this.listeners[i].handler === handler) &&
                (!context || this.listeners[i].context === context)
            );
            if (matches) this.listeners.splice(i, 1);
        }
        return this;
    },
    intercept(callback) {
        this.interceptionCallback = callback;
        return this;
    },
    // garbage collector
    // removes registered event handlers associated with detached DOM nodes
    gc() {
        for (let i = this.listeners.length - 1; i >= 0; i--) {
            let context = this.listeners[i].context;
            if (context && context.node && context.node.parentNode === null)
                this.listeners.splice(i, 1);
        }
    },
    listeners: []
};

let Observer = function(extension) {
    Object.assign(this, extension || {});
};

Object.assign(Observer.prototype, {
    fire(event, options) {
        dispatcher.fire(event, options);
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

let toDOM = html => new DOMParser().parseFromString(html, 'text/html').body.childNodes;

let createElement = extension => {
    let Element = function(node) {
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

}