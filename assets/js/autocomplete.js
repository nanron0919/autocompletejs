'use strict';

var Autocomplete = (function(document) {
    if ('undefined' === typeof [].forEach) {
        Array.prototype.forEach = function(func) {
            for (var i = 0; i < this.length; i++) {
                func(this[i], i);
            }
        };
    }

    if ('undefined' === typeof [].filter) {
        Array.prototype.filter = function(func) {
            for (var i = 0; i < this.length; i++) {
                if (false === func(this[i])) {
                    delete this[i];
                }
            }

            return this;
        };
    }

    return function(form, callback) {
        callback = callback || function() {};

        var selector = function(syntax, base_el) {
                var elem = (base_el || document),
                    elems = elem.querySelectorAll(syntax),
                    result = [];

                for (var i = 0; i < elems.length; i++) {
                    result.push(elems.item(i));
                }

                return 1 === result.length ? result[0] : result;
            },
            attachEvent = function(type, elem, func) {
                var eventListener = document.addEventListener || document.attachEvent;

                if (false === elem instanceof Array) {
                    elem = [elem];
                }

                elem.forEach(function(el, k) {
                    eventListener.apply(el, [type, func]);
                });
            },
            autocomplete = {
                fetchRemoteData: function(url, keyword, func) {
                    var xhr = new XMLHttpRequest(),
                        data;

                    xhr.open('GET', url + '?q=' + keyword, true);
                    xhr.responseType = 'json';
                    xhr.onreadystatechange = function(res) {
                        // done
                        if (4 === this.readyState) {
                            data = this.response || this.responseText;
                            data = ('string' === typeof data ? JSON.parse(data) : data);
                            func(data);
                        }
                    };
                    xhr.send();
                },
                getListElement: function(basenode) {
                    return selector('.autocomplete-list', basenode);
                },
                removeResultList: function(basenode) {
                    var existing_ul = autocomplete.getListElement(basenode);
                    existing_ul = existing_ul instanceof Array ? existing_ul : [existing_ul];

                    if (0 < existing_ul.length) {
                        existing_ul.forEach(function(el, k) {
                            if ('undefined' !== typeof el.remove) {
                                el.remove();
                            }
                            else {
                                el.textContent = '';
                                el.removeNode();
                            }
                        });
                    }
                },
                attachResultList: function(basenode, data) {
                    var frag = document.createDocumentFragment(),
                        ul = document.createElement('ul'),
                        parent = basenode.parentNode,
                        li;

                    if ('string' === typeof data) {
                        data = JSON.parse(data);
                    }

                    if (0 < data.length) {
                        autocomplete.setClassName(ul, 'autocomplete-list');
                        ul.style.width = basenode.offsetWidth + 'px';

                        data.forEach(function(el, k) {
                            li = document.createElement('li');
                            li.textContent = el;

                            frag.appendChild(li);
                        });

                        ul.appendChild(frag);

                        parent.appendChild(ul);
                    }
                },
                getDataSet: function(el, name) {
                    if ('undefined' === typeof el.dataset) {
                        return el.getAttribute('data-' + name);
                    }
                    else {
                        return el.dataset[name];
                    }
                },
                setDataSet: function(el, name, value) {
                    if ('undefined' === typeof el.dataset) {
                        el.setAttribute('data-' + name, value);
                    }
                    else {
                        el.dataset[name] = value;
                    }
                },
                moveHighlight: function(base, dir) {
                    var list = autocomplete.getListElement(base.parentNode),
                        list_item, active_index, target_item;

                    if ('undefined' === typeof list.length) {
                        list_item = selector('li', list);
                        list_item = list_item instanceof Array ? list_item : [list_item];
                        active_index = autocomplete.getDataSet(list, 'active_index') || -1;

                        autocomplete.setClassName(list_item, '');

                        switch (dir) {
                        case 'up':
                            active_index--;
                            break;
                        case 'down':
                            active_index++;
                            break;
                        }

                        active_index = (0 > active_index ? list_item.length - 1 : active_index);
                        active_index = (list_item.length <= active_index ? 0 : active_index);

                        autocomplete.setDataSet(list, 'active_index', active_index);
                        target_item = list_item[active_index];

                        autocomplete.setClassName(target_item, 'active');

                        base.value = target_item.textContent;
                    }
                },
                setClassName: function(elems, class_name) {
                    elems = (elems instanceof Array ? elems : [elems]);
                    elems.forEach(function(el, k) {
                        el.className = class_name;
                    });
                },
                keyword: selector('.keyword', form)
            };

        attachEvent('submit', form, function(e) {
            e.preventDefault();
        });

        attachEvent('keyup', autocomplete.keyword, function(e) {
            var self = e.currentTarget,
                key_code = e.keyCode;

            // up and down
            if (38 === key_code || 40 === key_code) {
                autocomplete.moveHighlight(self, 38 === key_code ? 'up' : 'down');
            }
            // return
            else if (13 === key_code) {
                autocomplete.removeResultList(self.parentNode);
            }
            else {
                if ('' !== self.value) {

                    autocomplete.fetchRemoteData(
                        form.action,
                        self.value,
                        function(data) {
                            autocomplete.removeResultList(self.parentNode);
                            autocomplete.attachResultList(self, data);
                            callback(data, self, autocomplete.getListElement(self.parentNode));
                        }
                    );
                }
                else {
                    autocomplete.removeResultList(self.parentNode);
                }
            }
        });

        return;
    };
})(document);
