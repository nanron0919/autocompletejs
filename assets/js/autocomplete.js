'use strict';

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
    fetchRemoteData = function(url, keyword, func) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url + '?q=' + keyword, true);
        xhr.responseType = 'json';
        xhr.onreadystatechange = function(res) {
            // done
            if (4 === this.readyState) {
                func(this.response);
            }
        };
        xhr.send();
    },
    removeResultList = function(basenode) {
        var existing_ul = selector('.autocomplete-list', basenode);
        existing_ul = existing_ul instanceof Array ? existing_ul : [existing_ul];

        if (0 < existing_ul.length) {
            existing_ul.forEach(function(el, k) {
                el.remove();
            });
        }
    },
    attachResultList = function(basenode, data) {
        var frag = document.createDocumentFragment(),
            ul = document.createElement('ul'),
            parent = basenode.parentNode,
            li;

        removeResultList(parent);

        if (0 < data.length) {
            setClassName(ul, 'autocomplete-list');
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
    moveHighlight = function(base, dir) {
        var list = selector('.autocomplete-list', base.parentNode),
            list_item, active_index, target_item;

        if ('undefined' === typeof list.length) {
            list_item = selector('li', list);
            list_item = list_item instanceof Array ? list_item : [list_item];
            active_index = list.dataset.active_index || -1;

            setClassName(list_item, '');

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

            list.dataset.active_index = active_index;
            target_item = list_item[active_index];

            setClassName(target_item, 'active');

            base.value = target_item.textContent;
        }
    },
    setClassName = function(elems, class_name) {
        elems = (elems instanceof Array ? elems : [elems]);
        elems.forEach(function(el, k) {
            el.className = class_name;
        });
    },
    form = selector('.autocomplete-form'),
    keyword = selector('.keyword', form);

attachEvent('submit', form, function(e) {
    e.preventDefault();
});

attachEvent('keyup', keyword, function(e) {
    var self = e.currentTarget,
        key_code = e.keyCode;

    // up and down
    if (38 === key_code || 40 === key_code) {
        moveHighlight(self, 38 === key_code ? 'up' : 'down');
    }
    // return
    else if (13 === key_code) {
        removeResultList(self.parentNode);
    }
    else {
        if ('' !== self.value) {
            fetchRemoteData(
                form.action,
                self.value,
                function(data) {
                    data = data.filter(function(el) {
                        return self.value.toLowerCase() === el.substr(0, self.value.length).toLowerCase();
                    });
                    attachResultList(self, data);
                }
            );
        }
        else {
            removeResultList(self.parentNode);
        }
    }
});
