/*
    http://www.JSON.org/json2.js
    2011-01-18

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
// jslint.js
// 2011-02-15

/*
Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

The Software shall be used for Good, not Evil.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
    JSLINT is a global function. It takes two parameters.

        var myResult = JSLINT(source, option);

    The first parameter is either a string or an array of strings. If it is a
    string, it will be split on '\n' or '\r'. If it is an array of strings, it
    is assumed that each string represents one line. The source can be a
    JavaScript text, or HTML text, or a JSON text, or a CSS text.

    The second parameter is an optional object of options which control the
    operation of JSLINT. Most of the options are booleans: They are all
    optional and have a default value of false. One of the options, predef,
    can be an array of names, which will be used to declare global variables,
    or an object whose keys are used as global names, with a boolean value
    that determines if they are assignable.

    If it checks out, JSLINT returns true. Otherwise, it returns false.

    If false, you can inspect JSLINT.errors to find out the problems.
    JSLINT.errors is an array of objects containing these members:

    {
        line      : The line (relative to 0) at which the lint was found
        character : The character (relative to 0) at which the lint was found
        reason    : The problem
        evidence  : The text line in which the problem occurred
        raw       : The raw message before the details were inserted
        a         : The first detail
        b         : The second detail
        c         : The third detail
        d         : The fourth detail
    }

    If a fatal error was found, a null will be the last element of the
    JSLINT.errors array.

    You can request a Function Report, which shows all of the functions
    and the parameters and vars that they use. This can be used to find
    implied global variables and other problems. The report is in HTML and
    can be inserted in an HTML <body>.

        var myReport = JSLINT.report(limited);

    If limited is true, then the report will be limited to only errors.

    You can request a data structure which contains JSLint's results.

        var myData = JSLINT.data();

    It returns a structure with this form:

    {
        errors: [
            {
                line: NUMBER,
                character: NUMBER,
                reason: STRING,
                evidence: STRING
            }
        ],
        functions: [
            name: STRING,
            line: NUMBER,
            last: NUMBER,
            param: [
                TOKEN
            ],
            closure: [
                STRING
            ],
            var: [
                STRING
            ],
            exception: [
                STRING
            ],
            outer: [
                STRING
            ],
            unused: [
                STRING
            ],
            global: [
                STRING
            ],
            label: [
                STRING
            ]
        ],
        globals: [
            STRING
        ],
        member: {
            STRING: NUMBER
        },
        unuseds: [
            {
                name: STRING,
                line: NUMBER
            }
        ],
        implieds: [
            {
                name: STRING,
                line: NUMBER
            }
        ],
        urls: [
            STRING
        ],
        json: BOOLEAN
    }

    Empty arrays will not be included.

    You can obtain the parse tree that JSLint constructed while parsing. The
    latest tree is kept in JSLINT.tree. A nice stringication can be produced
    with

        JSON.stringify(JSLINT.tree, [
            'value',  'arity', 'name',  'first',
            'second', 'third', 'block', 'else'
        ], 4));

*/

/*jslint
    evil: true, nomen: false, onevar: false, regexp: false, strict: true
*/

/*members "\b", "\t", "\n", "\f", "\r", "!=", "!==", "\"", "%", "'",
    "(begin)", "(breakage)", "(context)", "(end)", "(error)", "(global)",
    "(identifier)", "(line)", "(loopage)", "(name)", "(onevar)",
    "(params)", "(scope)", "(statement)", "(token)", "(verb)", ")", "*",
    "+", "-", "/", ";", "<", "</", "<=", "==", "===", ">", ">=", ADSAFE,
    ActiveXObject, Array, Boolean, COM, CScript, Canvas, CustomAnimation,
    Date, Debug, E, Enumerator, Error, EvalError, FadeAnimation, Flash,
    FormField, Frame, Function, HotKey, Image, JSON, LN10, LN2, LOG10E,
    LOG2E, MAX_VALUE, MIN_VALUE, Math, MenuItem, MoveAnimation,
    NEGATIVE_INFINITY, Number, Object, Option, PI, POSITIVE_INFINITY, Point,
    RangeError, Rectangle, ReferenceError, RegExp, ResizeAnimation,
    RotateAnimation, SQRT1_2, SQRT2, ScrollBar, String, Style, SyntaxError,
    System, Text, TextArea, Timer, TypeError, URIError, URL, VBArray,
    WScript, Web, Window, XMLDOM, XMLHttpRequest, "\\", a, a_function,
    a_label, a_not_allowed, a_not_defined, a_scope, abbr, acronym,
    activeborder, activecaption, address, adsafe, adsafe_a,
    adsafe_autocomplete, adsafe_bad_id, adsafe_div, adsafe_fragment,
    adsafe_go, adsafe_html, adsafe_id, adsafe_id_go, adsafe_lib,
    adsafe_lib_second, adsafe_missing_id, adsafe_name_a, adsafe_placement,
    adsafe_prefix_a, adsafe_script, adsafe_source, adsafe_subscript_a,
    adsafe_tag, alert, aliceblue, all, already_defined, and, animator,
    antiquewhite, appleScript, applet, apply, approved, appworkspace, aqua,
    aquamarine, area, arguments, arity, article, aside, assign,
    assign_exception, assignment_function_expression, at, attribute_case_a,
    audio, autocomplete, avoid_a, azure, b, background,
    "background-attachment", "background-color", "background-image",
    "background-position", "background-repeat", bad_assignment, bad_color_a,
    bad_constructor, bad_entity, bad_html, bad_id_a, bad_in_a,
    bad_invocation, bad_name_a, bad_new, bad_number, bad_operand, bad_type,
    bad_url, bad_wrap, base, bdo, beep, beige, big, bisque, bitwise, black,
    blanchedalmond, block, blockquote, blue, blueviolet, body, border,
    "border-bottom", "border-bottom-color", "border-bottom-style",
    "border-bottom-width", "border-collapse", "border-color", "border-left",
    "border-left-color", "border-left-style", "border-left-width",
    "border-right", "border-right-color", "border-right-style",
    "border-right-width", "border-spacing", "border-style", "border-top",
    "border-top-color", "border-top-style", "border-top-width",
    "border-width", bottom, br, braille, brown, browser, burlywood, button,
    buttonface, buttonhighlight, buttonshadow, buttontext, bytesToUIString,
    c, cadetblue, call, callee, caller, canvas, cap, caption,
    "caption-side", captiontext, case, center, charAt, charCodeAt,
    character, chartreuse, chocolate, chooseColor, chooseFile, chooseFolder,
    cite, clear, clearInterval, clearTimeout, clip, closeWidget, closure,
    cm, code, col, colgroup, color, combine_var, command, comments, concat,
    conditional_assignment, confirm, confusing_a, confusing_regexp, console,
    constructor, constructor_name_a, content, continue, control_a,
    convertPathToHFS, convertPathToPlatform, coral, cornflowerblue,
    cornsilk, "counter-increment", "counter-reset", create, crimson, css,
    cursor, cyan, d, dangerous_comment, dangling_a, darkblue, darkcyan,
    darkgoldenrod, darkgray, darkgreen, darkkhaki, darkmagenta,
    darkolivegreen, darkorange, darkorchid, darkred, darksalmon,
    darkseagreen, darkslateblue, darkslategray, darkturquoise, darkviolet,
    data, datalist, dd, debug, decodeURI, decodeURIComponent, deeppink,
    deepskyblue, default, defineClass, del, deleted, deserialize, details,
    devel, dfn, dialog, dimgray, dir, direction, display, disrupt, div, dl,
    do, document, dodgerblue, dt, duplicate_a, edge, edition, else, em,
    embed, embossed, empty, "empty-cells", empty_block, empty_case,
    empty_class, encodeURI, encodeURIComponent, entityify, errors, es5,
    escape, eval, event, evidence, evil, ex, exception, exec, expected_a,
    expected_a_at_b_c, expected_a_b, expected_a_b_from_c_d, expected_at_a,
    expected_attribute_a, expected_attribute_value_a, expected_class_a,
    expected_fraction_a, expected_id_a, expected_identifier_a,
    expected_identifier_a_reserved, expected_lang_a, expected_linear_a,
    expected_media_a, expected_name_a, expected_nonstandard_style_attribute,
    expected_number_a, expected_operator_a, expected_percent_a,
    expected_positive_a, expected_pseudo_a, expected_selector_a,
    expected_small_a, expected_space_a_b, expected_string_a,
    expected_style_attribute, expected_style_pattern, expected_tagname_a,
    fieldset, figure, filesystem, firebrick, first, float, floor,
    floralwhite, focusWidget, font, "font-family", "font-size",
    "font-size-adjust", "font-stretch", "font-style", "font-variant",
    "font-weight", footer, for, for_if, forestgreen, forin, form, fragment,
    frame, frames, frameset, from, fromCharCode, fuchsia, fud, funct,
    function, function_block, function_eval, function_loop,
    function_statement, function_strict, functions, g, gainsboro, gc,
    get_set, ghostwhite, global, globals, gold, goldenrod, gray, graytext,
    green, greenyellow, h1, h2, h3, h4, h5, h6, handheld, hasOwnProperty,
    head, header, height, help, hgroup, highlight, highlighttext, history,
    honeydew, hotpink, hr, "hta:application", html, html_confusion_a,
    html_handlers, i, iTunes, id, identifier, identifier_function, iframe,
    img, immed, implied_evil, implieds, in, inactiveborder, inactivecaption,
    inactivecaptiontext, include, indent, indexOf, indianred, indigo,
    infobackground, infotext, init, input, ins, insecure_a, isAlpha,
    isApplicationRunning, isArray, isDigit, isFinite, isNaN, ivory, join,
    jslint, json, kbd, keygen, keys, khaki, konfabulatorVersion, label,
    label_a_b, lang, lavender, lavenderblush, lawngreen, lbp,
    leading_decimal_a, led, left, legend, lemonchiffon, length,
    "letter-spacing", li, lib, lightblue, lightcoral, lightcyan,
    lightgoldenrodyellow, lightgreen, lightpink, lightsalmon, lightseagreen,
    lightskyblue, lightslategray, lightsteelblue, lightyellow, lime,
    limegreen, line, "line-height", linen, link, "list-style",
    "list-style-image", "list-style-position", "list-style-type", load,
    loadClass, location, log, m, magenta, map, margin, "margin-bottom",
    "margin-left", "margin-right", "margin-top", mark, "marker-offset",
    maroon, match, "max-height", "max-width", maxerr, maxlen, md5,
    mediumaquamarine, mediumblue, mediumorchid, mediumpurple,
    mediumseagreen, mediumslateblue, mediumspringgreen, mediumturquoise,
    mediumvioletred, member, menu, menutext, message, meta, meter,
    midnightblue, "min-height", "min-width", mintcream, missing_a,
    missing_a_after_b, missing_option, missing_property, missing_space_a_b,
    missing_url, missing_use_strict, mistyrose, mixed, mm, moccasin, mode,
    move_invocation, move_var, name, name_function, nav, navajowhite,
    navigator, navy, nested_comment, newcap, next, noframes, nomen,
    noscript, not, not_a_constructor, not_a_function, not_a_label,
    not_a_scope, not_greater, nud, object, ol, oldlace, olive, olivedrab,
    on, onevar, opacity, open, openURL, opera, optgroup, option, orange,
    orangered, orchid, outer, outline, "outline-color", "outline-style",
    "outline-width", output, overflow, "overflow-x", "overflow-y", p,
    padding, "padding-bottom", "padding-left", "padding-right",
    "padding-top", "page-break-after", "page-break-before", palegoldenrod,
    palegreen, paleturquoise, palevioletred, papayawhip, param,
    parameter_a_get_b, parameter_set_a, paren, parent, parseFloat, parseInt,
    passfail, pc, peachpuff, peru, pink, play, plum, plusplus, pop,
    popupMenu, position, postcomments, powderblue, pre, predef,
    preferenceGroups, preferences, prev, print, progress, projection,
    prompt, prototype, pt, purple, push, px, q, quit, quote, quotes, radix,
    random, range, raw, readFile, readUrl, read_only, reason, red,
    redefinition_a, regexp, reloadWidget, replace, report, reserved,
    reserved_a, resolvePath, resumeUpdates, rhino, right, rosybrown,
    royalblue, rp, rt, ruby, runCommand, runCommandInBg, saddlebrown, safe,
    salmon, samp, sandybrown, saveAs, savePreferences, scanned_a_b, screen,
    script, scrollbar, seagreen, seal, search, seashell, second, section,
    select, serialize, setInterval, setTimeout, shift,
    showWidgetPreferences, sienna, silver, skyblue, slash_equal, slateblue,
    slategray, sleep, slice, small, snow, sort, source, span, spawn, speak,
    speech, split, springgreen, src, stack, statement, statement_block,
    steelblue, stopping, strange_loop, strict, strong, style, styleproperty,
    sub, subscript, substr, sup, supplant, suppressUpdates, switch, sync,
    system, table, "table-layout", tag_a_in_b, tan, tbody, td, teal,
    tellWidget, test, "text-align", "text-decoration", "text-indent",
    "text-shadow", "text-transform", textarea, tfoot, th, thead, third,
    thistle, threeddarkshadow, threedface, threedhighlight,
    threedlightshadow, threedshadow, thru, time, title, toLowerCase,
    toString, toUpperCase, toint32, token, tomato, too_long, too_many, top,
    tr, trailing_decimal_a, tree, tt, tty, turquoise, tv, type, u, ul,
    unclosed, unclosed_comment, unclosed_regexp, undef, unescape,
    unescaped_a, unexpected_a, unexpected_char_a_b, unexpected_comment,
    unexpected_member_a, unexpected_space_a_b, "unicode-bidi",
    unnecessary_initialize, unnecessary_use, unreachable_a_b,
    unrecognized_style_attribute_a, unrecognized_tag_a, unsafe, unused,
    unwatch, updateNow, url, urls, use_array, use_braces, use_object,
    used_before_a, value, valueOf, var, var_a_not, version,
    "vertical-align", video, violet, visibility, was, watch,
    weird_assignment, weird_condition, weird_new, weird_program,
    weird_relation, weird_ternary, wheat, while, white, "white-space",
    whitesmoke, widget, width, window, windowframe, windows, windowtext,
    "word-spacing", "word-wrap", wrap, wrap_immediate, wrap_regexp,
    write_is_wrong, yahooCheckLogin, yahooLogin, yahooLogout, yellow,
    yellowgreen, "z-index", "}"
*/

// We build the application inside a function so that we produce only a single
// global variable. That function will be invoked immediately, and its return
// value is the JSLINT function itself. That function is also an object that
// can contain data and other functions.

var JSLINT = (function () {
    "use strict";

    var adsafe_id,      // The widget's ADsafe id.
        adsafe_may,     // The widget may load approved scripts.
        adsafe_went,    // ADSAFE.go has been called.
        anonname,       // The guessed name for anonymous functions.
        approved,       // ADsafe approved urls.

// These are operators that should not be used with the ! operator.

        bang = {
            '<': true,
            '<=': true,
            '==': true,
            '===': true,
            '!==': true,
            '!=': true,
            '>': true,
            '>=': true,
            '+': true,
            '-': true,
            '*': true,
            '/': true,
            '%': true
        },

// These are property names that should not be permitted in the safe subset.

        banned = {              // the member names that ADsafe prohibits.
            'arguments'     : true,
            callee          : true,
            caller          : true,
            constructor     : true,
            'eval'          : true,
            prototype       : true,
            stack           : true,
            unwatch         : true,
            valueOf         : true,
            watch           : true
        },


// These are the JSLint boolean options.

        bool_options = {
            adsafe     : true, // if ADsafe should be enforced
            bitwise    : true, // if bitwise operators should not be allowed
            browser    : true, // if the standard browser globals should be predefined
            cap        : true, // if upper case HTML should be allowed
            'continue' : true, // if the continuation statement should be tolerated
            css        : true, // if CSS workarounds should be tolerated
            debug      : true, // if debugger statements should be allowed
            devel      : true, // if logging should be allowed (console, alert, etc.)
            es5        : true, // if ES5 syntax should be allowed
            evil       : true, // if eval should be allowed
            forin      : true, // if for in statements must filter
            fragment   : true, // if HTML fragments should be allowed
            newcap     : true, // if constructor names must be capitalized
            nomen      : true, // if names should be checked
            on         : true, // if HTML event handlers should be allowed
            onevar     : true, // if only one var statement per function should be allowed
            passfail   : true, // if the scan should stop on first error
            plusplus   : true, // if increment/decrement should not be allowed
            regexp     : true, // if the . should not be allowed in regexp literals
            rhino      : true, // if the Rhino environment globals should be predefined
            undef      : true, // if variables should be declared before used
            safe       : true, // if use of some browser features should be restricted
            windows    : true, // if MS Windows-specigic globals should be predefined
            strict     : true, // require the "use strict"; pragma
            sub        : true, // if all forms of subscript notation are tolerated
            white      : true, // if strict whitespace rules apply
            widget     : true  // if the Yahoo Widgets globals should be predefined
        },

// browser contains a set of global names which are commonly provided by a
// web browser environment.

        browser = {
            clearInterval   : false,
            clearTimeout    : false,
            document        : false,
            event           : false,
            frames          : false,
            history         : false,
            Image           : false,
            location        : false,
            name            : false,
            navigator       : false,
            Option          : false,
            parent          : false,
            screen          : false,
            setInterval     : false,
            setTimeout      : false,
            XMLHttpRequest  : false
        },
        bundle = {
            a_function: "'{a}' is a function.",
            a_label: "'{a}' is a statement label.",
            a_not_allowed: "'{a}' is not allowed.",
            a_not_defined: "'{a}' is not defined.",
            a_scope: "'{a}' used out of scope.",
            adsafe: "ADsafe violation.",
            adsafe_a: "ADsafe violation: '{a}'.",
            adsafe_autocomplete: "ADsafe autocomplete violation.",
            adsafe_bad_id: "ADSAFE violation: bad id.",
            adsafe_div: "ADsafe violation: Wrap the widget in a div.",
            adsafe_fragment: "ADSAFE: Use the fragment option.",
            adsafe_go: "ADsafe violation: Missing ADSAFE.go.",
            adsafe_html: "Currently, ADsafe does not operate on whole HTML documents. It operates on <div> fragments and .js files.",
            adsafe_id: "ADsafe violation: id does not match.",
            adsafe_id_go: "ADsafe violation: Missing ADSAFE.id or ADSAFE.go.",
            adsafe_lib: "ADsafe lib violation.",
            adsafe_lib_second: "ADsafe: The second argument to lib must be a function.",
            adsafe_missing_id: "ADSAFE violation: missing ID_.",
            adsafe_name_a: "ADsafe name violation: '{a}'.",
            adsafe_placement: "ADsafe script placement violation.",
            adsafe_prefix_a: "ADsafe violation: An id must have a '{a}' prefix",
            adsafe_script: "ADsafe script violation.",
            adsafe_source: "ADsafe unapproved script source.",
            adsafe_subscript_a: "ADsafe subscript '{a}'.",
            adsafe_tag: "ADsafe violation: Disallowed tag '{a}'.",
            already_defined: "'{a}' is already defined.",
            and: "The '&&' subexpression should be wrapped in parens.",
            assign_exception: "Do not assign to the exception parameter.",
            assignment_function_expression: "Expected an assignment or function call and instead saw an expression.",
            attribute_case_a: "Attribute '{a}' not all lower case.",
            avoid_a: "Avoid '{a}'.",
            bad_assignment: "Bad assignment.",
            bad_color_a: "Bad hex color '{a}'.",
            bad_constructor: "Bad constructor.",
            bad_entity: "Bad entity.",
            bad_html: "Bad HTML string",
            bad_id_a: "Bad id: '{a}'.",
            bad_in_a: "Bad for in variable '{a}'.",
            bad_invocation: "Bad invocation.",
            bad_name_a: "Bad name: '{a}'.",
            bad_new: "Do not use 'new' for side effects.",
            bad_number: "Bad number '{a}'.",
            bad_operand: "Bad operand.",
            bad_type: "Bad type.",
            bad_url: "Bad url string.",
            bad_wrap: "Do not wrap function literals in parens unless they are to be immediately invoked.",
            combine_var: "Combine this with the previous 'var' statement.",
            conditional_assignment: "Expected a conditional expression and instead saw an assignment.",
            confusing_a: "Confusing use of '{a}'.",
            confusing_regexp: "Confusing regular expression.",
            constructor_name_a: "A constructor name '{a}' should start with an uppercase letter.",
            control_a: "Unexpected control character '{a}'.",
            css: "A css file should begin with @charset 'UTF-8';",
            dangling_a: "Unexpected dangling '_' in '{a}'.",
            dangerous_comment: "Dangerous comment.",
            deleted: "Only properties should be deleted.",
            duplicate_a: "Duplicate '{a}'.",
            empty_block: "Empty block.",
            empty_case: "Empty case.",
            empty_class: "Empty class.",
            evil: "eval is evil.",
            expected_a: "Expected '{a}'.",
            expected_a_b: "Expected '{a}' and instead saw '{b}'.",
            expected_a_b_from_c_d: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
            expected_at_a: "Expected an at-rule, and instead saw @{a}.",
            expected_a_at_b_c: "Expected '{a}' at column {b}, not column {c}.",
            expected_attribute_a: "Expected an attribute, and instead saw [{a}].",
            expected_attribute_value_a: "Expected an attribute value and instead saw '{a}'.",
            expected_class_a: "Expected a class, and instead saw .{a}.",
            expected_fraction_a: "Expected a number between 0 and 1 and instead saw '{a}'",
            expected_id_a: "Expected an id, and instead saw #{a}.",
            expected_identifier_a: "Expected an identifier and instead saw '{a}'.",
            expected_identifier_a_reserved: "Expected an identifier and instead saw '{a}' (a reserved word).",
            expected_linear_a: "Expected a linear unit and instead saw '{a}'.",
            expected_lang_a: "Expected a lang code, and instead saw :{a}.",
            expected_media_a: "Expected a CSS media type, and instead saw '{a}'.",
            expected_name_a: "Expected a name and instead saw '{a}'.",
            expected_nonstandard_style_attribute: "Expected a non-standard style attribute and instead saw '{a}'.",
            expected_number_a: "Expected a number and instead saw '{a}'.",
            expected_operator_a: "Expected an operator and instead saw '{a}'.",
            expected_percent_a: "Expected a percentage and instead saw '{a}'",
            expected_positive_a: "Expected a positive number and instead saw '{a}'",
            expected_pseudo_a: "Expected a pseudo, and instead saw :{a}.",
            expected_selector_a: "Expected a CSS selector, and instead saw {a}.",
            expected_small_a: "Expected a small number and instead saw '{a}'",
            expected_space_a_b: "Expected exactly one space between '{a}' and '{b}'.",
            expected_string_a: "Expected a string and instead saw {a}.",
            expected_style_attribute: "Excepted a style attribute, and instead saw '{a}'.",
            expected_style_pattern: "Expected a style pattern, and instead saw '{a}'.",
            expected_tagname_a: "Expected a tagName, and instead saw {a}.",
            for_if: "The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.",
            function_block: "Function statements should not be placed in blocks. " +
                "Use a function expression or move the statement to the top of " +
                "the outer function.",
            function_eval: "The Function constructor is eval.",
            function_loop: "Don't make functions within a loop.",
            function_statement: "Function statements are not invocable. " +
                "Wrap the whole function invocation in parens.",
            function_strict: "Use the function form of \"use strict\".",
            get_set: "get/set are ES5 features.",
            html_confusion_a: "HTML confusion in regular expression '<{a}'.",
            html_handlers: "Avoid HTML event handlers.",
            identifier_function: "Expected an identifier in an assignment and instead saw a function invocation.",
            implied_evil: "Implied eval is evil. Pass a function instead of a string.",
            insecure_a: "Insecure '{a}'.",
            isNaN: "Use the isNaN function to compare with NaN.",
            label_a_b: "Label '{a}' on '{b}' statement.",
            lang: "lang is deprecated.",
            leading_decimal_a: "A leading decimal point can be confused with a dot: '.{a}'.",
            missing_a: "Missing '{a}'.",
            missing_a_after_b: "Missing '{a}' after '{b}'.",
            missing_option: "Missing option value.",
            missing_property: "Missing property name.",
            missing_space_a_b: "Missing space between '{a}' and '{b}'.",
            missing_url: "Missing url.",
            missing_use_strict: "Missing \"use strict\" statement.",
            mixed: "Mixed spaces and tabs.",
            move_invocation: "Move the invocation into the parens that contain the function.",
            move_var: "Move 'var' declarations to the top of the function.",
            name_function: "Missing name in function statement.",
            nested_comment: "Nested comment.",
            not: "Nested not.",
            not_a_constructor: "Do not use {a} as a constructor.",
            not_a_function: "'{a}' is not a function.",
            not_a_label: "'{a}' is not a label.",
            not_a_scope: "'{a}' is out of scope.",
            not_greater: "'{a}' should not be greater than '{b}'.",
            parameter_a_get_b: "Unexpected parameter '{a}' in get {b} function.",
            parameter_set_a: "Expected parameter (value) in set {a} function.",
            radix: "Missing radix parameter.",
            read_only: "Read only.",
            redefinition_a: "Redefinition of '{a}'.",
            reserved_a: "Reserved name '{a}'.",
            scanned_a_b: "{a} ({b}% scanned).",
            slash_equal: "A regular expression literal can be confused with '/='.",
            statement_block: "Expected to see a statement and instead saw a block.",
            stopping: "Stopping. ",
            strange_loop: "Strange loop.",
            strict: "Strict violation.",
            subscript: "['{a}'] is better written in dot notation.",
            tag_a_in_b: "A '<{a}>' must be within '<{b}>'.",
            too_long: "Line too long.",
            too_many: "Too many errors.",
            trailing_decimal_a: "A trailing decimal point can be confused with a dot: '.{a}'.",
            type: "type is unnecessary.",
            unclosed: "Unclosed string.",
            unclosed_comment: "Unclosed comment.",
            unclosed_regexp: "Unclosed regular expression.",
            unescaped_a: "Unescaped '{a}'.",
            unexpected_a: "Unexpected '{a}'.",
            unexpected_char_a_b: "Unexpected character '{a}' in {b}.",
            unexpected_comment: "Unexpected comment.",
            unexpected_member_a: "Unexpected /*member {a}.",
            unexpected_space_a_b: "Unexpected space between '{a}' and '{b}'.",
            unnecessary_initialize: "It is not necessary to initialize '{a}' to 'undefined'.",
            unnecessary_use: "Unnecessary \"use strict\".",
            unreachable_a_b: "Unreachable '{a}' after '{b}'.",
            unrecognized_style_attribute_a: "Unrecognized style attribute '{a}'.",
            unrecognized_tag_a: "Unrecognized tag '<{a}>'.",
            unsafe: "Unsafe character.",
            url: "JavaScript URL.",
            use_array: "Use the array literal notation [].",
            use_braces: "Spaces are hard to count. Use {{a}}.",
            use_object: "Use the object literal notation {}.",
            used_before_a: "'{a}' was used before it was defined.",
            var_a_not: "Variable {a} was not declared correctly.",
            weird_assignment: "Weird assignment.",
            weird_condition: "Weird condition.",
            weird_new: "Weird construction. Delete 'new'.",
            weird_program: "Weird program.",
            weird_relation: "Weird relation.",
            weird_ternary: "Weird ternary.",
            wrap_immediate: "Wrap an immediate function invocation in parentheses " +
                "to assist the reader in understanding that the expression " +
                "is the result of a function, and not the function itself.",
            wrap_regexp: "Wrap the /regexp/ literal in parens to disambiguate the slash operator.",
            write_is_wrong: "document.write can be a form of eval."
        },
        comments_off,
        css_attribute_data,
        css_any,

        css_colorData = {
            "aliceblue"             : true,
            "antiquewhite"          : true,
            "aqua"                  : true,
            "aquamarine"            : true,
            "azure"                 : true,
            "beige"                 : true,
            "bisque"                : true,
            "black"                 : true,
            "blanchedalmond"        : true,
            "blue"                  : true,
            "blueviolet"            : true,
            "brown"                 : true,
            "burlywood"             : true,
            "cadetblue"             : true,
            "chartreuse"            : true,
            "chocolate"             : true,
            "coral"                 : true,
            "cornflowerblue"        : true,
            "cornsilk"              : true,
            "crimson"               : true,
            "cyan"                  : true,
            "darkblue"              : true,
            "darkcyan"              : true,
            "darkgoldenrod"         : true,
            "darkgray"              : true,
            "darkgreen"             : true,
            "darkkhaki"             : true,
            "darkmagenta"           : true,
            "darkolivegreen"        : true,
            "darkorange"            : true,
            "darkorchid"            : true,
            "darkred"               : true,
            "darksalmon"            : true,
            "darkseagreen"          : true,
            "darkslateblue"         : true,
            "darkslategray"         : true,
            "darkturquoise"         : true,
            "darkviolet"            : true,
            "deeppink"              : true,
            "deepskyblue"           : true,
            "dimgray"               : true,
            "dodgerblue"            : true,
            "firebrick"             : true,
            "floralwhite"           : true,
            "forestgreen"           : true,
            "fuchsia"               : true,
            "gainsboro"             : true,
            "ghostwhite"            : true,
            "gold"                  : true,
            "goldenrod"             : true,
            "gray"                  : true,
            "green"                 : true,
            "greenyellow"           : true,
            "honeydew"              : true,
            "hotpink"               : true,
            "indianred"             : true,
            "indigo"                : true,
            "ivory"                 : true,
            "khaki"                 : true,
            "lavender"              : true,
            "lavenderblush"         : true,
            "lawngreen"             : true,
            "lemonchiffon"          : true,
            "lightblue"             : true,
            "lightcoral"            : true,
            "lightcyan"             : true,
            "lightgoldenrodyellow"  : true,
            "lightgreen"            : true,
            "lightpink"             : true,
            "lightsalmon"           : true,
            "lightseagreen"         : true,
            "lightskyblue"          : true,
            "lightslategray"        : true,
            "lightsteelblue"        : true,
            "lightyellow"           : true,
            "lime"                  : true,
            "limegreen"             : true,
            "linen"                 : true,
            "magenta"               : true,
            "maroon"                : true,
            "mediumaquamarine"      : true,
            "mediumblue"            : true,
            "mediumorchid"          : true,
            "mediumpurple"          : true,
            "mediumseagreen"        : true,
            "mediumslateblue"       : true,
            "mediumspringgreen"     : true,
            "mediumturquoise"       : true,
            "mediumvioletred"       : true,
            "midnightblue"          : true,
            "mintcream"             : true,
            "mistyrose"             : true,
            "moccasin"              : true,
            "navajowhite"           : true,
            "navy"                  : true,
            "oldlace"               : true,
            "olive"                 : true,
            "olivedrab"             : true,
            "orange"                : true,
            "orangered"             : true,
            "orchid"                : true,
            "palegoldenrod"         : true,
            "palegreen"             : true,
            "paleturquoise"         : true,
            "palevioletred"         : true,
            "papayawhip"            : true,
            "peachpuff"             : true,
            "peru"                  : true,
            "pink"                  : true,
            "plum"                  : true,
            "powderblue"            : true,
            "purple"                : true,
            "red"                   : true,
            "rosybrown"             : true,
            "royalblue"             : true,
            "saddlebrown"           : true,
            "salmon"                : true,
            "sandybrown"            : true,
            "seagreen"              : true,
            "seashell"              : true,
            "sienna"                : true,
            "silver"                : true,
            "skyblue"               : true,
            "slateblue"             : true,
            "slategray"             : true,
            "snow"                  : true,
            "springgreen"           : true,
            "steelblue"             : true,
            "tan"                   : true,
            "teal"                  : true,
            "thistle"               : true,
            "tomato"                : true,
            "turquoise"             : true,
            "violet"                : true,
            "wheat"                 : true,
            "white"                 : true,
            "whitesmoke"            : true,
            "yellow"                : true,
            "yellowgreen"           : true,

            "activeborder"          : true,
            "activecaption"         : true,
            "appworkspace"          : true,
            "background"            : true,
            "buttonface"            : true,
            "buttonhighlight"       : true,
            "buttonshadow"          : true,
            "buttontext"            : true,
            "captiontext"           : true,
            "graytext"              : true,
            "highlight"             : true,
            "highlighttext"         : true,
            "inactiveborder"        : true,
            "inactivecaption"       : true,
            "inactivecaptiontext"   : true,
            "infobackground"        : true,
            "infotext"              : true,
            "menu"                  : true,
            "menutext"              : true,
            "scrollbar"             : true,
            "threeddarkshadow"      : true,
            "threedface"            : true,
            "threedhighlight"       : true,
            "threedlightshadow"     : true,
            "threedshadow"          : true,
            "window"                : true,
            "windowframe"           : true,
            "windowtext"            : true
        },

        css_border_style,
        css_break,

        css_lengthData = {
            '%': true,
            'cm': true,
            'em': true,
            'ex': true,
            'in': true,
            'mm': true,
            'pc': true,
            'pt': true,
            'px': true
        },

        css_media,
        css_overflow,

        devel = {
            alert           : false,
            confirm         : false,
            console         : false,
            Debug           : false,
            opera           : false,
            prompt          : false
        },

        escapes = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '/' : '\\/',
            '\\': '\\\\'
        },

        funct,          // The current function

        functionicity = [
            'closure', 'exception', 'global', 'label',
            'outer', 'unused', 'var'
        ],

        functions,      // All of the functions
        global,         // The global scope
        html_tag = {
            a:        {},
            abbr:     {},
            acronym:  {},
            address:  {},
            applet:   {},
            area:     {empty: true, parent: ' map '},
            article:  {},
            aside:    {},
            audio:    {},
            b:        {},
            base:     {empty: true, parent: ' head '},
            bdo:      {},
            big:      {},
            blockquote: {},
            body:     {parent: ' html noframes '},
            br:       {empty: true},
            button:   {},
            canvas:   {parent: ' body p div th td '},
            caption:  {parent: ' table '},
            center:   {},
            cite:     {},
            code:     {},
            col:      {empty: true, parent: ' table colgroup '},
            colgroup: {parent: ' table '},
            command:  {parent: ' menu '},
            datalist: {},
            dd:       {parent: ' dl '},
            del:      {},
            details:  {},
            dialog:   {},
            dfn:      {},
            dir:      {},
            div:      {},
            dl:       {},
            dt:       {parent: ' dl '},
            em:       {},
            embed:    {},
            fieldset: {},
            figure:   {},
            font:     {},
            footer:   {},
            form:     {},
            frame:    {empty: true, parent: ' frameset '},
            frameset: {parent: ' html frameset '},
            h1:       {},
            h2:       {},
            h3:       {},
            h4:       {},
            h5:       {},
            h6:       {},
            head:     {parent: ' html '},
            header:   {},
            hgroup:   {},
            hr:       {empty: true},
            'hta:application':
                      {empty: true, parent: ' head '},
            html:     {parent: '*'},
            i:        {},
            iframe:   {},
            img:      {empty: true},
            input:    {empty: true},
            ins:      {},
            kbd:      {},
            keygen:   {},
            label:    {},
            legend:   {parent: ' details fieldset figure '},
            li:       {parent: ' dir menu ol ul '},
            link:     {empty: true, parent: ' head '},
            map:      {},
            mark:     {},
            menu:     {},
            meta:     {empty: true, parent: ' head noframes noscript '},
            meter:    {},
            nav:      {},
            noframes: {parent: ' html body '},
            noscript: {parent: ' body head noframes '},
            object:   {},
            ol:       {},
            optgroup: {parent: ' select '},
            option:   {parent: ' optgroup select '},
            output:   {},
            p:        {},
            param:    {empty: true, parent: ' applet object '},
            pre:      {},
            progress: {},
            q:        {},
            rp:       {},
            rt:       {},
            ruby:     {},
            samp:     {},
            script:   {empty: true, parent: ' body div frame head iframe p pre span '},
            section:  {},
            select:   {},
            small:    {},
            span:     {},
            source:   {},
            strong:   {},
            style:    {parent: ' head ', empty: true},
            sub:      {},
            sup:      {},
            table:    {},
            tbody:    {parent: ' table '},
            td:       {parent: ' tr '},
            textarea: {},
            tfoot:    {parent: ' table '},
            th:       {parent: ' tr '},
            thead:    {parent: ' table '},
            time:     {},
            title:    {parent: ' head '},
            tr:       {parent: ' table tbody thead tfoot '},
            tt:       {},
            u:        {},
            ul:       {},
            'var':    {},
            video:    {}
        },

        ids,            // HTML ids
        implied,        // Implied globals
        in_block,
        indent,
        json_mode,
        labelled = {
            'do':     true,
            'for':    true,
            'switch': true,
            'while':  true
        },
        lines,
        lookahead,
        member,
        members_only,
        nexttoken,
        option,
        postscript = {
            '(end)':    true,
            '(error)':  true,
            '</':       true,
            '}':        true,
            '"':        true,
            '\'':       true,
            'case':     true,
            'default':  true
        },
        predefined,     // Global variables defined by option
        prereg,
        prevtoken,
        regexp_flag = {
            g: true,
            i: true,
            m: true
        },
        rhino = {
            defineClass : false,
            deserialize : false,
            gc          : false,
            help        : false,
            load        : false,
            loadClass   : false,
            print       : false,
            quit        : false,
            readFile    : false,
            readUrl     : false,
            runCommand  : false,
            seal        : false,
            serialize   : false,
            spawn       : false,
            sync        : false,
            toint32     : false,
            version     : false
        },

        scope,      // The current scope
        semicolon_coda = {
            ';' : true,
            '"' : true,
            '\'': true,
            ')' : true
        },
        src,
        stack,

// standard contains the global names that are provided by the
// ECMAScript standard.

        standard = {
            Array               : false,
            Boolean             : false,
            Date                : false,
            decodeURI           : false,
            decodeURIComponent  : false,
            encodeURI           : false,
            encodeURIComponent  : false,
            Error               : false,
            'eval'              : false,
            EvalError           : false,
            Function            : false,
            hasOwnProperty      : false,
            isFinite            : false,
            isNaN               : false,
            JSON                : false,
            Math                : false,
            Number              : false,
            Object              : false,
            parseInt            : false,
            parseFloat          : false,
            RangeError          : false,
            ReferenceError      : false,
            RegExp              : false,
            String              : false,
            SyntaxError         : false,
            TypeError           : false,
            URIError            : false
        },

        standard_member = {
            E                   : true,
            LN2                 : true,
            LN10                : true,
            LOG2E               : true,
            LOG10E              : true,
            MAX_VALUE           : true,
            MIN_VALUE           : true,
            NEGATIVE_INFINITY   : true,
            PI                  : true,
            POSITIVE_INFINITY   : true,
            SQRT1_2             : true,
            SQRT2               : true
        },

        strict_mode,
        syntax = {},
        tab,
        token,
        urls,
        var_mode,
        warnings,

// widget contains the global names which are provided to a Yahoo
// (fna Konfabulator) widget.

        widget = {
            alert                   : true,
            animator                : true,
            appleScript             : true,
            beep                    : true,
            bytesToUIString         : true,
            Canvas                  : true,
            chooseColor             : true,
            chooseFile              : true,
            chooseFolder            : true,
            closeWidget             : true,
            COM                     : true,
            convertPathToHFS        : true,
            convertPathToPlatform   : true,
            CustomAnimation         : true,
            escape                  : true,
            FadeAnimation           : true,
            filesystem              : true,
            Flash                   : true,
            focusWidget             : true,
            form                    : true,
            FormField               : true,
            Frame                   : true,
            HotKey                  : true,
            Image                   : true,
            include                 : true,
            isApplicationRunning    : true,
            iTunes                  : true,
            konfabulatorVersion     : true,
            log                     : true,
            md5                     : true,
            MenuItem                : true,
            MoveAnimation           : true,
            openURL                 : true,
            play                    : true,
            Point                   : true,
            popupMenu               : true,
            preferenceGroups        : true,
            preferences             : true,
            print                   : true,
            prompt                  : true,
            random                  : true,
            Rectangle               : true,
            reloadWidget            : true,
            ResizeAnimation         : true,
            resolvePath             : true,
            resumeUpdates           : true,
            RotateAnimation         : true,
            runCommand              : true,
            runCommandInBg          : true,
            saveAs                  : true,
            savePreferences         : true,
            screen                  : true,
            ScrollBar               : true,
            showWidgetPreferences   : true,
            sleep                   : true,
            speak                   : true,
            Style                   : true,
            suppressUpdates         : true,
            system                  : true,
            tellWidget              : true,
            Text                    : true,
            TextArea                : true,
            Timer                   : true,
            unescape                : true,
            updateNow               : true,
            URL                     : true,
            Web                     : true,
            widget                  : true,
            Window                  : true,
            XMLDOM                  : true,
            XMLHttpRequest          : true,
            yahooCheckLogin         : true,
            yahooLogin              : true,
            yahooLogout             : true
        },

        windows = {
            ActiveXObject: false,
            CScript      : false,
            Debug        : false,
            Enumerator   : false,
            System       : false,
            VBArray      : false,
            WScript      : false
        },

//  xmode is used to adapt to the exceptions in html parsing.
//  It can have these states:
//      false   .js script file
//      html
//      outer
//      script
//      style
//      scriptstring
//      styleproperty

        xmode,
        xquote,

// Regular expressions. Some of these are stupidly long.

// unsafe comment or string
        ax = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i,
// unsafe characters that are silently deleted by one or more browsers
        cx = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,
// token
        tx = /^\s*([(){}\[.,:;'"~\?\]#@]|==?=?|\/(\*(jslint|members?|global)?|=|\/)?|\*[\/=]?|\+(?:=|\++)?|-(?:=|-+)?|%=?|&[&=]?|\|[|=]?|>>?>?=?|<([\/=!]|\!(\[|--)?|<=?)?|\^=?|\!=?=?|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+([xX][0-9a-fA-F]+|\.[0-9]*)?([eE][+\-]?[0-9]+)?)/,
// html token
        hx = /^\s*(['"=>\/&#]|<(?:\/|\!(?:--)?)?|[a-zA-Z][a-zA-Z0-9_\-:]*|[0-9]+|--)/,
// characters in strings that need escapement
        nx = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,
        nxg = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
// outer html token
        ox = /[>&]|<[\/!]?|--/,
// star slash
        lx = /\*\/|\/\*/,
// identifier
        ix = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/,
// javascript url
        jx = /^(?:javascript|jscript|ecmascript|vbscript|mocha|livescript)\s*:/i,
// url badness
        ux = /&|\+|\u00AD|\.\.|\/\*|%[^;]|base64|url|expression|data|mailto/i,
// style
        sx = /^\s*([{:#%.=,>+\[\]@()"';]|\*=?|\$=|\|=|\^=|~=|[a-zA-Z_][a-zA-Z0-9_\-]*|[0-9]+|<\/|\/\*)/,
        ssx = /^\s*([@#!"'};:\-%.=,+\[\]()*_]|[a-zA-Z][a-zA-Z0-9._\-]*|\/\*?|\d+(?:\.\d+)?|<\/)/,
// attributes characters
        qx = /[^a-zA-Z0-9+\-_\/ ]/,
// query characters for ids
        dx = /[\[\]\/\\"'*<>.&:(){}+=#]/,

        rx = {
            outer: hx,
            html: hx,
            style: sx,
            styleproperty: ssx
        };


    function return_this() {
        return this;
    }

    function F() {}     // Used by Object.create

    function is_own(object, name) {

// The object.hasOwnProperty method fails when the property under consideration
// is named 'hasOwnProperty'. So we have to use this more convoluted form.

        return Object.prototype.hasOwnProperty.call(object, name);
    }

// Provide critical ES5 functions to ES3.

    if (typeof Array.isArray !== 'function') {
        Array.isArray = function (o) {
            return Object.prototype.toString.apply(o) === '[object Array]';
        };
    }

    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            F.prototype = o;
            return new F();
        };
    }

    if (typeof Object.keys !== 'function') {
        Object.keys = function (o) {
            var a = [], k;
            for (k in o) {
                if (is_own(o, k)) {
                    a.push(k);
                }
            }
            return a;
        };
    }

// Substandard methods

    if (typeof String.prototype.entityify !== 'function') {
        String.prototype.entityify = function () {
            return this
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };
    }

    if (typeof String.prototype.isAlpha !== 'function') {
        String.prototype.isAlpha = function () {
            return (this >= 'a' && this <= 'z\uffff') ||
                (this >= 'A' && this <= 'Z\uffff');
        };
    }

    if (typeof String.prototype.isDigit !== 'function') {
        String.prototype.isDigit = function () {
            return (this >= '0' && this <= '9');
        };
    }

    if (typeof String.prototype.supplant !== 'function') {
        String.prototype.supplant = function (o) {
            return this.replace(/\{([^{}]*)\}/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
        };
    }

    if (typeof String.prototype.name !== 'function') {
        String.prototype.name = function () {

// If the string looks like an identifier, then we can return it as is.
// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can simply slap some quotes around it.
// Otherwise we must also replace the offending characters with safe
// sequences.

            if (ix.test(this)) {
                return this;
            }
            if (nx.test(this)) {
                return '"' + this.replace(nxg, function (a) {
                    var c = escapes[a];
                    if (c) {
                        return c;
                    }
                    return '\\u' + ('0000' + a.charCodeAt().toString(16)).slice(-4);
                }) + '"';
            }
            return '"' + this + '"';
        };
    }


    function combine(t, o) {
        var n;
        for (n in o) {
            if (is_own(o, n)) {
                t[n] = o[n];
            }
        }
    }

    function assume() {
        if (!option.safe) {
            if (option.rhino) {
                combine(predefined, rhino);
            }
            if (option.devel) {
                combine(predefined, devel);
            }
            if (option.browser) {
                combine(predefined, browser);
            }
            if (option.windows) {
                combine(predefined, windows);
            }
            if (option.widget) {
                combine(predefined, widget);
            }
        }
    }


// Produce an error warning.

    function quit(message, line, character) {
        throw {
            name: 'JSLintError',
            line: line,
            character: character,
            message: bundle.scanned_a_b.supplant({
                a: message,
                b: Math.floor((line / lines.length) * 100)
            })
        };
    }

    function warn(message, offender, a, b, c, d) {
        var character, line, warning;
        offender = offender || nexttoken;  // `~
        line = offender.line || 0;
        character = offender.from || 0;
        warning = {
            id: '(error)',
            raw: message,
            evidence: lines[line - 1] || '',
            line: line,
            character: character,
            a: a || offender.value,
            b: b,
            c: c,
            d: d
        };
        warning.reason = message.supplant(warning);
        JSLINT.errors.push(warning);
        if (option.passfail) {
            quit(bundle.stopping, line, character);
        }
        warnings += 1;
        if (warnings >= option.maxerr) {
            quit(bundle.too_many, line, character);
        }
        return warning;
    }

    function warn_at(message, line, character, a, b, c, d) {
        return warn(message, {
            line: line,
            from: character
        }, a, b, c, d);
    }

    function fail(message, offender, a, b, c, d) {
        var warning = warn(message, offender, a, b, c, d);
        quit(bundle.stopping, warning.line, warning.character);
    }

    function fail_at(message, line, character, a, b, c, d) {
        return fail(message, {
            line: line,
            from: character
        }, a, b, c, d);
    }

    function expected_at(at) {
        if (option.white && nexttoken.from !== at) {
            warn(bundle.expected_a_at_b_c, nexttoken, nexttoken.value, at,
                nexttoken.from);
        }
    }



// lexical analysis and token construction

    var lex = (function lex() {
        var character, comments, from, line, source_row, older_token = {};

// Private lex methods

        function collect_comment(comment) {
            if (older_token.line !== line) {
                if (comments) {
                    comments.push(comment);
                } else {
                    comments = [comment];
                }
            } else {
                if (older_token.postcomments) {
                    older_token.postcomments.push(comment);
                } else {
                    older_token.postcomments = [comment];
                }
            }
        }

        function next_line() {
            var at;
            if (line >= lines.length) {
                return false;
            }
            character = 1;
            source_row = lines[line];
            line += 1;
            at = source_row.search(/ \t/);
            if (at >= 0) {
                warn_at(bundle.mixed, line, at + 1);
            }
            source_row = source_row.replace(/\t/g, tab);
            at = source_row.search(cx);
            if (at >= 0) {
                warn_at(bundle.unsafe, line, at);
            }
            if (option.maxlen && option.maxlen < source_row.length) {
                warn_at(bundle.too_long, line, source_row.length);
            }
            return true;
        }

// Produce a token object.  The token inherits from a syntax symbol.

        function it(type, value, quote) {
            var id, the_token;
            if (type === '(string)' || type === '(range)') {
                if (jx.test(value)) {
                    warn_at(bundle.url, line, from);
                }
            }
            the_token = Object.create(syntax[(
                type === '(punctuator)' ||
                    (type === '(identifier)' && is_own(syntax, value)) ?
                value :
                type
            )] || syntax['(error)']);
            if (type === '(identifier)') {
                the_token.identifier = true;
                if (value === '__iterator__' || value === '__proto__') {
                    fail_at(bundle.reserved_a, line, from, value);
                } else if (option.nomen &&
                        (value.charAt(0) === '_' ||
                        value.charAt(value.length - 1) === '_')) {
                    warn_at(bundle.dangling_a, line, from, value);
                }
            }
            if (value !== undefined) {
                the_token.value = value;
            }
            if (quote) {
                the_token.quote = quote;
            }
            if (comments) {
                the_token.comments = comments;
                comments = null;
            }
            the_token.line = line;
            the_token.from = from;
            the_token.thru = character;
            the_token.prev = older_token;
            id = the_token.id;
            prereg = id && (
                ('(,=:[!&|?{};'.indexOf(id.charAt(id.length - 1)) >= 0) ||
                id === 'return'
            );
            older_token.next = the_token;
            older_token = the_token;
            return the_token;
        }

// Public lex methods

        return {
            init: function (source) {
                if (typeof source === 'string') {
                    lines = source
                        .replace(/\r\n/g, '\n')
                        .replace(/\r/g, '\n')
                        .split('\n');
                } else {
                    lines = source;
                }
                line = 0;
                next_line();
                from = 1;
            },

            range: function (begin, end) {
                var c, value = '';
                from = character;
                if (source_row.charAt(0) !== begin) {
                    fail_at(bundle.expected_a_b, line, character, begin, source_row.charAt(0));
                }
                for (;;) {
                    source_row = source_row.slice(1);
                    character += 1;
                    c = source_row.charAt(0);
                    switch (c) {
                    case '':
                        fail_at(bundle.missing_a, line, character, c);
                        break;
                    case end:
                        source_row = source_row.slice(1);
                        character += 1;
                        return it('(range)', value);
                    case xquote:
                    case '\\':
                        warn_at(bundle.unexpected_a, line, character, c);
                        break;
                    }
                    value += c;
                }
            },

// token -- this is called by advance to get the next token.

            token: function () {
                var b, c, captures, digit, depth, flag, high, i, j, length, low, quote, t;

                function match(x) {
                    var exec = x.exec(source_row), first;
                    if (exec) {
                        length = exec[0].length;
                        first = exec[1];
                        c = first.charAt(0);
                        source_row = source_row.substr(length);
                        from = character + length - first.length;
                        character += length;
                        return first;
                    }
                }

                function string(x) {
                    var c, j, r = '';

                    if (json_mode && x !== '"') {
                        warn_at(bundle.expected_a, line, character, '"');
                    }

                    if (xquote === x || (xmode === 'scriptstring' && !xquote)) {
                        return it('(punctuator)', x);
                    }

                    function esc(n) {
                        var i = parseInt(source_row.substr(j + 1, n), 16);
                        j += n;
                        if (i >= 32 && i <= 126 &&
                                i !== 34 && i !== 92 && i !== 39) {
                            warn_at(bundle.unexpected_a, line, character, '\\');
                        }
                        character += n;
                        c = String.fromCharCode(i);
                    }
                    j = 0;
                    for (;;) {
                        while (j >= source_row.length) {
                            j = 0;
                            if (xmode !== 'html' || !next_line()) {
                                fail_at(bundle.unclosed, line, from);
                            }
                        }
                        c = source_row.charAt(j);
                        if (c === x) {
                            character += 1;
                            source_row = source_row.substr(j + 1);
                            return it('(string)', r, x);
                        }
                        if (c < ' ') {
                            if (c === '\n' || c === '\r') {
                                break;
                            }
                            warn_at(bundle.control_a,
                                line, character + j, source_row.slice(0, j));
                        } else if (c === xquote) {
                            warn_at(bundle.bad_html, line, character + j);
                        } else if (c === '<') {
                            if (option.safe && xmode === 'html') {
                                warn_at(bundle.adsafe_a, line, character + j, c);
                            } else if (source_row.charAt(j + 1) === '/' && (xmode || option.safe)) {
                                warn_at(bundle.expected_a_b, line, character,
                                    '<\\/', '</');
                            } else if (source_row.charAt(j + 1) === '!' && (xmode || option.safe)) {
                                warn_at(bundle.unexpected_a, line, character, '<!');
                            }
                        } else if (c === '\\') {
                            if (xmode === 'html') {
                                if (option.safe) {
                                    warn_at(bundle.adsafe_a, line, character + j, c);
                                }
                            } else if (xmode === 'styleproperty') {
                                j += 1;
                                character += 1;
                                c = source_row.charAt(j);
                                if (c !== x) {
                                    warn_at(bundle.unexpected_a, line, character, '\\');
                                }
                            } else {
                                j += 1;
                                character += 1;
                                c = source_row.charAt(j);
                                switch (c) {
                                case xquote:
                                    warn_at(bundle.bad_html, line, character + j);
                                    break;
                                case '\\':
                                case '"':
                                case '/':
                                    break;
                                case '\'':
                                    if (json_mode) {
                                        warn_at(bundle.unexpected_a, line, character, '\\\'');
                                    }
                                    break;
                                case 'b':
                                    c = '\b';
                                    break;
                                case 'f':
                                    c = '\f';
                                    break;
                                case 'n':
                                    c = '\n';
                                    break;
                                case 'r':
                                    c = '\r';
                                    break;
                                case 't':
                                    c = '\t';
                                    break;
                                case 'u':
                                    esc(4);
                                    break;
                                case 'v':
                                    if (json_mode) {
                                        warn_at(bundle.unexpected_a, line, character, '\\v');
                                    }
                                    c = '\v';
                                    break;
                                case 'x':
                                    if (json_mode) {
                                        warn_at(bundle.unexpected_a, line, character, '\\x');
                                    }
                                    esc(2);
                                    break;
                                default:
                                    warn_at(bundle.unexpected_a, line, character, '\\');
                                }
                            }
                        }
                        r += c;
                        character += 1;
                        j += 1;
                    }
                }

                for (;;) {
                    while (!source_row) {
                        if (!next_line()) {
                            return it('(end)');
                        }
                    }
                    while (xmode === 'outer') {
                        i = source_row.search(ox);
                        if (i === 0) {
                            break;
                        } else if (i > 0) {
                            character += 1;
                            source_row = source_row.slice(i);
                            break;
                        } else {
                            if (!next_line()) {
                                return it('(end)', '');
                            }
                        }
                    }
                    t = match(rx[xmode] || tx);
                    if (!t) {
                        t = '';
                        c = '';
                        while (source_row && source_row < '!') {
                            source_row = source_row.substr(1);
                        }
                        if (source_row) {
                            if (xmode === 'html') {
                                return it('(error)', source_row.charAt(0));
                            } else {
                                fail_at(bundle.unexpected_a,
                                    line, character, source_row.substr(0, 1));
                            }
                        }
                    } else {

    //      identifier

                        if (c.isAlpha() || c === '_' || c === '$') {
                            return it('(identifier)', t);
                        }

    //      number

                        if (c.isDigit()) {
                            if (xmode !== 'style' &&
                                    xmode !== 'styleproperty' &&
                                    source_row.substr(0, 1).isAlpha()) {
                                warn_at(bundle.expected_space_a_b,
                                    line, character, c, source_row.charAt(0));
                            }
                            if (c === '0') {
                                digit = t.substr(1, 1);
                                if (digit.isDigit()) {
                                    if (token.id !== '.' && xmode !== 'styleproperty') {
                                        warn_at(bundle.unexpected_a,
                                            line, character, t);
                                    }
                                } else if (json_mode && (digit === 'x' || digit === 'X')) {
                                    warn_at(bundle.unexpected_a, line, character, '0x');
                                }
                            }
                            if (t.substr(t.length - 1) === '.') {
                                warn_at(bundle.trailing_decimal_a, line,
                                    character, t);
                            }
                            if (xmode !== 'style') {
                                digit = +t;
                                if (!isFinite(digit)) {
                                    warn_at(bundle.bad_number, line, character, t);
                                }
                                t = digit;
                            }
                            return it('(number)', t);
                        }
                        switch (t) {

    //      string

                        case '"':
                        case "'":
                            return string(t);

    //      // comment

                        case '//':
                            if (comments_off || src || (xmode && xmode !== 'script')) {
                                warn_at(bundle.unexpected_comment, line, character);
                            } else if (xmode === 'script' && /<\source_row*\//i.test(source_row)) {
                                warn_at(bundle.unexpected_a, line, character, '<\/');
                            } else if ((option.safe || xmode === 'script') && ax.test(source_row)) {
                                warn_at(bundle.dangerous_comment, line, character);
                            }
                            collect_comment(source_row);
                            source_row = '';
                            break;

    //      /* comment

                        case '/*':
                            if (comments_off || src || (xmode && xmode !== 'script' && xmode !== 'style' && xmode !== 'styleproperty')) {
                                warn_at(bundle.unexpected_comment, line, character);
                            }
                            if (option.safe && ax.test(source_row)) {
                                warn_at(bundle.dangerous_comment, line, character);
                            }
                            for (;;) {
                                i = source_row.search(lx);
                                if (i >= 0) {
                                    break;
                                }
                                collect_comment(source_row);
                                if (!next_line()) {
                                    fail_at(bundle.unclosed_comment, line, character);
                                } else {
                                    if (option.safe && ax.test(source_row)) {
                                        warn_at(bundle.dangerous_comment, line, character);
                                    }
                                }
                            }
                            character += i + 2;
                            if (source_row.substr(i, 1) === '/') {
                                fail_at(bundle.nested_comment, line, character);
                            }
                            collect_comment(source_row.substr(0, i));
                            source_row = source_row.substr(i + 2);
                            break;

                        case '':
                            break;
    //      /
                        case '/':
                            if (token.id === '/=') {
                                fail_at(
                                    bundle.slash_equal,
                                    line,
                                    from
                                );
                            }
                            if (prereg) {
                                depth = 0;
                                captures = 0;
                                length = 0;
                                for (;;) {
                                    b = true;
                                    c = source_row.charAt(length);
                                    length += 1;
                                    switch (c) {
                                    case '':
                                        fail_at(bundle.unclosed_regexp, line, from);
                                        return;
                                    case '/':
                                        if (depth > 0) {
                                            warn_at(bundle.unescaped_a,
                                                line, from + length, '/');
                                        }
                                        c = source_row.substr(0, length - 1);
                                        flag = Object.create(regexp_flag);
                                        while (flag[source_row.charAt(length)] === true) {
                                            flag[source_row.charAt(length)] = false;
                                            length += 1;
                                        }
                                        if (source_row.charAt(length).isAlpha()) {
                                            fail_at(bundle.unexpected_a,
                                                line, from, source_row.charAt(length));
                                        }
                                        character += length;
                                        source_row = source_row.substr(length);
                                        quote = source_row.charAt(0);
                                        if (quote === '/' || quote === '*') {
                                            fail_at(bundle.confusing_regexp,
                                                line, from);
                                        }
                                        return it('(regexp)', c);
                                    case '\\':
                                        c = source_row.charAt(length);
                                        if (c < ' ') {
                                            warn_at(bundle.control_a,
                                                line, from + length, String(c));
                                        } else if (c === '<') {
                                            warn_at(
                                                bundle.unexpected_a,
                                                line,
                                                from + length,
                                                '\\'
                                            );
                                        }
                                        length += 1;
                                        break;
                                    case '(':
                                        depth += 1;
                                        b = false;
                                        if (source_row.charAt(length) === '?') {
                                            length += 1;
                                            switch (source_row.charAt(length)) {
                                            case ':':
                                            case '=':
                                            case '!':
                                                length += 1;
                                                break;
                                            default:
                                                warn_at(
                                                    bundle.expected_a_b,
                                                    line,
                                                    from + length,
                                                    ':',
                                                    source_row.charAt(length)
                                                );
                                            }
                                        } else {
                                            captures += 1;
                                        }
                                        break;
                                    case '|':
                                        b = false;
                                        break;
                                    case ')':
                                        if (depth === 0) {
                                            warn_at(bundle.unescaped_a,
                                                line, from + length, ')');
                                        } else {
                                            depth -= 1;
                                        }
                                        break;
                                    case ' ':
                                        j = 1;
                                        while (source_row.charAt(length) === ' ') {
                                            length += 1;
                                            j += 1;
                                        }
                                        if (j > 1) {
                                            warn_at(bundle.use_braces,
                                                line, from + length, j);
                                        }
                                        break;
                                    case '[':
                                        c = source_row.charAt(length);
                                        if (c === '^') {
                                            length += 1;
                                            if (option.regexp) {
                                                warn_at(bundle.insecure_a,
                                                    line, from + length, c);
                                            } else if (source_row.charAt(length) === ']') {
                                                fail_at(bundle.unescaped_a,
                                                    line, from + length, '^');
                                            }
                                        }
                                        quote = false;
                                        if (c === ']') {
                                            warn_at(bundle.empty_class, line,
                                                from + length - 1);
                                            quote = true;
                                        }
klass:                                  do {
                                            c = source_row.charAt(length);
                                            length += 1;
                                            switch (c) {
                                            case '[':
                                            case '^':
                                                warn_at(bundle.unescaped_a,
                                                    line, from + length, c);
                                                quote = true;
                                                break;
                                            case '-':
                                                if (quote) {
                                                    quote = false;
                                                } else {
                                                    warn_at(bundle.unescaped_a,
                                                        line, from + length, '-');
                                                    quote = true;
                                                }
                                                break;
                                            case ']':
                                                if (!quote) {
                                                    warn_at(bundle.unescaped_a,
                                                        line, from + length - 1, '-');
                                                }
                                                break klass;
                                            case '\\':
                                                c = source_row.charAt(length);
                                                if (c < ' ') {
                                                    warn_at(
                                                        bundle.control_a,
                                                        line,
                                                        from + length,
                                                        String(c)
                                                    );
                                                } else if (c === '<') {
                                                    warn_at(
                                                        bundle.unexpected_a,
                                                        line,
                                                        from + length,
                                                        '\\'
                                                    );
                                                }
                                                length += 1;
                                                quote = true;
                                                break;
                                            case '/':
                                                warn_at(bundle.unescaped_a,
                                                    line, from + length - 1, '/');
                                                quote = true;
                                                break;
                                            case '<':
                                                if (xmode === 'script') {
                                                    c = source_row.charAt(length);
                                                    if (c === '!' || c === '/') {
                                                        warn_at(
                                                            bundle.html_confusion_a,
                                                            line,
                                                            from + length,
                                                            c
                                                        );
                                                    }
                                                }
                                                quote = true;
                                                break;
                                            default:
                                                quote = true;
                                            }
                                        } while (c);
                                        break;
                                    case '.':
                                        if (option.regexp) {
                                            warn_at(bundle.insecure_a, line,
                                                from + length, c);
                                        }
                                        break;
                                    case ']':
                                    case '?':
                                    case '{':
                                    case '}':
                                    case '+':
                                    case '*':
                                        warn_at(bundle.unescaped_a, line,
                                            from + length, c);
                                        break;
                                    case '<':
                                        if (xmode === 'script') {
                                            c = source_row.charAt(length);
                                            if (c === '!' || c === '/') {
                                                warn_at(
                                                    bundle.html_confusion_a,
                                                    line,
                                                    from + length,
                                                    c
                                                );
                                            }
                                        }
                                        break;
                                    }
                                    if (b) {
                                        switch (source_row.charAt(length)) {
                                        case '?':
                                        case '+':
                                        case '*':
                                            length += 1;
                                            if (source_row.charAt(length) === '?') {
                                                length += 1;
                                            }
                                            break;
                                        case '{':
                                            length += 1;
                                            c = source_row.charAt(length);
                                            if (c < '0' || c > '9') {
                                                warn_at(
                                                    bundle.expected_number_a,
                                                    line,
                                                    from + length,
                                                    c
                                                );
                                            }
                                            length += 1;
                                            low = +c;
                                            for (;;) {
                                                c = source_row.charAt(length);
                                                if (c < '0' || c > '9') {
                                                    break;
                                                }
                                                length += 1;
                                                low = +c + (low * 10);
                                            }
                                            high = low;
                                            if (c === ',') {
                                                length += 1;
                                                high = Infinity;
                                                c = source_row.charAt(length);
                                                if (c >= '0' && c <= '9') {
                                                    length += 1;
                                                    high = +c;
                                                    for (;;) {
                                                        c = source_row.charAt(length);
                                                        if (c < '0' || c > '9') {
                                                            break;
                                                        }
                                                        length += 1;
                                                        high = +c + (high * 10);
                                                    }
                                                }
                                            }
                                            if (source_row.charAt(length) !== '}') {
                                                warn_at(
                                                    bundle.expected_a_b,
                                                    line,
                                                    from + length,
                                                    '}',
                                                    c
                                                );
                                            } else {
                                                length += 1;
                                            }
                                            if (source_row.charAt(length) === '?') {
                                                length += 1;
                                            }
                                            if (low > high) {
                                                warn_at(
                                                    bundle.not_greater,
                                                    line,
                                                    from + length,
                                                    low,
                                                    high
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                                c = source_row.substr(0, length - 1);
                                character += length;
                                source_row = source_row.substr(length);
                                return it('(regexp)', c);
                            }
                            return it('(punctuator)', t);

    //      punctuator

                        case '<!--':
                            length = line;
                            c = character;
                            for (;;) {
                                i = source_row.indexOf('--');
                                if (i >= 0) {
                                    break;
                                }
                                i = source_row.indexOf('<!');
                                if (i >= 0) {
                                    fail_at(bundle.nested_comment,
                                        line, character + i);
                                }
                                if (!next_line()) {
                                    fail_at(bundle.unclosed_comment, length, c);
                                }
                            }
                            length = source_row.indexOf('<!');
                            if (length >= 0 && length < i) {
                                fail_at(bundle.nested_comment,
                                    line, character + length);
                            }
                            character += i;
                            if (source_row.charAt(i + 2) !== '>') {
                                fail_at(bundle.expected_a, line, character, '-->');
                            }
                            character += 3;
                            source_row = source_row.slice(i + 3);
                            break;
                        case '#':
                            if (xmode === 'html' || xmode === 'styleproperty') {
                                for (;;) {
                                    c = source_row.charAt(0);
                                    if ((c < '0' || c > '9') &&
                                            (c < 'a' || c > 'f') &&
                                            (c < 'A' || c > 'F')) {
                                        break;
                                    }
                                    character += 1;
                                    source_row = source_row.substr(1);
                                    t += c;
                                }
                                if (t.length !== 4 && t.length !== 7) {
                                    warn_at(bundle.bad_color_a, line,
                                        from + length, t);
                                }
                                return it('(color)', t);
                            }
                            return it('(punctuator)', t);

                        default:
                            if (xmode === 'outer' && c === '&') {
                                character += 1;
                                source_row = source_row.substr(1);
                                for (;;) {
                                    c = source_row.charAt(0);
                                    character += 1;
                                    source_row = source_row.substr(1);
                                    if (c === ';') {
                                        break;
                                    }
                                    if (!((c >= '0' && c <= '9') ||
                                            (c >= 'a' && c <= 'z') ||
                                            c === '#')) {
                                        fail_at(bundle.bad_entity, line, from + length,
                                            character);
                                    }
                                }
                                break;
                            }
                            return it('(punctuator)', t);
                        }
                    }
                }
            }
        };
    }());


    function add_label(t, type) {

        if (option.safe && funct['(global)'] &&
                typeof predefined[t] !== 'boolean') {
            warn(bundle.adsafe_a, token, t);
        } else if (t === 'hasOwnProperty') {
            warn(bundle.bad_name_a, token, t);
        }

// Define t in the current function in the current scope.

        if (is_own(funct, t) && !funct['(global)']) {
            warn(funct[t] === true ?
                bundle.used_before_a :
                bundle.already_defined,
                nexttoken, t);
        }
        funct[t] = type;
        if (funct['(global)']) {
            global[t] = funct;
            if (is_own(implied, t)) {
                warn(bundle.used_before_a, nexttoken, t);
                delete implied[t];
            }
        } else {
            scope[t] = funct;
        }
    }


    function discard() {

// The token will not be included in the parse tree, so move the comments
// that are attached to the token to tokens that are in the tree.

        if (token.comments) {
            nexttoken.comments = nexttoken.comments ?
                nexttoken.comments.concat(token.comments) :
                token.comments;
        }
        if (token.postcomments) {
            var prev = prevtoken;
            while (prev.postcomments === null) {
                prev = prev.prev;
            }
            if (prev.postcomments) {
                prev.comments = prev.postcomments.concat(token.postcomments);
            } else {
                prev.postcomments = token.postcomments;
            }
            token.postcomments = null;
        }
    }


// We need a peek function. If it has an argument, it peeks that much farther
// ahead.

    function peek(distance) {
        var i = distance || 0, j = 0, t;

        while (j <= i) {
            t = lookahead[j];
            if (!t) {
                t = lookahead[j] = lex.token();
            }
            j += 1;
        }
        return t;
    }


    function advance(id, t) {

// Produce the next token, also looking for programming errors.

        if (indent) {

// In indentation checking was requested, then inspect all of the line breakings.
// The var statement is tricky because the names might be aligned or not. We
// look at the first line break after the var to determine the programmer's
// intention.

            if (var_mode && nexttoken.line !== token.line) {
                if ((var_mode !== indent || !nexttoken.edge) &&
                        nexttoken.from === indent.at -
                        (nexttoken.edge ? option.indent : 0)) {
                    var dent = indent;
                    for (;;) {
                        dent.at -= option.indent;
                        if (dent === var_mode) {
                            break;
                        }
                        dent = dent.was;
                    }
                    dent.open = false;
                }
                var_mode = false;
            }
            if (indent.open) {

// If the token is an edge.

                if (nexttoken.edge) {
                    if (nexttoken.edge === 'label') {
                        expected_at(1);
                    } else if (nexttoken.edge === 'case') {
                        expected_at(indent.at - option.indent);
                    } else if (indent.mode !== 'array' || nexttoken.line !== token.line) {
                        expected_at(indent.at);
                    }

// If the token is not an edge, but is the first token on the line.

                } else if (nexttoken.line !== token.line &&
                        nexttoken.from < indent.at +
                        (indent.mode === 'expression' ? 0 : option.indent)) {
                    expected_at(indent.at + option.indent);
                }
            } else if (nexttoken.line !== token.line) {
                if (nexttoken.edge) {
                    expected_at(indent.at);
                } else {
                    indent.wrap = true;
                    if (indent.mode === 'statement' || indent.mode === 'var') {
                        expected_at(indent.at + option.indent);
                    } else if (nexttoken.from < indent.at +
                            (indent.mode === 'expression' ? 0 : option.indent)) {
                        expected_at(indent.at + option.indent);
                    }
                }
            }
        }

        switch (token.id) {
        case '(number)':
            if (nexttoken.id === '.') {
                warn(bundle.trailing_decimal_a);
            }
            break;
        case '-':
            if (nexttoken.id === '-' || nexttoken.id === '--') {
                warn(bundle.confusing_a);
            }
            break;
        case '+':
            if (nexttoken.id === '+' || nexttoken.id === '++') {
                warn(bundle.confusing_a);
            }
            break;
        }
        if (token.arity === 'string' || token.identifier) {
            anonname = token.value;
        }

        if (id && nexttoken.id !== id) {
            if (t) {
                warn(bundle.expected_a_b_from_c_d, nexttoken,
                    id, t.id, t.line, nexttoken.value);
            } else if (!nexttoken.identifier || nexttoken.value !== id) {
                warn(bundle.expected_a_b,
                    nexttoken, id, nexttoken.value);
            }
        }
        prevtoken = token;
        token = nexttoken;
        nexttoken = lookahead.shift() || lex.token();
    }

    function do_option() {
        var command = this.id,
            filter,
            name,
            object,
            old_comments_off = comments_off,
            old_option_white = option.white,
            value;
        comments_off = true;
        option.white = false;
        if (lookahead.length > 0 || this.postcomments || nexttoken.comments) {
            warn(bundle.unexpected_a, this);
        }
        switch (command) {
        case '/*members':
        case '/*member':
            command = '/*members';
            if (!members_only) {
                members_only = {};
            }
            object = members_only;
            break;
        case '/*jslint':
            if (option.safe) {
                warn(bundle.adsafe_a, this);
            }
            filter = bool_options;
            object = option;
            break;
        case '/*global':
            if (option.safe) {
                warn(bundle.adsafe_a, this);
            }
            object = predefined;
            break;
        default:
            fail("What?");
        }
loop:   for (;;) {
            for (;;) {
                if (nexttoken.id === '*/') {
                    break loop;
                }
                if (nexttoken.id !== ',') {
                    break;
                }
                advance();
            }
            if (nexttoken.arity !== 'string' && !nexttoken.identifier) {
                fail(bundle.unexpected_a, nexttoken);
            }
            name = nexttoken;
            advance();
            if (nexttoken.id === ':') {
                advance(':');
                if (object === members_only) {
                    fail(bundle.expected_a_b, name, '*/', ':');
                }
                if (name.value === 'indent' && command === '/*jslint') {
                    value = +nexttoken.value;
                    if (typeof value !== 'number' || !isFinite(value) || value < 0 ||
                            Math.floor(value) !== value) {
                        fail(bundle.expected_small_a);
                    }
                    if (value > 0) {
                        old_option_white = true;
                    }
                    object.indent = value;
                } else if (name.value === 'maxerr' && command === '/*jslint') {
                    value = +nexttoken.value;
                    if (typeof value !== 'number' || !isFinite(value) || value <= 0 ||
                            Math.floor(value) !== value) {
                        fail(bundle.expected_small_a, nexttoken);
                    }
                    object.maxerr = value;
                } else if (name.value === 'maxlen' && command === '/*jslint') {
                    value = +nexttoken.value;
                    if (typeof value !== 'number' || !isFinite(value) || value < 0 ||
                            Math.floor(value) !== value) {
                        fail(bundle.expected_small_a);
                    }
                    object.maxlen = value;
                } else if (nexttoken.id === 'true') {
                    if (name.value === 'white' && command === '/*jslint') {
                        old_option_white = object.white = true;
                    } else {
                        object[name.value] = true;
                    }
                } else if (nexttoken.id === 'false') {
                    if (name.value === 'white' && command === '/*jslint') {
                        old_option_white = object.white = false;
                    } else {
                        object[name.value] = false;
                    }
                } else {
                    fail(bundle.unexpected_a);
                }
                advance();
            } else {
                if (command === '/*jslint') {
                    fail(bundle.missing_option, nexttoken);
                }
                object[name.value] = false;
            }
        }
        if (filter) {
            assume();
        }
        comments_off = old_comments_off;
        advance('*/');
        option.white = old_option_white;
    }


// Indentation intention

    function edge(mode) {
        nexttoken.edge = !indent || (indent.open && (mode || true));
    }


    function step_in(mode) {
        var open, was;
        if (option.indent) {
            if (typeof mode === 'number') {
                indent = {
                    at: mode,
                    open: true,
                    was: was
                };
            } else if (!indent) {
                indent = {
                    at: 1,
                    mode: 'statement',
                    open: true
                };
            } else {
                was = indent;
                open = mode === 'var' ||
                    (nexttoken.line !== token.line && mode !== 'statement');
                indent = {
                    at: (open || mode === 'control' ?
                        was.at + option.indent : was.at) +
                        (was.wrap ? option.indent : 0),
                    mode: mode,
                    open: open,
                    was: was
                };
                if (mode === 'var' && open) {
                    var_mode = indent;
                }
            }
        }
    }

    function step_out(id, t) {
        if (id) {
            if (indent && indent.open) {
                indent.at -= option.indent;
                edge();
            }
            advance(id, t);
        }
        if (indent) {
            indent = indent.was;
        }
    }

// Functions for conformance of whitespace.

    function one_space(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (right.id !== '(end)' && option.white &&
                (token.line !== right.line ||
                token.thru + 1 !== right.from)) {
            warn(bundle.expected_space_a_b, right, token.value, right.value);
        }
    }

    function one_space_only(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (right.id !== '(end)' && (left.line !== right.line ||
                (option.white && left.thru + 1 !== right.from))) {
            warn(bundle.expected_space_a_b, right, left.value, right.value);
        }
    }

    function no_space(left, right) {
        left = left || token;
        right = right || nexttoken;
        if ((option.white || xmode === 'styleproperty' || xmode === 'style') &&
                left.thru !== right.from && left.line === right.line) {
            warn(bundle.unexpected_space_a_b, right, left.value, right.value);
        }
    }

    function no_space_only(left, right) {
        left = left || token;
        right = right || nexttoken;
        if (right.id !== '(end)' && (left.line !== right.line ||
                (option.white && left.thru !== right.from))) {
            warn(bundle.unexpected_space_a_b, right, left.value, right.value);
        }
    }

    function spaces(left, right) {
        if (option.white) {
            left = left || token;
            right = right || nexttoken;
            if (left.thru === right.from && left.line === right.line) {
                warn(bundle.missing_space_a_b, right, left.value, right.value);
            }
        }
    }

    function comma() {
        if (nexttoken.id !== ',') {
            warn(bundle.expected_a_b, nexttoken, ',', nexttoken.value);
        } else {
            if (option.white) {
                no_space_only();
            }
            advance(',');
            discard();
            spaces();
        }
    }


    function semicolon() {
        if (nexttoken.id !== ';') {
            warn(bundle.expected_a_b, nexttoken, ';', nexttoken.value);
        } else {
            if (option.white) {
                no_space_only();
            }
            advance(';');
            discard();
            if (semicolon_coda[nexttoken.id] !== true) {
                spaces();
            }
        }
    }

    function use_strict() {
        if (nexttoken.value === 'use strict') {
            if (strict_mode) {
                warn(bundle.unnecessary_use);
            }
            edge();
            advance();
            semicolon();
            strict_mode = true;
            option.newcap = true;
            option.undef = true;
            return true;
        } else {
            return false;
        }
    }


    function are_similar(a, b) {
        if (a === b) {
            return true;
        }
        if (Array.isArray(a)) {
            if (Array.isArray(b) && a.length === b.length) {
                var i;
                for (i = 0; i < a.length; i += 1) {
                    if (!are_similar(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        if (Array.isArray(b)) {
            return false;
        }
        if (a.arity === b.arity && a.value === b.value) {
            switch (a.arity) {
            case 'prefix':
            case 'suffix':
            case undefined:
                return are_similar(a.first, b.first);
            case 'infix':
                return are_similar(a.first, b.first) &&
                    are_similar(a.second, b.second);
            case 'ternary':
                return are_similar(a.first, b.first) &&
                    are_similar(a.second, b.second) &&
                    are_similar(a.third, b.third);
            case 'function':
            case 'regexp':
                return false;
            default:
                return true;
            }
        } else {
            if (a.id === '.' && b.id === '[' && b.arity === 'infix') {
                return a.second.value === b.second.value && b.second.arity === 'string';
            } else if (a.id === '[' && a.arity === 'infix' && b.id === '.') {
                return a.second.value === b.second.value && a.second.arity === 'string';
            }
        }
        return false;
    }


// This is the heart of JSLINT, the Pratt parser. In addition to parsing, it
// is looking for ad hoc lint patterns. We add .fud to Pratt's model, which is
// like .nud except that it is only used on the first token of a statement.
// Having .fud makes it much easier to define statement-oriented languages like
// JavaScript. I retained Pratt's nomenclature.

// .nud     Null denotation
// .fud     First null denotation
// .led     Left denotation
//  lbp     Left binding power
//  rbp     Right binding power

// They are elements of the parsing method called Top Down Operator Precedence.

    function expression(rbp, initial) {

// rbp is the right binding power.
// initial indicates that this is the first expression of a statement.

        var left;
        if (nexttoken.id === '(end)') {
            fail(bundle.unexpected_a, token, nexttoken.id);
        }
        advance();
        if (option.safe && typeof predefined[token.value] === 'boolean' &&
                (nexttoken.id !== '(' && nexttoken.id !== '.')) {
            warn(bundle.adsafe, token);
        }
        if (initial) {
            anonname = 'anonymous';
            funct['(verb)'] = token.value;
        }
        if (initial === true && token.fud) {
            left = token.fud();
        } else {
            if (token.nud) {
                left = token.nud();
            } else {
                if (nexttoken.arity === 'number' && token.id === '.') {
                    warn(bundle.leading_decimal_a, token,
                        nexttoken.value);
                    advance();
                    return token;
                } else {
                    fail(bundle.expected_identifier_a, token, token.id);
                }
            }
            while (rbp < nexttoken.lbp) {
                advance();
                if (token.led) {
                    left = token.led(left);
                } else {
                    fail(bundle.expected_operator_a, token, token.id);
                }
            }
        }
        return left;
    }


// Functional constructors for making the symbols that will be inherited by
// tokens.

    function symbol(s, p) {
        var x = syntax[s];
        if (!x || typeof x !== 'object') {
            syntax[s] = x = {
                id: s,
                lbp: p,
                value: s
            };
        }
        return x;
    }


    function delim(s) {
        return symbol(s, 0);
    }


    function ultimate(s) {
        var x = symbol(s, 0);
        x.from = 1;
        x.thru = 1;
        x.line = 0;
        x.edge = true;
        s.value = s;
        return x;
    }


    function stmt(s, f) {
        var x = delim(s);
        x.identifier = x.reserved = true;
        x.fud = f;
        return x;
    }

    function disrupt_stmt(s, f) {
        var x = stmt(s, f);
        x.disrupt = true;
    }


    function reserve_name(x) {
        var c = x.id.charAt(0);
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            x.identifier = x.reserved = true;
        }
        return x;
    }


    function prefix(s, f) {
        var x = symbol(s, 150);
        reserve_name(x);
        x.nud = (typeof f === 'function') ? f : function () {
            if (s === 'typeof') {
                one_space();
            } else {
                no_space_only();
            }
            this.first = expression(150);
            this.arity = 'prefix';
            if (this.id === '++' || this.id === '--') {
                if (option.plusplus) {
                    warn(bundle.unexpected_a, this);
                } else if ((!this.first.identifier || this.first.reserved) &&
                        this.first.id !== '.' && this.first.id !== '[') {
                    warn(bundle.bad_operand, this);
                }
            }
            return this;
        };
        return x;
    }


    function type(s, arity, nud) {
        var x = delim(s);
        x.arity = arity;
        if (nud) {
            x.nud = nud;
        }
        return x;
    }


    function reserve(s, f) {
        var x = delim(s);
        x.identifier = x.reserved = true;
        x.nud = return_this;
        return x;
    }


    function reservevar(s, v) {
        return reserve(s, function () {
            if (typeof v === 'function') {
                v(this);
            }
            return this;
        });
    }


    function infix(s, p, f, w) {
        var x = symbol(s, p);
        reserve_name(x);
        x.led = function (left) {
            this.arity = 'infix';
            if (!w) {
                spaces(prevtoken, token);
                spaces();
            }
            if (typeof f === 'function') {
                return f(left, this);
            } else {
                this.first = left;
                this.second = expression(p);
                return this;
            }
        };
        return x;
    }

    function expected_relation(node, message) {
        if (node.assign) {
            warn(message || bundle.conditional_assignment, node);
        }
        return node;
    }

    function expected_condition(node, message) {
        switch (node.id) {
        case '[':
        case '-':
            if (node.arity !== 'infix') {
                warn(message || bundle.weird_condition, node);
            }
            break;
        case 'false':
        case 'function':
        case 'Infinity':
        case 'NaN':
        case 'null':
        case 'true':
        case 'undefined':
        case 'void':
        case '(number)':
        case '(regexp)':
        case '(string)':
        case '{':
            warn(message || bundle.weird_condition, node);
            break;
        }
        return node;
    }

    function check_relation(node) {
        switch (node.arity) {
        case 'prefix':
            switch (node.id) {
            case '{':
            case '[':
                warn(bundle.unexpected_a, node);
                break;
            case '!':
                warn(bundle.confusing_a, node);
                break;
            }
            break;
        case 'function':
        case 'regexp':
            warn(bundle.unexpected_a, node);
            break;
        default:
            if (node.id  === 'NaN') {
                warn(bundle.isNaN, node);
            }
        }
        return node;
    }


    function relation(s, eqeq) {
        var x = infix(s, 100, function (left, that) {
            check_relation(left);
            if (eqeq) {
                warn(bundle.expected_a_b, that, eqeq, that.id);
            }
            var right = expression(100);
            if (are_similar(left, right) ||
                    ((left.arity === 'string' || left.arity === 'number') &&
                    (right.arity === 'string' || right.arity === 'number'))) {
                warn(bundle.weird_relation, that);
            }
            that.first = left;
            that.second = check_relation(right);
            return that;
        });
        return x;
    }


    function assignop(s, bit) {
        var x = infix(s, 20, function (left, that) {
            var l;
            if (option.bitwise && bit) {
                warn(bundle.unexpected_a, that);
            }
            that.first = left;
            if (predefined[left.value] === false &&
                    scope[left.value]['(global)'] === true) {
                warn(bundle.read_only, left);
            } else if (left['function']) {
                warn(bundle.a_function, left);
            }
            if (option.safe) {
                l = left;
                do {
                    if (typeof predefined[l.value] === 'boolean') {
                        warn(bundle.adsafe, l);
                    }
                    l = l.first;
                } while (l);
            }
            if (left) {
                if (left === syntax['function']) {
                    warn(bundle.identifier_function, token);
                }
                if (left.id === '.' || left.id === '[') {
                    if (!left.first || left.first.value === 'arguments') {
                        warn(bundle.bad_assignment, that);
                    }
                    that.second = expression(19);
                    if (that.id === '=' && are_similar(that.first, that.second)) {
                        warn(bundle.weird_assignment, that);
                    }
                    return that;
                } else if (left.identifier && !left.reserved) {
                    if (funct[left.value] === 'exception') {
                        warn(bundle.assign_exception, left);
                    }
                    that.second = expression(19);
                    if (that.id === '=' && are_similar(that.first, that.second)) {
                        warn(bundle.weird_assignment, that);
                    }
                    return that;
                }
            }
            fail(bundle.bad_assignment, that);
        });
        x.assign = true;
        return x;
    }


    function bitwise(s, p) {
        return infix(s, p, function (left, that) {
            if (option.bitwise) {
                warn(bundle.unexpected_a, that);
            }
            that.first = left;
            that.second = expression(p);
            return that;
        });
    }


    function suffix(s, f) {
        var x = symbol(s, 150);
        x.led = function (left) {
            no_space_only(prevtoken, token);
            if (option.plusplus) {
                warn(bundle.unexpected_a, this);
            } else if ((!left.identifier || left.reserved) &&
                    left.id !== '.' && left.id !== '[') {
                warn(bundle.bad_operand, this);
            }
            this.first = left;
            this.arity = 'suffix';
            return this;
        };
        return x;
    }


    function optional_identifier() {
        if (nexttoken.identifier) {
            advance();
            if (option.safe && banned[token.value]) {
                warn(bundle.adsafe_a, token);
            } else if (token.reserved && !option.es5) {
                warn(bundle.expected_identifier_a_reserved, token);
            }
            return token.value;
        }
    }


    function identifier() {
        var i = optional_identifier();
        if (i) {
            return i;
        }
        if (token.id === 'function' && nexttoken.id === '(') {
            warn(bundle.name_function);
        } else {
            fail(bundle.expected_identifier_a);
        }
    }


    function statement(no_indent) {

// Usually a statement starts a line. Exceptions include the var statement in the
// initialization part of a for statement, and an if after an else.

        var label, old_scope = scope, the_statement;

// We don't like the empty statement.

        if (nexttoken.id === ';') {
            warn(bundle.unexpected_a);
            semicolon();
            return;
        }

// Is this a labelled statement?

        if (nexttoken.identifier && !nexttoken.reserved && peek().id === ':') {
            edge('label');
            label = nexttoken;
            advance();
            advance(':');
            scope = Object.create(old_scope);
            add_label(label.value, 'label');
            if (labelled[nexttoken.id] !== true) {
                warn(bundle.label_a_b, nexttoken, label.value, nexttoken.value);
            }
            if (jx.test(label.value + ':')) {
                warn(bundle.url, label);
            }
            nexttoken.label = label;
        }

// Parse the statement.

        edge();
        step_in('statement');
        the_statement = expression(0, true);
        if (the_statement) {

// Look for the final semicolon.

            if (the_statement.arity === 'statement') {
                if (the_statement.id === 'switch' ||
                        (the_statement.block && the_statement.id !== 'do')) {
                    spaces();
                } else {
                    semicolon();
                }
            } else {

// If this is an expression statement, determine if it is acceptble.
// We do not like
//      new Blah();
// statments. If it is to be used at all, new should only be used to make
// objects, not side effects. The expression statements we do like do
// assignment or invocation or delete.

                if (the_statement.id === '(') {
                    if (the_statement.first.id === 'new') {
                        warn(bundle.bad_new);
                    }
                } else if (!the_statement.assign &&
                        the_statement.id !== 'delete' &&
                        the_statement.id !== '++' &&
                        the_statement.id !== '--') {
                    warn(bundle.assignment_function_expression, token);
                }
                semicolon();
            }
        }
        step_out();
        scope = old_scope;
        return the_statement;
    }


    function statements(begin) {
        var adsafe_function, adsafe_params, array = [], disruptor, the_statement;
        if (option.adsafe) {
            switch (begin) {
            case 'script':

// JSLint is also the static analyzer for ADsafe. See www.ADsafe.org.

                if (!adsafe_may) {
                    if (nexttoken.value !== 'ADSAFE' || peek(0).id !== '.' ||
                            (peek(1).value !== 'id' && peek(1).value !== 'go')) {
                        fail(bundle.adsafe_id_go);
                    }
                }
                if (nexttoken.value === 'ADSAFE' && peek(0).id === '.' &&
                        peek(1).value === 'id') {
                    if (adsafe_may) {
                        fail(bundle.adsafe, nexttoken);
                    }
                    advance('ADSAFE');
                    advance('.');
                    advance('id');
                    advance('(');
                    if (nexttoken.value !== adsafe_id) {
                        fail(bundle.adsafe_id, nexttoken);
                    }
                    advance('(string)');
                    advance(')');
                    semicolon();
                    adsafe_may = true;
                }
                break;
            case 'lib':
                if (nexttoken.value === 'ADSAFE') {
                    advance('ADSAFE');
                    advance('.');
                    advance('lib');
                    advance('(');
                    advance('(string)');
                    comma();
                    adsafe_function = expression(0);
                    if (adsafe_function.id !== 'function') {
                        fail(bundle.adsafe_lib_second, adsafe_function);
                    }
                    adsafe_params = adsafe_function.funct['(params)'];
                    adsafe_params = adsafe_params && adsafe_params.join(', ');
                    if (adsafe_params && adsafe_params !== 'lib') {
                        fail(bundle.expected_a_b, adsafe_function, '(lib)',
                            '(' + adsafe_params + ')');
                    }
                    advance(')');
                    semicolon();
                    return array;
                } else {
                    fail(bundle.adsafe_lib);
                }
                break;
            }
        }

// A disrupt statement may not be followed by any other statement.
// If the last statement is disrupt, then the sequence is disrupt.

        while (postscript[nexttoken.id] !== true) {
            if (nexttoken.id === ';') {
                warn(bundle.unexpected_a, nexttoken);
                semicolon();
            } else {
                if (disruptor) {
                    warn(bundle.unreachable_a_b, nexttoken, nexttoken.value,
                        disruptor.value);
                    disruptor = null;
                }
                the_statement = statement();
                if (the_statement) {
                    array.push(the_statement);
                    if (the_statement.disrupt) {
                        disruptor = the_statement;
                        array.disrupt = true;
                    }
                }
            }
        }
        return array;
    }


    function block(ordinary) {

// array block is array sequence of statements wrapped in braces.
// ordinary is false for function bodies and try blocks.
// ordinary is true for if statements, while, etc.

        var array,
            curly = nexttoken,
            old_inblock = in_block,
            old_scope = scope,
            old_strict_mode = strict_mode;

        in_block = ordinary;
        scope = Object.create(scope);
        spaces();
        if (nexttoken.id === '{') {
            advance('{');
            step_in();
            if (!ordinary && !use_strict() && !old_strict_mode &&
                    option.strict && funct['(context)']['(global)']) {
                warn(bundle.missing_use_strict);
            }
            array = statements();
            strict_mode = old_strict_mode;
            step_out('}', curly);
            discard();
        } else if (!ordinary) {
            fail(bundle.expected_a_b, nexttoken, '{', nexttoken.value);
        } else {
            warn(bundle.expected_a_b, nexttoken, '{', nexttoken.value);
            array = [statement()];
            array.disrupt = array[0].disrupt;
        }
        funct['(verb)'] = null;
        scope = old_scope;
        in_block = old_inblock;
        if (ordinary && array.length === 0) {
            warn(bundle.empty_block);
        }
        return array;
    }


    function tally_member(name) {
        if (members_only && typeof members_only[name] !== 'boolean') {
            warn(bundle.unexpected_member_a, token, name);
        }
        if (typeof member[name] === 'number') {
            member[name] += 1;
        } else {
            member[name] = 1;
        }
    }


    function note_implied(token) {
        var name = token.value, line = token.line, a = implied[name];
        if (typeof a === 'function') {
            a = false;
        }
        if (!a) {
            a = [line];
            implied[name] = a;
        } else if (a[a.length - 1] !== line) {
            a.push(line);
        }
    }


// ECMAScript parser

    syntax['(identifier)'] = {
        type: '(identifier)',
        lbp: 0,
        identifier: true,
        nud: function () {
            var v = this.value,
                s = scope[v],
                f;
            if (typeof s === 'function') {

// Protection against accidental inheritance.

                s = undefined;
            } else if (typeof s === 'boolean') {
                f = funct;
                funct = functions[0];
                add_label(v, 'var');
                s = funct;
                funct = f;
            }

// The name is in scope and defined in the current function.

            if (funct === s) {

//      Change 'unused' to 'var', and reject labels.

                switch (funct[v]) {
                case 'unused':
                    funct[v] = 'var';
                    break;
                case 'unction':
                    funct[v] = 'function';
                    this['function'] = true;
                    break;
                case 'function':
                    this['function'] = true;
                    break;
                case 'label':
                    warn(bundle.a_label, token, v);
                    break;
                }

// The name is not defined in the function.  If we are in the global scope,
// then we have an undefined variable.

            } else if (funct['(global)']) {
                if (option.undef && typeof predefined[v] !== 'boolean') {
                    warn(bundle.a_not_defined, token, v);
                }
                note_implied(token);

// If the name is already defined in the current
// function, but not as outer, then there is a scope error.

            } else {
                switch (funct[v]) {
                case 'closure':
                case 'function':
                case 'var':
                case 'unused':
                    warn(bundle.a_scope, token, v);
                    break;
                case 'label':
                    warn(bundle.a_label, token, v);
                    break;
                case 'outer':
                case 'global':
                    break;
                default:

// If the name is defined in an outer function, make an outer entry, and if
// it was unused, make it var.

                    if (s === true) {
                        funct[v] = true;
                    } else if (s === null) {
                        warn(bundle.a_not_allowed, token, v);
                        note_implied(token);
                    } else if (typeof s !== 'object') {
                        if (option.undef) {
                            warn(bundle.a_not_defined, token, v);
                        } else {
                            funct[v] = true;
                        }
                        note_implied(token);
                    } else {
                        switch (s[v]) {
                        case 'function':
                        case 'unction':
                            this['function'] = true;
                            s[v] = 'closure';
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'var':
                        case 'unused':
                            s[v] = 'closure';
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'closure':
                        case 'parameter':
                            funct[v] = s['(global)'] ? 'global' : 'outer';
                            break;
                        case 'label':
                            warn(bundle.a_label, token, v);
                            break;
                        }
                    }
                }
            }
            return this;
        },
        led: function () {
            fail(bundle.expected_operator_a);
        }
    };

// Build the syntax table by declaring the syntactic elements of the language.

    type('(number)', 'number', return_this);
    type('(string)', 'string', return_this);
    type('(regexp)', 'regexp', return_this);
    type('(color)', 'color');
    type('(range)', 'range');

    ultimate('(begin)');
    ultimate('(end)');
    ultimate('(error)');
    delim('</');
    delim('<!');
    delim('<!--');
    delim('-->');
    delim('}');
    delim(')');
    delim(']');
    delim('"');
    delim('\'');
    delim(';');
    delim(':');
    delim(',');
    delim('#');
    delim('@');
    delim('*/');
    reserve('else');
    reserve('case');
    reserve('catch');
    reserve('default');
    reserve('finally');
    reservevar('arguments', function (x) {
        if (strict_mode && funct['(global)']) {
            warn(bundle.strict, x);
        } else if (option.safe) {
            warn(bundle.adsafe, x);
        }
    });
    reservevar('eval', function (x) {
        if (option.safe) {
            warn(bundle.adsafe, x);
        }
    });
    reservevar('false');
    reservevar('Infinity');
    reservevar('NaN');
    reservevar('null');
    reservevar('this', function (x) {
        if (strict_mode && ((funct['(statement)'] &&
                funct['(name)'].charAt(0) > 'Z') || funct['(global)'])) {
            warn(bundle.strict, x);
        } else if (option.safe) {
            warn(bundle.adsafe, x);
        }
    });
    reservevar('true');
    reservevar('undefined');
    assignop('=');
    assignop('+=');
    assignop('-=');
    assignop('*=');
    assignop('/=').nud = function () {
        fail(bundle.slash_equal);
    };
    assignop('%=');
    assignop('&=', true);
    assignop('|=', true);
    assignop('^=', true);
    assignop('<<=', true);
    assignop('>>=', true);
    assignop('>>>=', true);
    infix('?', 30, function (left, that) {
        that.first = expected_condition(expected_relation(left));
        that.second = expression(0);
        spaces();
        advance(':');
        spaces();
        that.third = expression(10);
        that.arity = 'ternary';
        if (are_similar(that.second, that.third)) {
            warn(bundle.weird_ternary, that);
        }
        return that;
    });

    infix('||', 40, function (left, that) {
        function paren_check(that) {
            if (that.id === '&&' && !that.paren) {
                warn(bundle.and, that);
            }
            return that;
        }

        that.first = paren_check(expected_condition(expected_relation(left)));
        that.second = paren_check(expected_relation(expression(40)));
        if (are_similar(that.first, that.second)) {
            warn(bundle.weird_condition, that);
        }
        return that;
    });
    infix('&&', 50, function (left, that) {
        that.first = expected_condition(expected_relation(left));
        that.second = expected_relation(expression(50));
        if (are_similar(that.first, that.second)) {
            warn(bundle.weird_condition, that);
        }
        return that;
    });
    prefix('void', function () {
        this.first = expression(0);
        if (this.first.arity !== 'number' || this.first.value) {
            warn(bundle.unexpected_a, this);
            return this;
        }
        return this;
    });
    bitwise('|', 70);
    bitwise('^', 80);
    bitwise('&', 90);
    relation('==', '===');
    relation('===');
    relation('!=', '!==');
    relation('!==');
    relation('<');
    relation('>');
    relation('<=');
    relation('>=');
    bitwise('<<', 120);
    bitwise('>>', 120);
    bitwise('>>>', 120);
    infix('in', 120);
    infix('instanceof', 120);
    infix('+', 130, function (left, that) {
        if (!left.value) {
            if (left.arity === 'number') {
                warn(bundle.unexpected_a, left);
            } else if (left.arity === 'string') {
                warn(bundle.expected_a_b, left, 'String', '\'\'');
            }
        }
        var right = expression(130);
        if (!right.value) {
            if (right.arity === 'number') {
                warn(bundle.unexpected_a, right);
            } else if (right.arity === 'string') {
                warn(bundle.expected_a_b, right, 'String', '\'\'');
            }
        }
        if (left.arity === right.arity &&
                (left.arity === 'string' && left.arity === 'number')) {
            left.value += right.value;
            left.thru = right.thru;
            if (left.arity === 'string' && jx.test(left.value)) {
                warn(bundle.url, left);
            }
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    prefix('+', 'num');
    prefix('+++', function () {
        warn(bundle.confusing_a, token);
        this.first = expression(150);
        this.arity = 'prefix';
        return this;
    });
    infix('+++', 130, function (left) {
        warn(bundle.confusing_a, token);
        this.first = left;
        this.second = expression(130);
        return this;
    });
    infix('-', 130, function (left, that) {
        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {
            warn(bundle.unexpected_a, left);
        }
        var right = expression(130);
        if ((right.arity === 'number' && right.value === 0) || right.arity === 'string') {
            warn(bundle.unexpected_a, left);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value -= right.value;
            left.thru = right.thru;
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    prefix('-');
    prefix('---', function () {
        warn(bundle.confusing_a, token);
        this.first = expression(150);
        this.arity = 'prefix';
        return this;
    });
    infix('---', 130, function (left) {
        warn(bundle.confusing_a, token);
        this.first = left;
        this.second = expression(130);
        return this;
    });
    infix('*', 140, function (left, that) {
        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {
            warn(bundle.unexpected_a, left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn(bundle.unexpected_a, right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value *= right.value;
            left.thru = right.thru;
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    infix('/', 140, function (left, that) {
        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {
            warn(bundle.unexpected_a, left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn(bundle.unexpected_a, right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value /= right.value;
            left.thru = right.thru;
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    infix('%', 140, function (left, that) {
        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {
            warn(bundle.unexpected_a, left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn(bundle.unexpected_a, right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value %= right.value;
            left.thru = right.thru;
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });

    suffix('++');
    prefix('++');

    suffix('--');
    prefix('--');
    prefix('delete', function () {
        one_space();
        var p = expression(0);
        if (!p || (p.id !== '.' && p.id !== '[')) {
            warn(bundle.deleted);
        }
        this.first = p;
        return this;
    });


    prefix('~', function () {
        no_space_only();
        if (option.bitwise) {
            warn(bundle.unexpected_a, this);
        }
        expression(150);
        return this;
    });
    prefix('!', function () {
        no_space_only();
        this.first = expression(150);
        this.arity = 'prefix';
        if (bang[this.first.id] === true) {
            warn(bundle.confusing_a, this);
        }
        return this;
    });
    prefix('typeof');
    prefix('new', function () {
        one_space();
        var c = expression(160), i, p;
        this.first = c;
        if (c.id !== 'function') {
            if (c.identifier) {
                switch (c.value) {
                case 'Object':
                    warn(bundle.use_object, token);
                    break;
                case 'Array':
                    if (nexttoken.id === '(') {
                        p = nexttoken;
                        p.first = this;
                        advance('(');
                        if (nexttoken.id !== ')') {
                            p.second = expression(0);
                            if (p.second.arity !== 'number' || !p.second.value) {
                                expected_condition(p.second,  bundle.use_array);
                                i = false;
                            } else {
                                i = true;
                            }
                            while (nexttoken.id !== ')' && nexttoken.id !== '(end)') {
                                if (i) {
                                    warn(bundle.use_array, p);
                                    i = false;
                                }
                                advance();
                            }
                        } else {
                            warn(bundle.use_array, token);
                        }
                        advance(')', p);
                        return p;
                    }
                    warn(bundle.use_array, token);
                    break;
                case 'Number':
                case 'String':
                case 'Boolean':
                case 'Math':
                case 'JSON':
                    warn(bundle.not_a_constructor, c);
                    break;
                case 'Function':
                    if (!option.evil) {
                        warn(bundle.function_eval);
                    }
                    break;
                case 'Date':
                case 'RegExp':
                    break;
                default:
                    if (c.id !== 'function') {
                        i = c.value.substr(0, 1);
                        if (option.newcap && (i < 'A' || i > 'Z')) {
                            warn(bundle.constructor_name_a, token);
                        }
                    }
                }
            } else {
                if (c.id !== '.' && c.id !== '[' && c.id !== '(') {
                    warn(bundle.bad_constructor, token);
                }
            }
        } else {
            warn(bundle.weird_new, this);
        }
        if (nexttoken.id !== '(') {
            warn(bundle.missing_a, nexttoken, '()');
        }
        return this;
    });

    infix('(', 160, function (left, that) {
        if (indent && indent.statement) {
            no_space_only(prevtoken, token);
        } else {
            no_space(prevtoken, token);
        }
        if (!left.immed && left.id === 'function') {
            warn(bundle.wrap_immediate);
        }
        var p = [];
        if (left) {
            if (left.identifier) {
                if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {
                    if (left.value !== 'Number' && left.value !== 'String' &&
                            left.value !== 'Boolean' && left.value !== 'Date') {
                        if (left.value === 'Math' || left.value === 'JSON') {
                            warn(bundle.not_a_function, left);
                        } else if (left.value === 'Object') {
                            warn(bundle.use_object, token);
                        } else if (left.value === 'Array' || option.newcap) {
                            warn(bundle.missing_a, left, 'new');
                        }
                    }
                }
            } else if (left.id === '.') {
                if (option.safe && left.first.value === 'Math' &&
                        left.second === 'random') {
                    warn(bundle.adsafe, left);
                }
            }
        }
        step_in();
        if (nexttoken.id !== ')') {
            no_space();
            for (;;) {
                edge();
                p.push(expression(10));
                if (nexttoken.id !== ',') {
                    break;
                }
                comma();
            }
        }
        no_space();
        step_out(')', this);
        if (typeof left === 'object') {
            if (left.value === 'parseInt' && p.length === 1) {
                warn(bundle.radix, left);
            }
            if (!option.evil) {
                if (left.value === 'eval' || left.value === 'Function' ||
                        left.value === 'execScript') {
                    warn(bundle.evil, left);
                } else if (p[0] && p[0].arity === 'string' &&
                        (left.value === 'setTimeout' ||
                        left.value === 'setInterval')) {
                    warn(bundle.implied_evil, left);
                }
            }
            if (!left.identifier && left.id !== '.' && left.id !== '[' &&
                    left.id !== '(' && left.id !== '&&' && left.id !== '||' &&
                    left.id !== '?') {
                warn(bundle.bad_invocation, left);
            }
        }
        that.first = left;
        that.second = p;
        return that;
    }, true);

    prefix('(', function () {
        step_in('expression');
        discard();
        no_space();
        edge();
        if (nexttoken.id === 'function') {
            nexttoken.immed = true;
        }
        var value = expression(0);
        value.paren = true;
        no_space();
        step_out(')', this);
        discard();
        if (value.id === 'function') {
            if (nexttoken.id === '(') {
                warn(bundle.move_invocation);
            } else {
                warn(bundle.bad_wrap, this);
            }
        }
        return value;
    });

    infix('.', 170, function (left, that) {
        no_space(prevtoken, token);
        no_space();
        var m = identifier();
        if (typeof m === 'string') {
            tally_member(m);
        }
        that.first = left;
        that.second = token;
        if (left && left.value === 'arguments' &&
                (m === 'callee' || m === 'caller')) {
            warn(bundle.avoid_a, left, 'arguments.' + m);
        } else if (!option.evil && left && left.value === 'document' &&
                (m === 'write' || m === 'writeln')) {
            warn(bundle.write_is_wrong, left);
        } else if (option.adsafe) {
            if (left && left.value === 'ADSAFE') {
                if (m === 'id' || m === 'lib') {
                    warn(bundle.adsafe, that);
                } else if (m === 'go') {
                    if (xmode !== 'script') {
                        warn(bundle.adsafe, that);
                    } else if (adsafe_went || nexttoken.id !== '(' ||
                            peek(0).arity !== 'string' ||
                            peek(0).value !== adsafe_id ||
                            peek(1).id !== ',') {
                        fail(bundle.adsafe_a, that, 'go');
                    }
                    adsafe_went = true;
                    adsafe_may = false;
                }
            }
        }
        if (!option.evil && (m === 'eval' || m === 'execScript')) {
            warn(bundle.evil);
        } else if (option.safe) {
            for (;;) {
                if (banned[m] === true) {
                    warn(bundle.adsafe_a, token, m);
                }
                if (typeof predefined[left.value] !== 'boolean' ||
                        nexttoken.id === '(') {
                    break;
                }
                if (standard_member[m] === true) {
                    if (nexttoken.id === '.') {
                        warn(bundle.adsafe, that);
                    }
                    break;
                }
                if (nexttoken.id !== '.') {
                    warn(bundle.adsafe, that);
                    break;
                }
                advance('.');
                token.first = that;
                token.second = m;
                that = token;
                m = identifier();
                if (typeof m === 'string') {
                    tally_member(m);
                }
            }
        }
        return that;
    }, true);

    infix('[', 170, function (left, that) {
        no_space_only(prevtoken, token);
        no_space();
        step_in();
        edge();
        var e = expression(0), s;
        if (e.arity === 'string') {
            if (option.safe && banned[e.value] === true) {
                warn(bundle.adsafe_a, e);
            } else if (!option.evil &&
                    (e.value === 'eval' || e.value === 'execScript')) {
                warn(bundle.evil, e);
            } else if (option.safe &&
                    (e.value.charAt(0) === '_' || e.value.charAt(0) === '-')) {
                warn(bundle.adsafe_subscript_a, e);
            }
            tally_member(e.value);
            if (!option.sub && ix.test(e.value)) {
                s = syntax[e.value];
                if (!s || !s.reserved) {
                    warn(bundle.subscript, e);
                }
            }
        } else if (e.arity !== 'number' || e.value < 0) {
            if (option.safe) {
                warn(bundle.adsafe_subscript_a, e);
            }
        }
        step_out(']', that);
        discard();
        no_space(prevtoken, token);
        that.first = left;
        that.second = e;
        return that;
    }, true);

    prefix('[', function () {
        this.arity = 'prefix';
        this.first = [];
        step_in('array');
        while (nexttoken.id !== '(end)') {
            while (nexttoken.id === ',') {
                warn(bundle.unexpected_a, nexttoken);
                advance(',');
            }
            if (nexttoken.id === ']') {
                break;
            }
            edge();
            this.first.push(expression(10));
            if (nexttoken.id === ',') {
                comma();
                if (nexttoken.id === ']' && !option.es5) {
                    warn(bundle.unexpected_a, token);
                    break;
                }
            } else {
                break;
            }
        }
        step_out(']', this);
        discard();
        return this;
    }, 170);


    function property_name() {
        var id = optional_identifier(true);
        if (!id) {
            if (nexttoken.arity === 'string') {
                id = nexttoken.value;
                if (option.safe) {
                    if (banned[id]) {
                        warn(bundle.adsafe_a);
                    } else if (id.charAt(0) === '_' ||
                            id.charAt(id.length - 1) === '_') {
                        warn(bundle.dangling_a);
                    }
                }
                advance();
            } else if (nexttoken.arity === 'number') {
                id = nexttoken.value.toString();
                advance();
            }
        }
        return id;
    }


    function function_params() {
        var id, paren = nexttoken, params = [];
        advance('(');
        step_in();
        discard();
        no_space();
        if (nexttoken.id === ')') {
            no_space();
            step_out(')', paren);
            discard();
            return;
        }
        for (;;) {
            edge();
            id = identifier();
            params.push(token);
            add_label(id, 'parameter');
            if (nexttoken.id === ',') {
                comma();
            } else {
                no_space();
                step_out(')', paren);
                discard();
                return params;
            }
        }
    }


    function do_function(func, name) {
        var s = scope;
        scope = Object.create(s);
        funct = {
            '(name)'     : name || '"' + anonname + '"',
            '(line)'     : nexttoken.line,
            '(context)'  : funct,
            '(breakage)' : 0,
            '(loopage)'  : 0,
            '(scope)'    : scope,
            '(token)'    : func
        };
        token.funct = funct;
        functions.push(funct);
        if (name) {
            add_label(name, 'function');
        }
        func.name = name || '';
        func.first = funct['(params)'] = function_params();
        one_space();
        func.block = block(false);

        scope = s;
        funct = funct['(context)'];
        return func;
    }


    prefix('{', function () {
        var get, i, j, name, p, set, seen = {}, t;
        this.arity = 'prefix';
        this.first = [];
        step_in();
        while (nexttoken.id !== '}') {

// JSLint recognizes the ES5 extension for get/set in object literals,
// but requires that they be used in pairs.

            edge();
            if (nexttoken.value === 'get' && peek().id !== ':') {
                if (!option.es5) {
                    warn(bundle.get_set);
                }
                get = nexttoken;
                one_space_only();
                advance('get');
                name = nexttoken;
                i = property_name();
                if (!i) {
                    fail(bundle.missing_property);
                }
                do_function(get, '');
                if (funct['(loopage)']) {
                    warn(bundle.function_loop, t);
                }
                p = get.first;
                if (p) {
                    warn(bundle.parameter_a_get_b, t, p[0], i);
                }
                comma();
                set = nexttoken;
                spaces();
                edge();
                advance('set');
                one_space_only();
                j = property_name();
                if (i !== j) {
                    fail(bundle.expected_a_b, token, i, j);
                }
                do_function(set, '');
                p = set.first;
                if (!p || p.length !== 1 || p[0] !== 'value') {
                    warn(bundle.parameter_set_a, t, i);
                }
                name.first = [get, set];
            } else {
                name = nexttoken;
                i = property_name();
                if (typeof i !== 'string') {
                    fail(bundle.missing_property);
                }
                advance(':');
                discard();
                spaces();
                name.first = expression(10);
            }
            this.first.push(name);
            if (seen[i] === true) {
                warn(bundle.duplicate_a, nexttoken, i);
            }
            seen[i] = true;
            tally_member(i);
            if (nexttoken.id !== ',') {
                break;
            }
            for (;;) {
                comma();
                if (nexttoken.id !== ',') {
                    break;
                }
                warn(bundle.unexpected_a, nexttoken);
            }
            if (nexttoken.id === '}' && !option.es5) {
                warn(bundle.unexpected_a, token);
            }
        }
        step_out('}', this);
        discard();
        return this;
    });

    stmt('{', function () {
        discard();
        warn(bundle.statement_block);
        this.arity = 'statement';
        this.block = statements();
        this.disrupt = this.block.disrupt;
        advance('}', this);
        discard();
        return this;
    });

    stmt('/*members', do_option);
    stmt('/*member', do_option);
    stmt('/*jslint', do_option);
    stmt('/*global', do_option);



    stmt('var', function () {

// JavaScript does not have block scope. It only has function scope. So,
// declaring a variable in a block can have unexpected consequences.

// var.first will contain an array, the array containing name tokens
// and assignment tokens.

        var assign, id, name;

        if (funct['(onevar)'] && option.onevar) {
            warn(bundle.combine_var);
        } else if (!funct['(global)']) {
            funct['(onevar)'] = true;
        }
        this.arity = 'statement';
        this.first = [];
        step_in('var');
        for (;;) {
            name = nexttoken;
            id = identifier();
            if (funct['(global)'] && predefined[id] === false) {
                warn(bundle.redefinition_a, token, id);
            }
            add_label(id, 'unused');

            if (nexttoken.id === '=') {
                assign = nexttoken;
                assign.first = name;
                spaces();
                advance('=');
                spaces();
                if (nexttoken.id === 'undefined') {
                    warn(bundle.unnecessary_initialize, token, id);
                }
                if (peek(0).id === '=' && nexttoken.identifier) {
                    fail(bundle.var_a_not);
                }
                assign.second = expression(0);
                assign.arity = 'infix';
                this.first.push(assign);
            } else {
                this.first.push(name);
            }
            if (nexttoken.id !== ',') {
                break;
            }
            comma();
            if (var_mode && nexttoken.line === token.line &&
                    this.first.length === 1) {
                var_mode = false;
                indent.open = false;
                indent.at -= option.indent;
            }
            spaces();
            edge();
        }
        var_mode = false;
        step_out();
        return this;
    });

    stmt('function', function () {
        one_space();
        if (in_block) {
            warn(bundle.function_block, token);
        }
        var i = identifier();
        if (i) {
            add_label(i, 'unction');
            no_space();
        }
        do_function(this, i, true);
        if (nexttoken.id === '(' && nexttoken.line === token.line) {
            fail(bundle.function_statement);
        }
        this.arity = 'statement';
        return this;
    });

    prefix('function', function () {
        one_space();
        var i = optional_identifier();
        if (i) {
            no_space();
        }
        do_function(this, i);
        if (funct['(loopage)']) {
            warn(bundle.function_loop);
        }
        this.arity = 'function';
        return this;
    });

    stmt('if', function () {
        var t = nexttoken;
        one_space();
        advance('(');
        step_in('control');
        discard();
        no_space();
        edge();
        this.arity = 'statement';
        this.first = expected_condition(expected_relation(expression(0)));
        no_space();
        step_out(')', t);
        discard();
        one_space();
        this.block = block(true);
        if (nexttoken.id === 'else') {
            one_space();
            advance('else');
            discard();
            one_space();
            this['else'] = nexttoken.id === 'if' || nexttoken.id === 'switch' ?
                statement(true) : block(true);
            if (this['else'].disrupt && this.block.disrupt) {
                this.disrupt = true;
            }
        }
        return this;
    });

    stmt('try', function () {

// try.first    The catch variable
// try.second   The catch clause
// try.third    The finally clause
// try.block    The try block

        var b, e, s, t;
        if (option.adsafe) {
            warn(bundle.adsafe_a, this);
        }
        one_space();
        this.arity = 'statement';
        this.block = block(false);
        if (nexttoken.id === 'catch') {
            one_space();
            advance('catch');
            one_space();
            t = nexttoken;
            advance('(');
            step_in('control');
            discard();
            no_space();
            edge();
            s = scope;
            scope = Object.create(s);
            e = nexttoken.value;
            this.first = e;
            if (!nexttoken.identifier) {
                warn(bundle.expected_identifier_a, nexttoken);
            } else {
                add_label(e, 'exception');
            }
            advance();
            no_space();
            step_out(')', t);
            discard();
            one_space();
            this.second = block(false);
            b = true;
            scope = s;
        }
        if (nexttoken.id === 'finally') {
            discard();
            one_space();
            t = nexttoken;
            advance('finally');
            discard();
            one_space();
            this.third = block(false);
        } else if (!b) {
            fail(bundle.expected_a_b, nexttoken, 'catch', nexttoken.value);
        }
        return this;
    });


    stmt('while', function () {
        one_space();
        var t = nexttoken;
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        step_in('control');
        discard();
        no_space();
        edge();
        this.arity = 'statement';
        this.first = expected_relation(expression(0));
        if (this.first.id !== 'true') {
            expected_condition(this.first, bundle.unexpected_a);
        }
        no_space();
        step_out(')', t);
        discard();
        one_space();
        this.block = block(true);
        if (this.block.disrupt) {
            warn(bundle.strange_loop, prevtoken);
        }
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });

    reserve('with');

    stmt('switch', function () {

// switch.first             the switch expression
// switch.second            the array of cases. A case is 'case' or 'default' token:
//    case.first            the array of case expressions
//    case.second           the array of statements
// If all of the arrays of statements are disrupt, then the switch is disrupt.

        var particular,
            the_case = nexttoken,
            unbroken = true;
        funct['(breakage)'] += 1;
        one_space();
        advance('(');
        discard();
        no_space();
        step_in();
        this.arity = 'statement';
        this.first = expected_condition(expected_relation(expression(0)));
        no_space();
        step_out(')', the_case);
        discard();
        one_space();
        advance('{');
        step_in();
        this.second = [];
        while (nexttoken.id === 'case') {
            the_case = nexttoken;
            the_case.first = [];
            spaces();
            edge('case');
            advance('case');
            for (;;) {
                one_space();
                particular = expression(0);
                the_case.first.push(particular);
                if (particular.id === 'NaN') {
                    warn(bundle.unexpected_a, particular);
                }
                no_space_only();
                advance(':');
                discard();
                if (nexttoken.id !== 'case') {
                    break;
                }
                spaces();
                edge('case');
                advance('case');
                discard();
            }
            spaces();
            the_case.second = statements();
            if (the_case.second && the_case.second.length > 0) {
                particular = the_case.second[the_case.second.length - 1];
                if (particular.disrupt) {
                    if (particular.id === 'break') {
                        unbroken = false;
                    }
                } else {
                    warn(bundle.missing_a_after_b, nexttoken, 'break', 'case');
                }
            } else {
                warn(bundle.empty_case);
            }
            this.second.push(the_case);
        }
        if (this.second.length === 0) {
            warn(bundle.missing_a, nexttoken, 'case');
        }
        if (nexttoken.id === 'default') {
            spaces();
            the_case = nexttoken;
            edge('case');
            advance('default');
            discard();
            no_space_only();
            advance(':');
            discard();
            spaces();
            the_case.second = statements();
            if (the_case.second && the_case.second.length > 0) {
                particular = the_case.second[the_case.second.length - 1];
                if (unbroken && particular.disrupt && particular.id !== 'break') {
                    this.disrupt = true;
                }
            }
            this.second.push(the_case);
        }
        funct['(breakage)'] -= 1;
        spaces();
        step_out('}', this);
        return this;
    });

    stmt('debugger', function () {
        if (!option.debug) {
            warn(bundle.unexpected_a, this);
        }
        this.arity = 'statement';
        return this;
    });

    stmt('do', function () {
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        one_space();
        this.arity = 'statement';
        this.block = block(true);
        if (this.block.disrupt) {
            warn(bundle.strange_loop, prevtoken);
        }
        one_space();
        advance('while');
        discard();
        var t = nexttoken;
        one_space();
        advance('(');
        step_in();
        discard();
        no_space();
        edge();
        this.first = expected_condition(expected_relation(expression(0)), bundle.unexpected_a);
        no_space();
        step_out(')', t);
        discard();
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });

    stmt('for', function () {
        var f = option.forin, i, s, t = nexttoken, v;
        this.arity = 'statement';
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        step_in('control');
        discard();
        spaces(this, t);
        no_space();
        if (nexttoken.id === 'var') {
            fail(bundle.move_var);
        }
        edge();
        if (peek(0).id === 'in') {
            v = nexttoken;
            switch (funct[v.value]) {
            case 'unused':
                funct[v.value] = 'var';
                break;
            case 'var':
                break;
            default:
                warn(bundle.bad_in_a, v);
            }
            advance();
            i = nexttoken;
            advance('in');
            i.first = v;
            i.second = expression(20);
            step_out(')', t);
            discard();
            this.first = i;
            s = block(true);
            if (!f && (s.length > 1 || typeof s[0] !== 'object' ||
                    s[0].value !== 'if')) {
                warn(bundle.for_if, this);
            }
        } else {
            if (nexttoken.id !== ';') {
                edge();
                this.first = [];
                for (;;) {
                    this.first.push(expression(0, 'for'));
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    comma();
                }
            }
            semicolon();
            if (nexttoken.id !== ';') {
                edge();
                this.second = expected_relation(expression(0));
                if (this.second.id !== 'true') {
                    expected_condition(this.second, bundle.unexpected_a);
                }
            }
            semicolon(token);
            if (nexttoken.id === ';') {
                fail(bundle.expected_a_b, nexttoken, ')', ';');
            }
            if (nexttoken.id !== ')') {
                this.third = [];
                edge();
                for (;;) {
                    this.third.push(expression(0, 'for'));
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    comma();
                }
            }
            no_space();
            step_out(')', t);
            discard();
            one_space();
            s = block(true);
        }
        if (s.disrupt) {
            warn(bundle.strange_loop, prevtoken);
        }
        this.block = s;
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });


    disrupt_stmt('break', function () {
        var v = nexttoken.value;
        this.arity = 'statement';
        if (funct['(breakage)'] === 0) {
            warn(bundle.unexpected_a, this);
        }
        if (nexttoken.identifier && token.line === nexttoken.line) {
            one_space_only();
            if (funct[v] !== 'label') {
                warn(bundle.not_a_label, nexttoken);
            } else if (scope[v] !== funct) {
                warn(bundle.not_a_scope, nexttoken);
            }
            this.first = nexttoken;
            advance();
        }
        return this;
    });


    disrupt_stmt('continue', function () {
        if (!option['continue']) {
            warn(bundle.unexpected_a, this);
        }
        var v = nexttoken.value;
        this.arity = 'statement';
        if (funct['(breakage)'] === 0) {
            warn(bundle.unexpected_a, this);
        }
        if (nexttoken.identifier && token.line === nexttoken.line) {
            one_space_only();
            if (funct[v] !== 'label') {
                warn(bundle.not_a_label, nexttoken);
            } else if (scope[v] !== funct) {
                warn(bundle.not_a_scope, nexttoken);
            }
            this.first = nexttoken;
            advance();
        }
        return this;
    });


    disrupt_stmt('return', function () {
        this.arity = 'statement';
        if (nexttoken.id !== ';' && nexttoken.line === token.line) {
            one_space_only();
            if (nexttoken.id === '/' || nexttoken.id === '(regexp)') {
                warn(bundle.wrap_regexp);
            }
            this.first = expression(20);
        }
        return this;
    });


    disrupt_stmt('throw', function () {
        this.arity = 'statement';
        one_space_only();
        this.first = expression(20);
        return this;
    });


//  Superfluous reserved words

    reserve('class');
    reserve('const');
    reserve('enum');
    reserve('export');
    reserve('extends');
    reserve('import');
    reserve('super');

// Harmony reserved words

    reserve('let');
    reserve('yield');
    reserve('implements');
    reserve('interface');
    reserve('package');
    reserve('private');
    reserve('protected');
    reserve('public');
    reserve('static');


// Parse JSON

    function json_value() {

        function json_object() {
            var o = {}, t = nexttoken;
            advance('{');
            if (nexttoken.id !== '}') {
                while (nexttoken.id !== '(end)') {
                    while (nexttoken.id === ',') {
                        warn(bundle.unexpected_a, nexttoken);
                        comma();
                    }
                    if (nexttoken.arity !== 'string') {
                        warn(bundle.expected_string_a);
                    }
                    if (o[nexttoken.value] === true) {
                        warn(bundle.duplicate_a);
                    } else if (nexttoken.value === '__proto__') {
                        warn(bundle.dangling_a);
                    } else {
                        o[nexttoken.value] = true;
                    }
                    advance();
                    advance(':');
                    json_value();
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    comma();
                    if (nexttoken.id === '}') {
                        warn(bundle.unexpected_a, token);
                        break;
                    }
                }
            }
            advance('}', t);
        }

        function json_array() {
            var t = nexttoken;
            advance('[');
            if (nexttoken.id !== ']') {
                while (nexttoken.id !== '(end)') {
                    while (nexttoken.id === ',') {
                        warn(bundle.unexpected_a, nexttoken);
                        comma();
                    }
                    json_value();
                    if (nexttoken.id !== ',') {
                        break;
                    }
                    comma();
                    if (nexttoken.id === ']') {
                        warn(bundle.unexpected_a, token);
                        break;
                    }
                }
            }
            advance(']', t);
        }

        switch (nexttoken.id) {
        case '{':
            json_object();
            break;
        case '[':
            json_array();
            break;
        case 'true':
        case 'false':
        case 'null':
        case '(number)':
        case '(string)':
            advance();
            break;
        case '-':
            advance('-');
            no_space_only();
            advance('(number)');
            break;
        default:
            fail(bundle.unexpected_a);
        }
    }


// CSS parsing.

    function css_name() {
        if (nexttoken.identifier) {
            advance();
            return true;
        }
    }


    function css_number() {
        if (nexttoken.id === '-') {
            advance('-');
            no_space_only();
        }
        if (nexttoken.arity === 'number') {
            advance('(number)');
            return true;
        }
    }


    function css_string() {
        if (nexttoken.arity === 'string') {
            advance();
            return true;
        }
    }

    function css_color() {
        var i, number, t, value;
        if (nexttoken.identifier) {
            value = nexttoken.value;
            if (value === 'rgb' || value === 'rgba') {
                advance();
                t = nexttoken;
                advance('(');
                for (i = 0; i < 3; i += 1) {
                    if (i) {
                        comma();
                    }
                    number = nexttoken.value;
                    if (nexttoken.arity !== 'number' || number < 0) {
                        warn(bundle.expected_positive_a, nexttoken);
                        advance();
                    } else {
                        advance();
                        if (nexttoken.id === '%') {
                            advance('%');
                            if (number > 100) {
                                warn(bundle.expected_percent_a, token, number);
                            }
                        } else {
                            if (number > 255) {
                                warn(bundle.expected_small_a, token, number);
                            }
                        }
                    }
                }
                if (value === 'rgba') {
                    comma();
                    number = +nexttoken.value;
                    if (nexttoken.arity !== 'number' || number < 0 || number > 1) {
                        warn(bundle.expected_fraction_a, nexttoken);
                    }
                    advance();
                    if (nexttoken.id === '%') {
                        warn(bundle.unexpected_a);
                        advance('%');
                    }
                }
                advance(')', t);
                return true;
            } else if (css_colorData[nexttoken.value] === true) {
                advance();
                return true;
            }
        } else if (nexttoken.id === '(color)') {
            advance();
            return true;
        }
        return false;
    }


    function css_length() {
        if (nexttoken.id === '-') {
            advance('-');
            no_space_only();
        }
        if (nexttoken.arity === 'number') {
            advance();
            if (nexttoken.arity !== 'string' &&
                    css_lengthData[nexttoken.value] === true) {
                no_space_only();
                advance();
            } else if (+token.value !== 0) {
                warn(bundle.expected_linear_a);
            }
            return true;
        }
        return false;
    }


    function css_line_height() {
        if (nexttoken.id === '-') {
            advance('-');
            no_space_only();
        }
        if (nexttoken.arity === 'number') {
            advance();
            if (nexttoken.arity !== 'string' &&
                    css_lengthData[nexttoken.value] === true) {
                no_space_only();
                advance();
            }
            return true;
        }
        return false;
    }


    function css_width() {
        if (nexttoken.identifier) {
            switch (nexttoken.value) {
            case 'thin':
            case 'medium':
            case 'thick':
                advance();
                return true;
            }
        } else {
            return css_length();
        }
    }


    function css_margin() {
        if (nexttoken.identifier) {
            if (nexttoken.value === 'auto') {
                advance();
                return true;
            }
        } else {
            return css_length();
        }
    }

    function css_attr() {
        if (nexttoken.identifier && nexttoken.value === 'attr') {
            advance();
            advance('(');
            if (!nexttoken.identifier) {
                warn(bundle.expected_name_a);
            }
            advance();
            advance(')');
            return true;
        }
        return false;
    }


    function css_comma_list() {
        while (nexttoken.id !== ';') {
            if (!css_name() && !css_string()) {
                warn(bundle.expected_name_a);
            }
            if (nexttoken.id !== ',') {
                return true;
            }
            comma();
        }
    }


    function css_counter() {
        if (nexttoken.identifier && nexttoken.value === 'counter') {
            advance();
            advance('(');
            advance();
            if (nexttoken.id === ',') {
                comma();
                if (nexttoken.arity !== 'string') {
                    warn(bundle.expected_string_a);
                }
                advance();
            }
            advance(')');
            return true;
        }
        if (nexttoken.identifier && nexttoken.value === 'counters') {
            advance();
            advance('(');
            if (!nexttoken.identifier) {
                warn(bundle.expected_name_a);
            }
            advance();
            if (nexttoken.id === ',') {
                comma();
                if (nexttoken.arity !== 'string') {
                    warn(bundle.expected_string_a);
                }
                advance();
            }
            if (nexttoken.id === ',') {
                comma();
                if (nexttoken.arity !== 'string') {
                    warn(bundle.expected_string_a);
                }
                advance();
            }
            advance(')');
            return true;
        }
        return false;
    }


    function css_shape() {
        var i;
        if (nexttoken.identifier && nexttoken.value === 'rect') {
            advance();
            advance('(');
            for (i = 0; i < 4; i += 1) {
                if (!css_length()) {
                    warn(bundle.expected_number_a);
                    break;
                }
            }
            advance(')');
            return true;
        }
        return false;
    }


    function css_url() {
        var c, url;
        if (nexttoken.identifier && nexttoken.value === 'url') {
            nexttoken = lex.range('(', ')');
            url = nexttoken.value;
            c = url.charAt(0);
            if (c === '"' || c === '\'') {
                if (url.slice(-1) !== c) {
                    warn(bundle.bad_url);
                } else {
                    url = url.slice(1, -1);
                    if (url.indexOf(c) >= 0) {
                        warn(bundle.bad_url);
                    }
                }
            }
            if (!url) {
                warn(bundle.missing_url);
            }
            if (option.safe && ux.test(url)) {
                fail(bundle.adsafe_a, nexttoken, url);
            }
            urls.push(url);
            advance();
            return true;
        }
        return false;
    }


    css_any = [css_url, function () {
        for (;;) {
            if (nexttoken.identifier) {
                switch (nexttoken.value.toLowerCase()) {
                case 'url':
                    css_url();
                    break;
                case 'expression':
                    warn(bundle.unexpected_a);
                    advance();
                    break;
                default:
                    advance();
                }
            } else {
                if (nexttoken.id === ';' || nexttoken.id === '!'  ||
                        nexttoken.id === '(end)' || nexttoken.id === '}') {
                    return true;
                }
                advance();
            }
        }
    }];


    css_border_style = [
        'none', 'dashed', 'dotted', 'double', 'groove',
        'hidden', 'inset', 'outset', 'ridge', 'solid'
    ];

    css_break = [
        'auto', 'always', 'avoid', 'left', 'right'
    ];

    css_media = {
        'all': true,
        'braille': true,
        'embossed': true,
        'handheld': true,
        'print': true,
        'projection': true,
        'screen': true,
        'speech': true,
        'tty': true,
        'tv': true
    };

    css_overflow = [
        'auto', 'hidden', 'scroll', 'visible'
    ];

    css_attribute_data = {
        background: [
            true, 'background-attachment', 'background-color',
            'background-image', 'background-position', 'background-repeat'
        ],
        'background-attachment': ['scroll', 'fixed'],
        'background-color': ['transparent', css_color],
        'background-image': ['none', css_url],
        'background-position': [
            2, [css_length, 'top', 'bottom', 'left', 'right', 'center']
        ],
        'background-repeat': [
            'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
        ],
        'border': [true, 'border-color', 'border-style', 'border-width'],
        'border-bottom': [
            true, 'border-bottom-color', 'border-bottom-style',
            'border-bottom-width'
        ],
        'border-bottom-color': css_color,
        'border-bottom-style': css_border_style,
        'border-bottom-width': css_width,
        'border-collapse': ['collapse', 'separate'],
        'border-color': ['transparent', 4, css_color],
        'border-left': [
            true, 'border-left-color', 'border-left-style', 'border-left-width'
        ],
        'border-left-color': css_color,
        'border-left-style': css_border_style,
        'border-left-width': css_width,
        'border-right': [
            true, 'border-right-color', 'border-right-style',
            'border-right-width'
        ],
        'border-right-color': css_color,
        'border-right-style': css_border_style,
        'border-right-width': css_width,
        'border-spacing': [2, css_length],
        'border-style': [4, css_border_style],
        'border-top': [
            true, 'border-top-color', 'border-top-style', 'border-top-width'
        ],
        'border-top-color': css_color,
        'border-top-style': css_border_style,
        'border-top-width': css_width,
        'border-width': [4, css_width],
        bottom: [css_length, 'auto'],
        'caption-side' : ['bottom', 'left', 'right', 'top'],
        clear: ['both', 'left', 'none', 'right'],
        clip: [css_shape, 'auto'],
        color: css_color,
        content: [
            'open-quote', 'close-quote', 'no-open-quote', 'no-close-quote',
            css_string, css_url, css_counter, css_attr
        ],
        'counter-increment': [
            css_name, 'none'
        ],
        'counter-reset': [
            css_name, 'none'
        ],
        cursor: [
            css_url, 'auto', 'crosshair', 'default', 'e-resize', 'help', 'move',
            'n-resize', 'ne-resize', 'nw-resize', 'pointer', 's-resize',
            'se-resize', 'sw-resize', 'w-resize', 'text', 'wait'
        ],
        direction: ['ltr', 'rtl'],
        display: [
            'block', 'compact', 'inline', 'inline-block', 'inline-table',
            'list-item', 'marker', 'none', 'run-in', 'table', 'table-caption',
            'table-cell', 'table-column', 'table-column-group',
            'table-footer-group', 'table-header-group', 'table-row',
            'table-row-group'
        ],
        'empty-cells': ['show', 'hide'],
        'float': ['left', 'none', 'right'],
        font: [
            'caption', 'icon', 'menu', 'message-box', 'small-caption',
            'status-bar', true, 'font-size', 'font-style', 'font-weight',
            'font-family'
        ],
        'font-family': css_comma_list,
        'font-size': [
            'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large',
            'xx-large', 'larger', 'smaller', css_length
        ],
        'font-size-adjust': ['none', css_number],
        'font-stretch': [
            'normal', 'wider', 'narrower', 'ultra-condensed',
            'extra-condensed', 'condensed', 'semi-condensed',
            'semi-expanded', 'expanded', 'extra-expanded'
        ],
        'font-style': [
            'normal', 'italic', 'oblique'
        ],
        'font-variant': [
            'normal', 'small-caps'
        ],
        'font-weight': [
            'normal', 'bold', 'bolder', 'lighter', css_number
        ],
        height: [css_length, 'auto'],
        left: [css_length, 'auto'],
        'letter-spacing': ['normal', css_length],
        'line-height': ['normal', css_line_height],
        'list-style': [
            true, 'list-style-image', 'list-style-position', 'list-style-type'
        ],
        'list-style-image': ['none', css_url],
        'list-style-position': ['inside', 'outside'],
        'list-style-type': [
            'circle', 'disc', 'square', 'decimal', 'decimal-leading-zero',
            'lower-roman', 'upper-roman', 'lower-greek', 'lower-alpha',
            'lower-latin', 'upper-alpha', 'upper-latin', 'hebrew', 'katakana',
            'hiragana-iroha', 'katakana-oroha', 'none'
        ],
        margin: [4, css_margin],
        'margin-bottom': css_margin,
        'margin-left': css_margin,
        'margin-right': css_margin,
        'margin-top': css_margin,
        'marker-offset': [css_length, 'auto'],
        'max-height': [css_length, 'none'],
        'max-width': [css_length, 'none'],
        'min-height': css_length,
        'min-width': css_length,
        opacity: css_number,
        outline: [true, 'outline-color', 'outline-style', 'outline-width'],
        'outline-color': ['invert', css_color],
        'outline-style': [
            'dashed', 'dotted', 'double', 'groove', 'inset', 'none',
            'outset', 'ridge', 'solid'
        ],
        'outline-width': css_width,
        overflow: css_overflow,
        'overflow-x': css_overflow,
        'overflow-y': css_overflow,
        padding: [4, css_length],
        'padding-bottom': css_length,
        'padding-left': css_length,
        'padding-right': css_length,
        'padding-top': css_length,
        'page-break-after': css_break,
        'page-break-before': css_break,
        position: ['absolute', 'fixed', 'relative', 'static'],
        quotes: [8, css_string],
        right: [css_length, 'auto'],
        'table-layout': ['auto', 'fixed'],
        'text-align': ['center', 'justify', 'left', 'right'],
        'text-decoration': [
            'none', 'underline', 'overline', 'line-through', 'blink'
        ],
        'text-indent': css_length,
        'text-shadow': ['none', 4, [css_color, css_length]],
        'text-transform': ['capitalize', 'uppercase', 'lowercase', 'none'],
        top: [css_length, 'auto'],
        'unicode-bidi': ['normal', 'embed', 'bidi-override'],
        'vertical-align': [
            'baseline', 'bottom', 'sub', 'super', 'top', 'text-top', 'middle',
            'text-bottom', css_length
        ],
        visibility: ['visible', 'hidden', 'collapse'],
        'white-space': [
            'normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'inherit'
        ],
        width: [css_length, 'auto'],
        'word-spacing': ['normal', css_length],
        'word-wrap': ['break-word', 'normal'],
        'z-index': ['auto', css_number]
    };

    function style_attribute() {
        var v;
        while (nexttoken.id === '*' || nexttoken.id === '#' ||
                nexttoken.value === '_') {
            if (!option.css) {
                warn(bundle.unexpected_a);
            }
            advance();
        }
        if (nexttoken.id === '-') {
            if (!option.css) {
                warn(bundle.unexpected_a);
            }
            advance('-');
            if (!nexttoken.identifier) {
                warn(bundle.expected_nonstandard_style_attribute);
            }
            advance();
            return css_any;
        } else {
            if (!nexttoken.identifier) {
                warn(bundle.expected_style_attribute);
            } else {
                if (is_own(css_attribute_data, nexttoken.value)) {
                    v = css_attribute_data[nexttoken.value];
                } else {
                    v = css_any;
                    if (!option.css) {
                        warn(bundle.unrecognized_style_attribute_a);
                    }
                }
            }
            advance();
            return v;
        }
    }


    function style_value(v) {
        var i = 0,
            n,
            once,
            match,
            round,
            start = 0,
            vi;
        switch (typeof v) {
        case 'function':
            return v();
        case 'string':
            if (nexttoken.identifier && nexttoken.value === v) {
                advance();
                return true;
            }
            return false;
        }
        for (;;) {
            if (i >= v.length) {
                return false;
            }
            vi = v[i];
            i += 1;
            if (vi === true) {
                break;
            } else if (typeof vi === 'number') {
                n = vi;
                vi = v[i];
                i += 1;
            } else {
                n = 1;
            }
            match = false;
            while (n > 0) {
                if (style_value(vi)) {
                    match = true;
                    n -= 1;
                } else {
                    break;
                }
            }
            if (match) {
                return true;
            }
        }
        start = i;
        once = [];
        for (;;) {
            round = false;
            for (i = start; i < v.length; i += 1) {
                if (!once[i]) {
                    if (style_value(css_attribute_data[v[i]])) {
                        match = true;
                        round = true;
                        once[i] = true;
                        break;
                    }
                }
            }
            if (!round) {
                return match;
            }
        }
    }

    function style_child() {
        if (nexttoken.arity === 'number') {
            advance();
            if (nexttoken.value === 'n' && nexttoken.identifier) {
                no_space_only();
                advance();
                if (nexttoken.id === '+') {
                    no_space_only();
                    advance('+');
                    no_space_only();
                    advance('(number)');
                }
            }
            return;
        } else {
            if (nexttoken.identifier &&
                    (nexttoken.value === 'odd' || nexttoken.value === 'even')) {
                advance();
                return;
            }
        }
        warn(bundle.unexpected_a);
    }

    function substyle() {
        var v;
        for (;;) {
            if (nexttoken.id === '}' || nexttoken.id === '(end)' ||
                    (xquote && nexttoken.id === xquote)) {
                return;
            }
            while (nexttoken.id === ';') {
                warn(bundle.unexpected_a);
                semicolon();
            }
            v = style_attribute();
            advance(':');
            if (nexttoken.identifier && nexttoken.value === 'inherit') {
                advance();
            } else {
                if (!style_value(v)) {
                    warn(bundle.unexpected_a);
                    advance();
                }
            }
            if (nexttoken.id === '!') {
                advance('!');
                no_space_only();
                if (nexttoken.identifier && nexttoken.value === 'important') {
                    advance();
                } else {
                    warn(bundle.expected_a_b,
                        nexttoken, 'important', nexttoken.value);
                }
            }
            if (nexttoken.id === '}' || nexttoken.id === xquote) {
                warn(bundle.expected_a_b, nexttoken, ';', nexttoken.value);
            } else {
                semicolon();
            }
        }
    }

    function style_selector() {
        if (nexttoken.identifier) {
            if (!is_own(html_tag, option.cap ?
                    nexttoken.value.toLowerCase() : nexttoken.value)) {
                warn(bundle.expected_tagname_a);
            }
            advance();
        } else {
            switch (nexttoken.id) {
            case '>':
            case '+':
                advance();
                style_selector();
                break;
            case ':':
                advance(':');
                switch (nexttoken.value) {
                case 'active':
                case 'after':
                case 'before':
                case 'checked':
                case 'disabled':
                case 'empty':
                case 'enabled':
                case 'first-child':
                case 'first-letter':
                case 'first-line':
                case 'first-of-type':
                case 'focus':
                case 'hover':
                case 'last-child':
                case 'last-of-type':
                case 'link':
                case 'only-of-type':
                case 'root':
                case 'target':
                case 'visited':
                    advance();
                    break;
                case 'lang':
                    advance();
                    advance('(');
                    if (!nexttoken.identifier) {
                        warn(bundle.expected_lang_a);
                    }
                    advance(')');
                    break;
                case 'nth-child':
                case 'nth-last-child':
                case 'nth-last-of-type':
                case 'nth-of-type':
                    advance();
                    advance('(');
                    style_child();
                    advance(')');
                    break;
                case 'not':
                    advance();
                    advance('(');
                    if (nexttoken.id === ':' && peek(0).value === 'not') {
                        warn(bundle.not);
                    }
                    style_selector();
                    advance(')');
                    break;
                default:
                    warn(bundle.expected_pseudo_a);
                }
                break;
            case '#':
                advance('#');
                if (!nexttoken.identifier) {
                    warn(bundle.expected_id_a);
                }
                advance();
                break;
            case '*':
                advance('*');
                break;
            case '.':
                advance('.');
                if (!nexttoken.identifier) {
                    warn(bundle.expected_class_a);
                }
                advance();
                break;
            case '[':
                advance('[');
                if (!nexttoken.identifier) {
                    warn(bundle.expected_attribute_a);
                }
                advance();
                if (nexttoken.id === '=' || nexttoken.value === '~=' ||
                        nexttoken.value === '$=' ||
                        nexttoken.value === '|=' ||
                        nexttoken.id === '*=' ||
                        nexttoken.id === '^=') {
                    advance();
                    if (nexttoken.arity !== 'string') {
                        warn(bundle.expected_string_a);
                    }
                    advance();
                }
                advance(']');
                break;
            default:
                fail(bundle.expected_selector_a);
            }
        }
    }

    function style_pattern() {
        if (nexttoken.id === '{') {
            warn(bundle.expected_style_pattern);
        }
        for (;;) {
            style_selector();
            if (nexttoken.id === '</' || nexttoken.id === '{' ||
                    nexttoken.id === '(end)') {
                return '';
            }
            if (nexttoken.id === ',') {
                comma();
            }
        }
    }

    function style_list() {
        while (nexttoken.id !== '</' && nexttoken.id !== '(end)') {
            style_pattern();
            xmode = 'styleproperty';
            if (nexttoken.id === ';') {
                semicolon();
            } else {
                advance('{');
                substyle();
                xmode = 'style';
                advance('}');
            }
        }
    }

    function styles() {
        var i;
        while (nexttoken.id === '@') {
            i = peek();
            advance('@');
            if (nexttoken.identifier) {
                switch (nexttoken.value) {
                case 'import':
                    advance();
                    if (!css_url()) {
                        warn(bundle.expected_a_b,
                            nexttoken, 'url', nexttoken.value);
                        advance();
                    }
                    semicolon();
                    break;
                case 'media':
                    advance();
                    for (;;) {
                        if (!nexttoken.identifier || css_media[nexttoken.value] === true) {
                            fail(bundle.expected_media_a);
                        }
                        advance();
                        if (nexttoken.id !== ',') {
                            break;
                        }
                        comma();
                    }
                    advance('{');
                    style_list();
                    advance('}');
                    break;
                default:
                    warn(bundle.expected_at_a);
                }
            } else {
                warn(bundle.expected_at_a);
            }
        }
        style_list();
    }


// Parse HTML

    function do_begin(n) {
        if (n !== 'html' && !option.fragment) {
            if (n === 'div' && option.adsafe) {
                fail(bundle.adsafe_fragment);
            } else {
                fail(bundle.expected_a_b, token, 'html', n);
            }
        }
        if (option.adsafe) {
            if (n === 'html') {
                fail(bundle.adsafe_html, token);
            }
            if (option.fragment) {
                if (n !== 'div') {
                    fail(bundle.adsafe_div, token);
                }
            } else {
                fail(bundle.adsafe_fragment, token);
            }
        }
        option.browser = true;
        assume();
    }

    function do_attribute(n, a, v) {
        var u, x;
        if (a === 'id') {
            u = typeof v === 'string' ? v.toUpperCase() : '';
            if (ids[u] === true) {
                warn(bundle.duplicate_a, nexttoken, v);
            }
            if (!/^[A-Za-z][A-Za-z0-9._:\-]*$/.test(v)) {
                warn(bundle.bad_id_a, nexttoken, v);
            } else if (option.adsafe) {
                if (adsafe_id) {
                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {
                        warn(bundle.adsafe_prefix_a, nexttoken, adsafe_id);
                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {
                        warn(bundle.adsafe_bad_id);
                    }
                } else {
                    adsafe_id = v;
                    if (!/^[A-Z]+_$/.test(v)) {
                        warn(bundle.adsafe_bad_id);
                    }
                }
            }
            x = v.search(dx);
            if (x >= 0) {
                warn(bundle.unexpected_char_a_b, token, v.charAt(x), a);
            }
            ids[u] = true;
        } else if (a === 'class' || a === 'type' || a === 'name') {
            x = v.search(qx);
            if (x >= 0) {
                warn(bundle.unexpected_char_a_b, token, v.charAt(x), a);
            }
            ids[u] = true;
        } else if (a === 'href' || a === 'background' ||
                a === 'content' || a === 'data' ||
                a.indexOf('src') >= 0 || a.indexOf('url') >= 0) {
            if (option.safe && ux.test(v)) {
                fail(bundle.bad_url, nexttoken, v);
            }
            urls.push(v);
        } else if (a === 'for') {
            if (option.adsafe) {
                if (adsafe_id) {
                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {
                        warn(bundle.adsafe_prefix_a, nexttoken, adsafe_id);
                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {
                        warn(bundle.adsafe_bad_id);
                    }
                } else {
                    warn(bundle.adsafe_bad_id);
                }
            }
        } else if (a === 'name') {
            if (option.adsafe && v.indexOf('_') >= 0) {
                warn(bundle.adsafe_name_a, nexttoken, v);
            }
        }
    }

    function do_tag(n, a) {
        var i, t = html_tag[n], x;
        src = false;
        if (!t) {
            fail(
                bundle.unrecognized_tag_a,
                nexttoken,
                n === n.toLowerCase() ? n : n + ' (capitalization error)'
            );
        }
        if (stack.length > 0) {
            if (n === 'html') {
                fail(bundle.unexpected_a, token, n);
            }
            x = t.parent;
            if (x) {
                if (x.indexOf(' ' + stack[stack.length - 1].name + ' ') < 0) {
                    fail(bundle.tag_a_in_b, token, n, x);
                }
            } else if (!option.adsafe && !option.fragment) {
                i = stack.length;
                do {
                    if (i <= 0) {
                        fail(bundle.tag_a_in_b, token, n, 'body');
                    }
                    i -= 1;
                } while (stack[i].name !== 'body');
            }
        }
        switch (n) {
        case 'div':
            if (option.adsafe && stack.length === 1 && !adsafe_id) {
                warn(bundle.adsafe_missing_id);
            }
            break;
        case 'script':
            xmode = 'script';
            advance('>');
            if (a.lang) {
                warn(bundle.lang, token);
            }
            if (option.adsafe && stack.length !== 1) {
                warn(bundle.adsafe_placement, token);
            }
            if (a.src) {
                if (option.adsafe && (!adsafe_may || !approved[a.src])) {
                    warn(bundle.adsafe_source, token);
                }
                if (a.type) {
                    warn(bundle.type, token);
                }
            } else {
                if (adsafe_went) {
                    fail(bundle.adsafe_script, token);
                }
                step_in(nexttoken.from);
                edge();
                use_strict();
                statements('script');
                indent = null;
            }
            xmode = 'html';
            advance('</');
            if (!nexttoken.identifier && nexttoken.value !== 'script') {
                warn(bundle.expected_a_b, nexttoken, 'script', nexttoken.value);
            }
            advance();
            xmode = 'outer';
            break;
        case 'style':
            xmode = 'style';
            advance('>');
            styles();
            xmode = 'html';
            advance('</');
            if (!nexttoken.identifier && nexttoken.value !== 'style') {
                warn(bundle.expected_a_b, nexttoken, 'style', nexttoken.value);
            }
            advance();
            xmode = 'outer';
            break;
        case 'input':
            switch (a.type) {
            case 'radio':
            case 'checkbox':
            case 'button':
            case 'reset':
            case 'submit':
                break;
            case 'text':
            case 'file':
            case 'password':
            case 'file':
            case 'hidden':
            case 'image':
                if (option.adsafe && a.autocomplete !== 'off') {
                    warn(bundle.adsafe_autocomplete);
                }
                break;
            default:
                warn(bundle.bad_type);
            }
            break;
        case 'applet':
        case 'body':
        case 'embed':
        case 'frame':
        case 'frameset':
        case 'head':
        case 'iframe':
        case 'noembed':
        case 'noframes':
        case 'object':
        case 'param':
            if (option.adsafe) {
                warn(bundle.adsafe_tag, nexttoken, n);
            }
            break;
        }
    }


    function closetag(n) {
        return '</' + n + '>';
    }

    function html() {
        var a, attributes, e, n, q, t, v, w = option.white, wmode;
        xmode = 'html';
        xquote = '';
        stack = null;
        for (;;) {
            switch (nexttoken.value) {
            case '<':
                xmode = 'html';
                advance('<');
                attributes = {};
                t = nexttoken;
                if (!t.identifier) {
                    warn(bundle.bad_name_a, t);
                }
                n = t.value;
                if (option.cap) {
                    n = n.toLowerCase();
                }
                t.name = n;
                advance();
                if (!stack) {
                    stack = [];
                    do_begin(n);
                }
                v = html_tag[n];
                if (typeof v !== 'object') {
                    fail(bundle.unrecognized_tag_a, t, n);
                }
                e = v.empty;
                t.type = n;
                for (;;) {
                    if (nexttoken.id === '/') {
                        advance('/');
                        if (nexttoken.id !== '>') {
                            warn(bundle.expected_a_b, nexttoken, '>', nexttoken.value);
                        }
                        break;
                    }
                    if (nexttoken.id && nexttoken.id.substr(0, 1) === '>') {
                        break;
                    }
                    if (!nexttoken.identifier) {
                        if (nexttoken.id === '(end)' || nexttoken.id === '(error)') {
                            warn(bundle.expected_a_b, nexttoken, '>', nexttoken.value);
                        }
                        warn(bundle.bad_name_a);
                    }
                    option.white = true;
                    spaces();
                    a = nexttoken.value;
                    option.white = w;
                    advance();
                    if (!option.cap && a !== a.toLowerCase()) {
                        warn(bundle.attribute_case_a, token);
                    }
                    a = a.toLowerCase();
                    xquote = '';
                    if (is_own(attributes, a)) {
                        warn(bundle.duplicate_a, token, a);
                    }
                    if (a.slice(0, 2) === 'on') {
                        if (!option.on) {
                            warn(bundle.html_handlers);
                        }
                        xmode = 'scriptstring';
                        advance('=');
                        q = nexttoken.id;
                        if (q !== '"' && q !== '\'') {
                            fail(bundle.expected_a_b, nexttoken, '"', nexttoken.value);
                        }
                        xquote = q;
                        wmode = option.white;
                        option.white = false;
                        advance(q);
                        use_strict();
                        statements('on');
                        option.white = wmode;
                        if (nexttoken.id !== q) {
                            fail(bundle.expected_a_b, nexttoken, q, nexttoken.value);
                        }
                        xmode = 'html';
                        xquote = '';
                        advance(q);
                        v = false;
                    } else if (a === 'style') {
                        xmode = 'scriptstring';
                        advance('=');
                        q = nexttoken.id;
                        if (q !== '"' && q !== '\'') {
                            fail(bundle.expected_a_b, nexttoken, '"', nexttoken.value);
                        }
                        xmode = 'styleproperty';
                        xquote = q;
                        advance(q);
                        substyle();
                        xmode = 'html';
                        xquote = '';
                        advance(q);
                        v = false;
                    } else {
                        if (nexttoken.id === '=') {
                            advance('=');
                            v = nexttoken.value;
                            if (!nexttoken.identifier &&
                                    nexttoken.id !== '"' &&
                                    nexttoken.id !== '\'' &&
                                    nexttoken.arity !== 'string' &&
                                    nexttoken.arity !== 'number' &&
                                    nexttoken.id !== '(color)') {
                                warn(bundle.expected_attribute_value_a, token, a);
                            }
                            advance();
                        } else {
                            v = true;
                        }
                    }
                    attributes[a] = v;
                    do_attribute(n, a, v);
                }
                do_tag(n, attributes);
                if (!e) {
                    stack.push(t);
                }
                xmode = 'outer';
                advance('>');
                break;
            case '</':
                xmode = 'html';
                advance('</');
                if (!nexttoken.identifier) {
                    warn(bundle.bad_name_a);
                }
                n = nexttoken.value;
                if (option.cap) {
                    n = n.toLowerCase();
                }
                advance();
                if (!stack) {
                    fail(bundle.unexpected_a, nexttoken, closetag(n));
                }
                t = stack.pop();
                if (!t) {
                    fail(bundle.unexpected_a, nexttoken, closetag(n));
                }
                if (t.name !== n) {
                    fail(bundle.expected_a_b,
                        nexttoken, closetag(t.name), closetag(n));
                }
                if (nexttoken.id !== '>') {
                    fail(bundle.expected_a_b, nexttoken, '>', nexttoken.value);
                }
                xmode = 'outer';
                advance('>');
                break;
            case '<!':
                if (option.safe) {
                    warn(bundle.adsafe_a);
                }
                xmode = 'html';
                for (;;) {
                    advance();
                    if (nexttoken.id === '>' || nexttoken.id === '(end)') {
                        break;
                    }
                    if (nexttoken.value.indexOf('--') >= 0) {
                        fail(bundle.unexpected_a, nexttoken, '--');
                    }
                    if (nexttoken.value.indexOf('<') >= 0) {
                        fail(bundle.unexpected_a, nexttoken, '<');
                    }
                    if (nexttoken.value.indexOf('>') >= 0) {
                        fail(bundle.unexpected_a, nexttoken, '>');
                    }
                }
                xmode = 'outer';
                advance('>');
                break;
            case '(end)':
                return;
            default:
                if (nexttoken.id === '(end)') {
                    fail(bundle.missing_a, nexttoken,
                        '</' + stack[stack.length - 1].value + '>');
                } else {
                    advance();
                }
            }
            if (stack && stack.length === 0 && (option.adsafe ||
                    !option.fragment || nexttoken.id === '(end)')) {
                break;
            }
        }
        if (nexttoken.id !== '(end)') {
            fail(bundle.unexpected_a);
        }
    }


// The actual JSLINT function itself.

    var itself = function (the_source, the_option) {
        var i, keys, predef;
        JSLINT.errors = [];
        JSLINT.tree = '';
        predefined = Object.create(standard);
        if (the_option) {
            option = Object.create(the_option);
            predef = option.predef;
            if (predef) {
                if (Array.isArray(predef)) {
                    for (i = 0; i < predef.length; i += 1) {
                        predefined[predef[i]] = true;
                    }
                } else if (typeof predef === 'object') {
                    keys = Object.keys(predef);
                    for (i = 0; i < keys.length; i += 1) {
                        predefined[keys[i]] = !!predef[keys];
                    }
                }
            }
            if (option.adsafe) {
                option.safe = true;
            }
            if (option.safe) {
                option.browser     =
                    option.css     =
                    option.debug   =
                    option.devel   =
                    option.evil    =
                    option.forin   =
                    option.on      =
                    option.rhino   =
                    option.windows =
                    option.sub     =
                    option.widget  = false;

                option.nomen       =
                    option.safe    =
                    option.undef   = true;

                predefined.Date         =
                    predefined['eval']  =
                    predefined.Function =
                    predefined.Object   = null;

                predefined.ADSAFE  =
                    predefined.lib = false;
            }
        } else {
            option = {};
        }
        if (option.indent) {
            option.indent = +option.indent;
        }
        option.maxerr = option.maxerr || 50;
        adsafe_id = '';
        adsafe_may = false;
        adsafe_went = false;
        approved = {};
        if (option.approved) {
            for (i = 0; i < option.approved.length; i += 1) {
                approved[option.approved[i]] = option.approved[i];
            }
        } else {
            approved.test = 'test';
        }
        tab = '';
        for (i = 0; i < option.indent; i += 1) {
            tab += ' ';
        }
        global = Object.create(predefined);
        scope = global;
        funct = {
            '(global)': true,
            '(name)': '(global)',
            '(scope)': scope,
            '(breakage)': 0,
            '(loopage)': 0
        };
        functions = [funct];

        comments_off = false;
        ids = {};
        implied = {};
        in_block = false;
        indent = false;
        json_mode = false;
        lookahead = [];
        member = {};
        members_only = null;
        prereg = true;
        src = false;
        stack = null;
        strict_mode = false;
        urls = [];
        var_mode = false;
        warnings = 0;
        xmode = false;
        lex.init(the_source);

        prevtoken = token = nexttoken = syntax['(begin)'];
        assume();

        try {
            advance();
            if (nexttoken.arity === 'number') {
                fail(bundle.unexpected_a);
            } else if (nexttoken.value.charAt(0) === '<') {
                html();
                if (option.adsafe && !adsafe_went) {
                    warn(bundle.adsafe_go, this);
                }
            } else {
                switch (nexttoken.id) {
                case '{':
                case '[':
                    json_mode = true;
                    json_value();
                    break;
                case '@':
                case '*':
                case '#':
                case '.':
                case ':':
                    xmode = 'style';
                    advance();
                    if (token.id !== '@' || !nexttoken.identifier ||
                            nexttoken.value !== 'charset' || token.line !== 1 ||
                            token.from !== 1) {
                        fail(bundle.css);
                    }
                    advance();
                    if (nexttoken.arity !== 'string' &&
                            nexttoken.value !== 'UTF-8') {
                        fail(bundle.css);
                    }
                    advance();
                    semicolon();
                    styles();
                    break;

                default:
                    if (option.adsafe && option.fragment) {
                        fail(bundle.expected_a_b,
                            nexttoken, '<div>', nexttoken.value);
                    }

// If the first token is predef semicolon, ignore it. This is sometimes used when
// files are intended to be appended to files that may be sloppy. predef sloppy
// file may be depending on semicolon insertion on its last line.

                    step_in(1);
                    if (nexttoken.id === ';') {
                        semicolon();
                    }
                    if (nexttoken.value === 'use strict') {
                        warn(bundle.function_strict);
                        use_strict();
                    }
                    JSLINT.tree = statements('lib');
                    if (JSLINT.tree.disrupt) {
                        warn(bundle.weird_program, prevtoken);
                    }
                }
            }
            indent = null;
            advance('(end)');
        } catch (e) {
            if (e) {        // `~
                JSLINT.errors.push({
                    reason    : e.message,
                    line      : e.line || nexttoken.line,
                    character : e.character || nexttoken.from
                }, null);
            }
        }
        return JSLINT.errors.length === 0;
    };


// Data summary.

    itself.data = function () {
        var data = {functions: []},
            function_data,
            globals,
            i,
            implieds = [],
            j,
            members = [],
            name,
            the_function,
            unused = [],
            variable;
        if (itself.errors.length) {
            data.errors = itself.errors;
        }

        if (json_mode) {
            data.json = true;
        }

        for (name in implied) {
            if (is_own(implied, name)) {
                implieds.push({
                    name: name,
                    line: implied[name]
                });
            }
        }
        if (implieds.length > 0) {
            data.implieds = implieds;
        }

        if (urls.length > 0) {
            data.urls = urls;
        }

        globals = Object.keys(scope);
        if (globals.length > 0) {
            data.globals = globals;
        }

        for (i = 1; i < functions.length; i += 1) {
            the_function = functions[i];
            function_data = {};
            for (j = 0; j < functionicity.length; j += 1) {
                function_data[functionicity[j]] = [];
            }
            for (name in the_function) {
                if (is_own(the_function, name) && name.charAt(0) !== '(') {
                    variable = the_function[name];
                    if (variable === 'unction') {
                        variable = 'unused';
                    }
                    if (Array.isArray(function_data[variable])) {
                        function_data[variable].push(name);
                        if (variable === 'unused') {
                            unused.push({
                                name: name,
                                line: the_function['(line)'],
                                'function': the_function['(name)']
                            });
                        }
                    }
                }
            }
            for (j = 0; j < functionicity.length; j += 1) {
                if (function_data[functionicity[j]].length === 0) {
                    delete function_data[functionicity[j]];
                }
            }
            function_data.name = the_function['(name)'];
            function_data.param = the_function['(params)'];
            function_data.line = the_function['(line)'];
            data.functions.push(function_data);
        }

        if (unused.length > 0) {
            data.unused = unused;
        }

        members = [];
        for (name in member) {
            if (typeof member[name] === 'number') {
                data.member = member;
                break;
            }
        }

        return data;
    };

    itself.report = function (option) {
        var data = itself.data();

        var err, evidence, i, j, key, keys, length, mem = '', name, names,
            output = [], snippets, the_function, warning;

        function detail(h, array) {
            var comma_needed, i, singularity;
            if (array) {
                output.push('<div><i>' + h + '</i> ');
                array = array.sort();
                for (i = 0; i < array.length; i += 1) {
                    if (array[i] !== singularity) {
                        singularity = array[i];
                        output.push((comma_needed ? ', ' : '') + singularity);
                        comma_needed = true;
                    }
                }
                output.push('</div>');
            }
        }

        if (data.errors || data.implieds || data.unused) {
            err = true;
            output.push('<div id=errors><i>Error:</i>');
            if (data.errors) {
                for (i = 0; i < data.errors.length; i += 1) {
                    warning = data.errors[i];
                    if (warning) {
                        evidence = warning.evidence || '';
                        output.push('<p>Problem' + (isFinite(warning.line) ? ' at line ' +
                            warning.line + ' character ' + warning.character : '') +
                            ': ' + warning.reason.entityify() +
                            '</p><p class=evidence>' +
                            (evidence && (evidence.length > 80 ? evidence.slice(0, 77) + '...' :
                            evidence).entityify()) + '</p>');
                    }
                }
            }

            if (data.implieds) {
                snippets = [];
                for (i = 0; i < data.implieds.length; i += 1) {
                    snippets[i] = '<code>' + data.implieds[i].name + '</code>&nbsp;<i>' +
                        data.implieds[i].line + '</i>';
                }
                output.push('<p><i>Implied global:</i> ' + snippets.join(', ') + '</p>');
            }

            if (data.unused) {
                snippets = [];
                for (i = 0; i < data.unused.length; i += 1) {
                    snippets[i] = '<code><u>' + data.unused[i].name + '</u></code>&nbsp;<i>' +
                        data.unused[i].line + ' </i> <small>' +
                        data.unused[i]['function'] + '</small>';
                }
                output.push('<p><i>Unused variable:</i> ' + snippets.join(', ') + '</p>');
            }
            if (data.json) {
                output.push('<p>JSON: bad.</p>');
            }
            output.push('</div>');
        }

        if (!option) {

            output.push('<br><div id=functions>');

            if (data.urls) {
                detail("URLs<br>", data.urls, '<br>');
            }

            if (xmode === 'style') {
                output.push('<p>CSS.</p>');
            } else if (data.json && !err) {
                output.push('<p>JSON: good.</p>');
            } else if (data.globals) {
                output.push('<div><i>Global</i> ' +
                    data.globals.sort().join(', ') + '</div>');
            } else {
                output.push('<div><i>No new global variables introduced.</i></div>');
            }

            for (i = 0; i < data.functions.length; i += 1) {
                the_function = data.functions[i];
                names = [];
                if (the_function.param) {
                    for (j = 0; j < the_function.param.length; j += 1) {
                        names[j] = the_function.param[j].value;
                    }
                }
                output.push('<br><div class=function><i>' + the_function.line + '</i> ' +
                    (the_function.name || '') + '(' + names.join(', ') + ')</div>');
                detail('<big><b>Unused</b></big>', the_function.unused);
                detail('Closure', the_function.closure);
                detail('Variable', the_function['var']);
                detail('Exception', the_function.exception);
                detail('Outer', the_function.outer);
                detail('Global', the_function.global);
                detail('Label', the_function.label);
            }

            if (data.member) {
                keys = Object.keys(data.member);
                if (keys.length) {
                    keys = keys.sort();
                    mem = '<br><pre id=members>/*members ';
                    length = 10;
                    for (i = 0; i < keys.length; i += 1) {
                        key = keys[i];
                        name = key.name();
                        if (length + name.length > 72) {
                            output.push(mem + '<br>');
                            mem = '    ';
                            length = 1;
                        }
                        length += name.length + 2;
                        if (data.member[key] === 1) {
                            name = '<i>' + name + '</i>';
                        }
                        if (i < keys.length - 1) {
                            name += ', ';
                        }
                        mem += name;
                    }
                    output.push(mem + '<br>*/</pre>');
                }
                output.push('</div>');
            }
        }
        return output.join('');
    };
    itself.jslint = itself;

    itself.edition = '2011-02-15';

    return itself;

}());// adsafe.js
// 2011-02-06

//    Public Domain.

//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//    SUBJECT TO CHANGE WITHOUT NOTICE.

//    Original url: http://www.ADsafe.org/adsafe.js

// This file implements the core ADSAFE runtime. A site may add additional
// methods understanding that those methods will be made available to guest
// code.

// This code should be minified before deployment.
// See http://javascript.crockford.com/jsmin.html

// USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
// NOT CONTROL.

/*global window*/

/*jslint browser: true, devel: true, nomen: false, strict: true */

/*members "", "#", "&", "*", "+", ".", "\/", ":blur", ":checked",
    ":disabled", ":enabled", ":even", ":focus", ":hidden", ":odd", ":tag",
    ":text", ":trim", ":unchecked", ":visible", ">", "[", "[!=", "[$=",
    "[*=", "[=", "[^=", "[|=", "[~=", _, "___ on ___", "___adsafe root___",
    ___nodes___, ___star___, "_adsafe mark_", _intercept, a, abbr, acronym,
    addEventListener, address, altKey, append, appendChild, apply, area,
    arguments, autocomplete, b, bdo, big, blockquote, blur, br, bubble,
    button, call, callee, caller, cancelBubble, canvas, caption, center,
    change, charAt, charCode, check, checked, childNodes, cite, class,
    className, clientX, clientY, clone, cloneNode, code, col, colgroup,
    combine, concat, console, constructor, count, create,
    createDocumentFragment, createElement, createRange, createTextNode,
    createTextRange, cssFloat, ctrlKey, currentStyle, dd, defaultView, del,
    dfn, dir, disabled, div, dl, dt, each, em, empty, enable, ephemeral,
    eval, exec, expand, explode, fieldset, fire, firstChild, focus, font,
    form, fragment, fromCharCode, get, getCheck, getChecks, getClass,
    getClasses, getComputedStyle, getElementById, getElementsByTagName,
    getMark, getMarks, getName, getNames, getOffsetHeight, getOffsetHeights,
    getOffsetWidth, getOffsetWidths, getParent, getSelection, getStyle,
    getStyles, getTagName, getTagNames, getTitle, getTitles, getValue,
    getValues, go, h1, h2, h3, h4, h5, h6, hasOwnProperty, hr, i, id, img,
    inRange, indexOf, input, ins, insertBefore, isArray, kbd, key, keyCode,
    klass, label, later, legend, length, li, lib, log, map, mark, menu,
    message, name, nextSibling, nodeName, nodeValue, object, off,
    offsetHeight, offsetWidth, ol, on, onclick, ondblclick, onfocusin,
    onfocusout, onkeypress, onmousedown, onmousemove, onmouseout,
    onmouseover, onmouseup, op, optgroup, option, p, parent, parentNode,
    postError, pre, prepend, preventDefault, protect, prototype, push, q,
    remove, removeChild, removeElement, replace, replaceChild, returnValue,
    row, samp, select, selection, selectionEnd, selectionStart, set,
    shiftKey, slice, small, span, srcElement, stack, stopPropagation,
    strong, style, styleFloat, sub, sup, table, tag, tagName, target, tbody,
    td, test, text, textarea, tfoot, th, that, thead, title, toLowerCase,
    toString, toUpperCase, tr, tt, type, u, ul, unwatch, value, valueOf,
    var, visibility, watch, window, writeln, x, y
*/

var ADSAFE = (function () {
    "use strict";

    var adsafe_id,      // The id of the current widget
        adsafe_lib,     // The script libraries loaded by the current widget

// These member names are banned from guest scripts. The ADSAFE.get and
// ADSAFE.put methods will not allow access to these properties.

        banned = {
            'arguments'     : true,
            callee          : true,
            caller          : true,
            constructor     : true,
            'eval'          : true,
            prototype       : true,
            stack            : true,
            unwatch         : true,
            valueOf         : true,
            watch           : true
        },

        cache_style_object,
        cache_style_node,
        defaultView = document.defaultView,
        ephemeral,
        flipflop,       // Used in :even/:odd processing
        has_focus,
        hunter,         // Set of hunter patterns
        interceptors = [],

        makeableTagName = {

// This is the whitelist of elements that may be created with the .tag(tagName)
// method.

            a         : true,
            abbr      : true,
            acronym   : true,
            address   : true,
            area      : true,
            b         : true,
            bdo       : true,
            big       : true,
            blockquote: true,
            br        : true,
            button    : true,
            canvas    : true,
            caption   : true,
            center    : true,
            cite      : true,
            code      : true,
            col       : true,
            colgroup  : true,
            dd        : true,
            del       : true,
            dfn       : true,
            dir       : true,
            div       : true,
            dl        : true,
            dt        : true,
            em        : true,
            fieldset  : true,
            font      : true,
            form      : true,
            h1        : true,
            h2        : true,
            h3        : true,
            h4        : true,
            h5        : true,
            h6        : true,
            hr        : true,
            i         : true,
            img       : true,
            input     : true,
            ins       : true,
            kbd       : true,
            label     : true,
            legend    : true,
            li        : true,
            map       : true,
            menu      : true,
            object    : true,
            ol        : true,
            optgroup  : true,
            option    : true,
            p         : true,
            pre       : true,
            q         : true,
            samp      : true,
            select    : true,
            small     : true,
            span      : true,
            strong    : true,
            sub       : true,
            sup       : true,
            table     : true,
            tbody     : true,
            td        : true,
            textarea  : true,
            tfoot     : true,
            th        : true,
            thead     : true,
            tr        : true,
            tt        : true,
            u         : true,
            ul        : true,
            'var'     : true
        },
        name,
        pecker,     // set of pecker patterns
        result,
        star,
        the_range,
        value;


//  The error function is called if there is a violation or confusion.
//  It throws an exception.

    function error(message) {
        ADSAFE.log("ADsafe error: " + (message || "ADsafe violation."));
        throw {
            name: "ADsafe",
            message: message || "ADsafe violation."
        };
    }


//    Some of JavaScript's implicit string conversions can grant extraordinary
//    powers to untrusted code. So we use the string_check function to prevent
//  such abuses.

    function string_check(string) {
        if (typeof string !== 'string') {
            error("ADsafe string violation.");
        }
        return string;
    }


//    The object.hasOwnProperty method has a number of hazards. So we wrap it in
//    the owns function.

    function owns(object, string) {
        return object && typeof object === 'object' &&
            Object.prototype.hasOwnProperty.call(object, string_check(string));
    }


//  Firefox implemented some of its array methods carelessly. If a method is
//  called as a function it returns the global object. ADsafe cannot tolerate
//  that, so we wrap the methods to make them safer and slower.

    (function mozilla(name) {
        var method = Array.prototype[name];
        Array.prototype[name] = function () {
            return !this || this.window ? error() : method.apply(this, arguments);
        };
        return mozilla;
    }
    ('concat')
    ('every')
    ('filter')
    ('forEach')
    ('map')
    ('reduce')
    ('reduceRight')
    ('reverse')
    ('slice')
    ('some')
    ('sort'));


//  The reject functions enforce the restriction on property names.
//  reject_property allows access only to objects and arrays. It does not allow
//  use of the banned names, or names that are not strings or positive numbers,
//  or strings that start or end with _ or strings that start with -.

    function reject_name(name) {
        return banned[name] ||
            ((typeof name !== 'number' || name < 0) &&
            (typeof name !== 'string'  || name.charAt(0) === '_' ||
                name.slice(-1) === '_'     || name.charAt(0) === '-'));
    }


    function reject_property(object, name) {
        return typeof object !== 'object'  || reject_name(name);
    }


    function reject_global(that) {
        if (that.window) {
            error();
        }
    }


    function getStyleObject(node) {

// The getStyleObject function returns the computed style object for a node.

        if (node === cache_style_node) {
            return cache_style_object;
        }
        cache_style_node = node;
        cache_style_object =
            node.currentStyle || defaultView.getComputedStyle(node, '');
        return cache_style_object;
    }


    function walkTheDOM(node, func, skip) {

// Recursively traverse the DOM tree, starting with the node, in document
// source order, calling the func on each node visisted.

        if (!skip) {
            func(node);
        }
        node = node.firstChild;
        while (node) {
            walkTheDOM(node, func);
            node = node.nextSibling;
        }
    }


    function purge_event_handlers(node) {

// We attach all event handlers to an '___ on ___' property. The property name
// contains spaces to insure that there is no collision with HTML attribues.
// Keeping the handlers in a single property makes it easy to remove them
// all at once. Removal is required to avoid memory leakage on IE6 and IE7.

        walkTheDOM(node, function (node) {
            if (node.tagName) {
                node['___ on ___'] = node.change = null;
            }
        });
    }


    function parse_query(text, id) {

// Convert a query string into an array of op/name/value selectors.
// A query string is a sequence of triples wrapped in brackets; or names,
// possibly prefixed by # . & > _, or :option, or * or /. A triple is a name,
// and operator (one of [=, [!=, [*=, [~=, [|=, [$=, or [^=) and a value.

// If the id parameter is supplied, then the name following # must have the
// id as a prefix and must match the ADsafe rule for id: being all uppercase
// letters and digits with one underbar.

// A name must be all lower case and may contain digits, -, or _.

        var match,          // A match array
            query = [],     // The resulting query array
            selector,
            qx = id ?
                /^\s*(?:([\*\/])|\[\s*([a-z][0-9a-z_\-]*)\s*(?:([!*~|$\^]?\=)\s*([0-9A-Za-z_\-*%&;.\/:!]+)\s*)?\]|#\s*([A-Z]+_[A-Z0-9]+)|:\s*([a-z]+)|([.&_>\+]?)\s*([a-z][0-9a-z\-]*))\s*/ :
                /^\s*(?:([\*\/])|\[\s*([a-z][0-9a-z_\-]*)\s*(?:([!*~|$\^]?\=)\s*([0-9A-Za-z_\-*%&;.\/:!]+)\s*)?\]|#\s*([\-A-Za-z0-9_]+)|:\s*([a-z]+)|([.&_>\+]?)\s*([a-z][0-9a-z\-]*))\s*/;

// Loop over all of the selectors in the text.

        do {

// The qx teases the components of one selector out of the text, ignoring
// whitespace.

//          match[0]  the whole selector
//          match[1]  * /
//          match[2]  attribute name
//          match[3]  = != *= ~= |= $= ^=
//          match[4]  attribute value
//          match[5]  # id
//          match[6]  : option
//          match[7]  . & _ > +
//          match[8]      name

            match = qx.exec(string_check(text));
            if (!match) {
                error("ADsafe: Bad query:" + text);
            }

// Make a selector object and stuff it in the query.

            if (match[1]) {

// The selector is * or /

                selector = {
                    op: match[1]
                };
            } else if (match[2]) {

// The selector is in brackets.

                selector = match[3] ? {
                    op: '[' + match[3],
                    name: match[2],
                    value: match[4]
                } : {
                    op: '[',
                    name: match[2]
                };
            } else if (match[5]) {

// The selector is an id.

                if (query.length > 0 || match[5].length <= id.length ||
                        match[5].slice(0, id.length) !== id) {
                    error("ADsafe: Bad query: " + text);
                }
                selector = {
                    op: '#',
                    name: match[5]
                };

// The selector is a colon.

            } else if (match[6]) {
                selector = {
                    op: ':' + match[6]
                };

// The selector is one of > + . & _ or a naked tag name

            } else {
                selector = {
                    op: match[7],
                    name: match[8]
                };
            }

// Add the selector to the query.

            query.push(selector);

// Remove the selector from the text. If there is more text, have another go.

            text = text.slice(match[0].length);
        } while (text);
        return query;
    }


    hunter = {

// These functions implement the hunter behaviors.

        '': function (node) {
            var e = node.getElementsByTagName(name), i;
            for (i = 0; i < 1000; i += 1) {
                if (e[i]) {
                    result.push(e[i]);
                } else {
                    break;
                }
            }
        },
        '+': function (node) {
            node = node.nextSibling;
            name = name.toUpperCase();
            while (node && !node.tagName) {
                node = node.nextSibling;
            }
            if (node && node.tagName === name) {
                result.push(node);
            }
        },
        '>': function (node) {
            node = node.firstChild;
            name = name.toUpperCase();
            while (node) {
                if (node.tagName === name) {
                    result.push(node);
                }
                node = node.nextSibling;
            }
        },
        '#': function (node) {
            var n = document.getElementById(name);
            if (n.tagName) {
                result.push(n);
            }
        },
        '/': function (node) {
            var e = node.childNodes, i;
            for (i = 0; i < e.length; i += 1) {
                result.push(e[i]);
            }
        },
        '*': function (node) {
            star = true;
            walkTheDOM(node, function (node) {
                result.push(node);
            }, true);
        }
    };

    pecker = {
        '.': function (node) {
            return (' ' + node.className + ' ').indexOf(' ' + name + ' ') >= 0;
        },
        '&': function (node) {
            return node.name === name;
        },
        '_': function (node) {
            return node.type === name;
        },
        '[': function (node) {
            return typeof node[name] === 'string';
        },
        '[=': function (node) {
            var member = node[name];
            return typeof member === 'string' && member === value;
        },
        '[!=': function (node) {
            var member = node[name];
            return typeof member === 'string' && member !== value;
        },
        '[^=': function (node) {
            var member = node[name];
            return typeof member === 'string' &&
                member.slice(0, member.length) === value;
        },
        '[$=': function (node) {
            var member = node[name];
            return typeof member === 'string' &&
                member.slice(-member.length) === value;
        },
        '[*=': function (node) {
            var member = node[name];
            return typeof member === 'string' &&
                member.indexOf(value) >= 0;
        },
        '[~=': function (node) {
            var member = node[name];
            return typeof member === 'string' &&
                (' ' + member + ' ').indexOf(' ' + value + ' ') >= 0;
        },
        '[|=': function (node) {
            var member = node[name];
            return typeof member === 'string' &&
                ('-' + member + '-').indexOf('-' + value + '-') >= 0;
        },
        ':blur': function (node) {
            return node !== has_focus;
        },
        ':checked': function (node) {
            return node.checked;
        },
        ':disabled': function (node) {
            return node.tagName && node.disabled;
        },
        ':enabled': function (node) {
            return node.tagName && !node.disabled;
        },
        ':even': function (node) {
            var f;
            if (node.tagName) {
                f = flipflop;
                flipflop = !flipflop;
                return f;
            } else {
                return false;
            }
        },
        ':focus': function (node) {
            return node === has_focus;
        },
        ':hidden': function (node) {
            return node.tagName && getStyleObject(node).visibility !== 'visible';
        },
        ':odd': function (node) {
            if (node.tagName) {
                flipflop = !flipflop;
                return flipflop;
            } else {
                return false;
            }
        },
        ':tag': function (node) {
            return node.tagName;
        },
        ':text': function (node) {
            return node.nodeName === '#text';
        },
        ':trim': function (node) {
            return node.nodeName !== '#text' || /\W/.test(node.nodeValue);
        },
        ':unchecked': function (node) {
            return node.tagName && !node.checked;
        },
        ':visible': function (node) {
            return node.tagName && getStyleObject(node).visibility === 'visible';
        }
    };


    function quest(query, nodes) {
        var selector, func, i, j;

// Step through each selector.

        for (i = 0; i < query.length; i += 1) {
            selector = query[i];
            name = selector.name;
            func = hunter[selector.op];

// There are two kinds of selectors: hunters and peckers. If this is a hunter,
// loop through the the nodes, passing each node to the hunter function.
// Accumulate all the nodes it finds.

            if (typeof func === 'function') {
                if (star) {
                    error("ADsafe: Query violation: *" + selector.op +
                        (selector.name || ''));
                }
                result = [];
                for (j = 0; j < nodes.length; j += 1) {
                    func(nodes[j]);
                }
            } else {

// If this is a pecker, get its function. There is a special case for
// the :first and :rest selectors because they are so simple.

                value = selector.value;
                flipflop = false;
                func = pecker[selector.op];
                if (typeof func !== 'function') {
                    switch (selector.op) {
                    case ':first':
                        result = nodes.slice(0, 1);
                        break;
                    case ':rest':
                        result = nodes.slice(1);
                        break;
                    default:
                        error('ADsafe: Query violation: :' + selector.op);
                    }
                } else {

// For the other selectors, make an array of nodes that are filtered by
// the pecker function.

                    result = [];
                    for (j = 0; j < nodes.length; j += 1) {
                        if (func(nodes[j])) {
                            result.push(nodes[j]);
                        }
                    }
                }
            }
            nodes = result;
        }
        return result;
    }


    function make_root(root, id) {

        if (id) {
            if (root.tagName !== 'DIV') {
                error('ADsafe: Bad node.');
            }
        } else {
            if (root.tagName !== 'BODY') {
                error('ADsafe: Bad node.');
            }
        }

// A Bunch is a container that holds zero or more dom nodes.
// It has many useful methods.

        function Bunch(nodes) {
            this.___nodes___ = nodes;
            this.___star___ = star && nodes.length > 1;
            star = false;
        }

        var allow_focus = true,
            dom,
            dom_event = function (e) {
                var key,
                    target,
                    that,
                    the_event,
                    the_target,
                    the_actual_event = e || event,
                    type = the_actual_event.type;

// Get the target node and wrap it in a bunch.

                the_target = the_actual_event.target || the_actual_event.srcElement;
                target = new Bunch([the_target]);
                that = target;

// Use the PPK hack to make focus bubbly on IE.
// When a widget has focus, it can use the focus method.

                switch (type) {
                case 'mousedown':
                    allow_focus = true;
                    if (document.selection) {
                        the_range = document.selection.createRange();
                    }
                    break;
                case 'focus':
                case 'focusin':
                    allow_focus = true;
                    has_focus = the_target;
                    the_actual_event.cancelBubble = false;
                    type = 'focus';
                    break;
                case 'blur':
                case 'focusout':
                    allow_focus = false;
                    has_focus = null;
                    type = 'blur';
                    break;
                case 'keypress':
                    allow_focus = true;
                    has_focus = the_target;
                    key = String.fromCharCode(the_actual_event.charCode ||
                        the_actual_event.keyCode);
                    switch (key) {
                    case '\u000d':
                    case '\u000a':
                        type = 'enterkey';
                        break;
                    case '\u001b':
                        type = 'escapekey';
                        break;
                    }
                    break;

// This is a workaround for Safari.

                case 'click':
                    allow_focus = true;
                    break;
                }
                if (the_actual_event.cancelBubble &&
                        the_actual_event.stopPropagation) {
                    the_actual_event.stopPropagation();
                }

// Make the event object.

                the_event = {
                    altKey: the_actual_event.altKey,
                    ctrlKey: the_actual_event.ctrlKey,
                    bubble: function () {

// Bubble up. Get the parent of that node. It becomes the new that.
// getParent throws when bubbling is not possible.

                        try {
                            var parent = that.getParent(),
                                b = parent.___nodes___[0];
                            that = parent;
                            the_event.that = that;

// If that node has an event handler, fire it. Otherwise, bubble up.

                            if (b['___ on ___'] &&
                                    b['___ on ___'][type]) {
                                that.fire(the_event);
                            } else {
                                the_event.bubble();
                            }
                        } catch (e) {
                            error(e);
                        }
                    },
                    key: key,
                    preventDefault: function () {
                        if (the_actual_event.preventDefault) {
                            the_actual_event.preventDefault();
                        }
                        the_actual_event.returnValue = false;
                    },
                    shiftKey: the_actual_event.shiftKey,
                    target: target,
                    that: that,
                    type: type,
                    x: the_actual_event.clientX,
                    y: the_actual_event.clientY
                };

// If the target has event handlers, then fire them. Otherwise, bubble up.

                if (the_target['___ on ___'] &&
                        the_target['___ on ___'][the_event.type]) {
                    target.fire(the_event);
                } else {
                    for (;;) {
                        the_target = the_target.parentNode;
                        if (!the_target) {
                            break;
                        }
                        if (the_target['___ on ___'] &&
                                the_target['___ on ___'][the_event.type]) {
                            that = new Bunch([the_target]);
                            the_event.that = that;
                            that.fire(the_event);
                            break;
                        }
                        if (the_target['___adsafe root___']) {
                            break;
                        }
                    }
                }
                if (the_event.type === 'escapekey') {
                    if (ephemeral) {
                        ephemeral.remove();
                    }
                    ephemeral = null;
                }
                that = the_target = the_event = the_actual_event = null;
                return;
            };

// Mark the node as a root. This prevents event bubbling from propogating
// past it.

        root['___adsafe root___'] = '___adsafe root___';

        Bunch.prototype = {
            append: function (appendage) {
                reject_global(this);
                var b = this.___nodes___,
                    flag = false,
                    i,
                    j,
                    node,
                    rep;
                if (b.length === 0 || !appendage) {
                    return this;
                }
                if (appendage instanceof Array) {
                    if (appendage.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        rep = appendage[i].___nodes___;
                        for (j = 0; j < rep.length; j += 1) {
                            b[i].appendChild(rep[j]);
                        }
                    }
                } else {
                    rep = appendage.___nodes___;
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        for (j = 0; j < rep.length; j += 1) {
                            node.appendChild(
                                flag ?
                                    rep[j].cloneNode(true) :
                                    rep[j]
                            );
                        }
                        flag = true;
                    }
                }
                return this;
            },
            blur: function () {
                reject_global(this);
                var b = this.___nodes___, i, node;
                has_focus = null;
                for (i = 0; i < b.length; i += 1) {
                    node = b[i];
                    if (node.blur) {
                        node.blur();
                    }
                }
                return this;
            },
            check: function (value) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.checked = !!value[i];
                        }
                    }
                } else {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.checked = !!value;
                        }
                    }
                }
                return this;
            },
            'class': function (value) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        if (/url/i.test(string_check(value[i]))) {
                            error('ADsafe error.');
                        }
                        node = b[i];
                        if (node.tagName) {
                            node.className = value[i];
                        }
                    }
                } else {
                    if (/url/i.test(string_check(value))) {
                        error('ADsafe error.');
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.className = value;
                        }
                    }
                }
                return this;
            },
            count: function () {
                reject_global(this);
                return this.___nodes___.length;
            },
            each: function (func) {
                reject_global(this);
                var b = this.___nodes___, i;
                if (typeof func === 'function') {
                    for (i = 0; i < b.length; i += 1) {
                        func(new Bunch([b[i]]));
                    }
                    return this;
                }
                error();
            },
            empty: function () {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        while (node.firstChild) {
                            purge_event_handlers(node);
                            node.removeChild(node.firstChild);
                        }
                    }
                } else {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        while (node.firstChild) {
                            purge_event_handlers(node);
                            node.removeChild(node.firstChild);
                        }
                    }
                }
                return this;
            },
            enable: function (enable) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (enable instanceof Array) {
                    if (enable.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            enable.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.disabled = !enable[i];
                        }
                    }
                } else {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.disabled = !enable;
                        }
                    }
                }
                return this;
            },
            ephemeral: function () {
                reject_global(this);
                if (ephemeral) {
                    ephemeral.remove();
                }
                ephemeral = this;
                return this;
            },
            explode: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = new Bunch([b[i]]);
                }
                return a;
            },
            fire: function (event) {

    // Fire an event on an object. The event can be either
    // a string containing the name of the event, or an
    // object containing a type property containing the
    // name of the event. Handlers registered by the 'on'
    // method that match the event name will be invoked.

                reject_global(this);
                var array,
                    b,
                    i,
                    j,
                    n,
                    node,
                    on,
                    type;

                if (typeof event === 'string') {
                    type = event;
                    event = {type: type};
                } else if (typeof event === 'object') {
                    type = event.type;
                } else {
                    error();
                }
                b = this.___nodes___;
                n = b.length;
                for (i = 0; i < n; i += 1) {
                    node = b[i];
                    on = node['___ on ___'];

    // If an array of handlers exist for this event, then
    // loop through it and execute the handlers in order.

                    if (owns(on, type)) {
                        array = on[type];
                        for (j = 0; j < array.length; j += 1) {

    // Invoke a handler. Pass the event object.

                            array[j].call(this, event);
                        }
                    }
                }
                return this;
            },
            focus: function () {
                reject_global(this);
                var b = this.___nodes___;
                if (b.length === 1 && allow_focus) {
                    has_focus = b[0].focus();
                    return this;
                }
                error();
            },
            fragment: function () {
                reject_global(this);
                return new Bunch([document.createDocumentFragment()]);
            },
            getCheck: function () {
                return this.getChecks()[0];
            },
            getChecks: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].checked;
                }
                return a;
            },
            getClass: function () {
                return this.getClasses()[0];
            },
            getClasses: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].className;
                }
                return a;
            },
            getMark: function () {
                return this.getMarks()[0];
            },
            getMarks: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i]['_adsafe mark_'];
                }
                return a;
            },
            getName: function () {
                return this.getNames()[0];
            },
            getNames: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].name;
                }
                return a;
            },
            getOffsetHeight: function () {
                return this.getOffsetHeights()[0];
            },
            getOffsetHeights: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].offsetHeight;
                }
                return a;
            },
            getOffsetWidth: function () {
                return this.getOffsetWidths()[0];
            },
            getOffsetWidths: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].offsetWidth;
                }
                return a;
            },
            getParent: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i, n;
                for (i = 0; i < b.length; i += 1) {
                    n = b[i].parentNode;
                    if (n['___adsafe root___']) {
                        error('ADsafe parent violation.');
                    }
                    a[i] = n;
                }
                return new Bunch(a);
            },
            getSelection: function () {
                reject_global(this);
                var b = this.___nodes___, end, node, start, range;
                if (b.length === 1 && allow_focus) {
                    node = b[0];
                    if (typeof node.selectionStart === 'number') {
                        start = node.selectionStart;
                        end = node.selectionEnd;
                        return node.value.slice(start, end);
                    } else {
                        range = node.createTextRange();
                        range.expand('textedit');
                        if (range.inRange(the_range)) {
                            return the_range.text;
                        }
                    }
                }
                return null;
            },
            getStyle: function (name) {
                return this.getStyles(name)[0];
            },
            getStyles: function (name) {
                reject_global(this);
                if (reject_name(name)) {
                    error("ADsafe style violation.");
                }
                var a = [], b = this.___nodes___, i, node, s;
                for (i = 0; i < b.length; i += 1) {
                    node = b[i];
                    if (node.tagName) {
                        s = name !== 'float' ? getStyleObject(node)[name] :
                            getStyleObject(node).cssFloat ||
                            getStyleObject(node).styleFloat;
                        if (typeof s === 'string') {
                            a[i] = s;
                        }
                    }
                }
                return a;
            },
            getTagName: function () {
                return this.getTagNames()[0];
            },
            getTagNames: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i, name;
                for (i = 0; i < b.length; i += 1) {
                    name = b[i].tagName;
                    a[i] = typeof name === 'string' ? name.toLowerCase() : name;
                }
                return a;
            },
            getTitle: function () {
                return this.getTitles()[0];
            },
            getTitles: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    a[i] = b[i].title;
                }
                return a;
            },
            getValue: function () {
                return this.getValues()[0];
            },
            getValues: function () {
                reject_global(this);
                var a = [], b = this.___nodes___, i, node;
                for (i = 0; i < b.length; i += 1) {
                    node = b[i];
                    if (node.nodeName === '#text') {
                        a[i] = node.nodeValue;
                    } else if (node.tagName && node.type !== 'password') {
                        a[i] = node.value;
                        if (a[i] === undefined && node.firstChild &&
                                node.firstChild.nodeName === '#text') {
                            a[i] = node.firstChild.nodeValue;
                        }
                    }
                }
                return a;
            },
            klass: function (value) {
                return this['class'](value);
            },
            mark: function (value) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length + '-' +
                            value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node['_adsafe mark_'] = String(value[i]);
                        }
                    }
                } else {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node['_adsafe mark_'] = String(value);
                        }
                    }
                }
                return this;
            },
            off: function (type) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                for (i = 0; i < b.length; i += 1) {
                    node = b[i];
                    if (typeof type === 'string') {
                        if (typeof node['___ on ___']) {
                            node['___ on ___'][type] = null;
                        }
                    } else {
                        node['___ on ___'] = null;
                    }
                }
                return this;
            },
            on: function (type, func) {
                reject_global(this);
                if (typeof type !== 'string' || typeof func !== 'function') {
                    error();
                }

                var b = this.___nodes___, i, node, on, ontype;
                for (i = 0; i < b.length; i += 1) {
                    node = b[i];

// The change event does not propogate, so we must put the handler on the
// instance.

                    if (type === 'change') {
                        ontype = 'on' + type;
                        if (node[ontype] !== dom_event) {
                            node[ontype] = dom_event;
                        }
                    }

// Register an event. Put the function in a handler array, making one if it
// doesn't yet exist for this type on this node.

                    on = node['___ on ___'];
                    if (!on) {
                        on = {};
                        node['___ on ___'] = on;
                    }
                    if (owns(on, type)) {
                        on[type].push(func);
                    } else {
                        on[type] = [func];
                    }
                }
                return this;
            },
            protect: function () {
                reject_global(this);
                var b = this.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    b[i]['___adsafe root___'] = '___adsafe root___';
                }
                return this;
            },
            q: function (text) {
                reject_global(this);
                star = this.___star___;
                return new Bunch(quest(parse_query(string_check(text), id),
                    this.___nodes___));
            },
            remove: function () {
                reject_global(this);
                this.replace();
            },
            replace: function (replacement) {
                reject_global(this);
                var b = this.___nodes___,
                    flag = false,
                    i,
                    j,
                    newnode,
                    node,
                    parent,
                    rep;
                if (b.length === 0) {
                    return;
                }
                for (i = 0; i < b.length; i += 1) {
                    purge_event_handlers(b[i]);
                }
                if (!replacement || replacement.length === 0 ||
                        (replacement.___nodes___ &&
                        replacement.___nodes___.length === 0)) {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        purge_event_handlers(node);
                        if (node.parentNode) {
                            node.parentNode.removeChild(node);
                        }
                    }
                } else if (replacement instanceof Array) {
                    if (replacement.length !== b.length) {
                        error('ADsafe: Array length: ' +
                            b.length + '-' + value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        parent = node.parentNode;
                        purge_event_handlers(node);
                        if (parent) {
                            rep = replacement[i].___nodes___;
                            if (rep.length > 0) {
                                newnode = rep[0];
                                parent.replaceChild(newnode, node);
                                for (j = 1; j < rep.length; j += 1) {
                                    node = newnode;
                                    newnode = rep[j];
                                    parent.insertBefore(newnode, node.nextSibling);
                                }
                            } else {
                                parent.removeChild(node);
                            }
                        }
                    }
                } else {
                    rep = replacement.___nodes___;
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        purge_event_handlers(node);
                        parent = node.parentNode;
                        if (parent) {
                            newnode = flag ? rep[0].cloneNode(true) : rep[0];
                            parent.replaceChild(newnode, node);
                            for (j = 1; j < rep.length; j += 1) {
                                node = newnode;
                                newnode = flag ? rep[j].clone(true) : rep[j];
                                parent.insertBefore(newnode, node.nextSibling);
                            }
                            flag = true;
                        }
                    }
                }
                return this;
            },
            select: function () {
                reject_global(this);
                var b = this.___nodes___;
                if (b.length !== 1 || !allow_focus) {
                    error();
                }
                b[0].focus();
                b[0].select();
                return this;
            },
            selection: function (string) {
                reject_global(this);
                string_check(string);
                var b = this.___nodes___, end, node, old, start, range;
                if (b.length === 1 && allow_focus) {
                    node = b[0];
                    if (typeof node.selectionStart === 'number') {
                        start = node.selectionStart;
                        end = node.selectionEnd;
                        old = node.value;
                        node.value = old.slice(0, start) + string + old.slice(end);
                        node.selectionStart = node.selectionEnd = start +
                            string.length;
                        node.focus();
                    } else {
                        range = node.createTextRange();
                        range.expand('textedit');
                        if (range.inRange(the_range)) {
                            the_range.select();
                            the_range.text = string;
                            the_range.select();
                        }
                    }
                }
                return this;
            },
            style: function (name, value) {
                reject_global(this);
                if (reject_name(name)) {
                    error("ADsafe style violation.");
                }
                if (value === undefined || /url/i.test(string_check(value))) {
                    error();
                }
                var b = this.___nodes___,
                    i,
                    node,
                    v;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' +
                            b.length + '-' + value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        v = string_check(value[i]);
                        if (/url/i.test(v)) {
                            error();
                        }
                        if (node.tagName) {
                            if (name !== 'float') {
                                node.style[name] = v;
                            } else {
                                node.style.cssFloat = node.style.styleFloat = v;
                            }
                        }
                    }
                } else {
                    v = string_check(value);
                    if (/url/i.test(v)) {
                        error();
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            if (name !== 'float') {
                                node.style[name] = v;
                            } else {
                                node.style.cssFloat = node.style.styleFloat = v;
                            }
                        }
                    }
                }
                return this;
            },
            tag: function (tag, type, name) {
                reject_global(this);
                var node;
                if (typeof tag !== 'string') {
                    error();
                }
                if (makeableTagName[tag] !== true) {
                    error('ADsafe: Bad tag: ' + tag);
                }
                node = document.createElement(tag);
                if (name) {
                    node.autocomplete = 'off';
                    node.name = string_check(name);
                }
                if (type) {
                    node.type = string_check(type);
                }
                return new Bunch([node]);
            },
            text: function (text) {
                reject_global(this);
                var a, i;
                if (text instanceof Array) {
                    a = [];
                    for (i = 0; i < text.length; i += 1) {
                        a[i] = document.createTextNode(string_check(text[i]));
                    }
                    return new Bunch(a);
                }
                return new Bunch([document.createTextNode(string_check(text))]);
            },
            title: function (value) {
                reject_global(this);
                var b = this.___nodes___, i, node;
                if (value instanceof Array) {
                    if (value.length !== b.length) {
                        error('ADsafe: Array length: ' + b.length +
                            '-' + value.length);
                    }
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.title = string_check(value[i]);
                        }
                    }
                } else {
                    string_check(value);
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            node.title = value;
                        }
                    }
                }
                return this;
            },
            value: function (value) {
                reject_global(this);
                if (value === undefined) {
                    error();
                }
                var b = this.___nodes___, i, node;
                if (value instanceof Array && b.length === value.length) {
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            if (node.type !== 'password') {
                                if (typeof node.value === 'string') {
                                    node.value = value[i];
                                } else {
                                    while (node.firstChild) {
                                        purge_event_handlers(node);
                                        node.removeChild(node.firstChild);
                                    }
                                    node.appendChild(document.createTextNode(
                                        String(value[i])
                                    ));
                                }
                            }
                        } else if (node.nodeName === '#text') {
                            node.nodeValue = String(value[i]);
                        }
                    }
                } else {
                    value = String(value);
                    for (i = 0; i < b.length; i += 1) {
                        node = b[i];
                        if (node.tagName) {
                            if (typeof node.value === 'string') {
                                node.value = value;
                            } else {
                                while (node.firstChild) {
                                    purge_event_handlers(node);
                                    node.removeChild(node.firstChild);
                                }
                                node.appendChild(document.createTextNode(value));
                            }
                        } else if (node.nodeName === '#text') {
                            node.nodeValue = value;
                        }
                    }
                }
                return this;
            }
        };

// Return an ADsafe dom object.

        dom = {
            append: function (bunch) {
                var b = bunch.___nodes___, i, n;
                for (i = 0; i < b.length; i += 1) {
                    n = b[i];
                    if (typeof n === 'string' || typeof n === 'number') {
                        n = document.createTextNode(String(n));
                    }
                    root.appendChild(n);
                }
                return dom;
            },
            combine: function (array) {
                if (!array || !array.length) {
                    error('ADsafe: Bad combination.');
                }
                var b = array[0].___nodes___, i;
                for (i = 0; i < array.length; i += 1) {
                    b = b.concat(array[i].___nodes___);
                }
                return new Bunch(b);
            },
            count: function () {
                return 1;
            },
            ephemeral: function (bunch) {
                if (ephemeral) {
                    ephemeral.remove();
                }
                ephemeral = bunch;
                return dom;
            },
            fragment: function () {
                return new Bunch([document.createDocumentFragment()]);
            },
            prepend: function (bunch) {
                var b = bunch.___nodes___, i;
                for (i = 0; i < b.length; i += 1) {
                    root.insertBefore(b[i], root.firstChild);
                }
                return dom;
            },
            q: function (text) {
                star = false;
                var query = parse_query(text, id);
                if (typeof hunter[query[0].op] !== 'function') {
                    error('ADsafe: Bad query: ' + query[0]);
                }
                return new Bunch(quest(query, [root]));
            },
            remove: function () {
                purge_event_handlers(root);
                root.parent.removeElement(root);
                root = null;
            },
            row: function (values) {
                var tr = document.createElement('tr'),
                    td,
                    i;
                for (i = 0; i < values.length; i += 1) {
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(String(values[i])));
                    tr.appendChild(td);
                }
                return new Bunch([tr]);
            },
            tag: function (tag, type, name) {
                var node;
                if (typeof tag !== 'string') {
                    error();
                }
                if (makeableTagName[tag] !== true) {
                    error('ADsafe: Bad tag: ' + tag);
                }
                node = document.createElement(tag);
                if (name) {
                    node.autocomplete = 'off';
                    node.name = name;
                }
                if (type) {
                    node.type = type;
                }
                return new Bunch([node]);
            },
            text: function (text) {
                var a, i;
                if (text instanceof Array) {
                    a = [];
                    for (i = 0; i < text.length; i += 1) {
                        a[i] = document.createTextNode(string_check(text[i]));
                    }
                    return new Bunch(a);
                }
                return new Bunch([document.createTextNode(string_check(text))]);
            }
        };

        if (typeof root.addEventListener === 'function') {
            root.addEventListener('focus', dom_event, true);
            root.addEventListener('blur', dom_event, true);
            root.addEventListener('mouseover', dom_event, true);
            root.addEventListener('mouseout', dom_event, true);
            root.addEventListener('mouseup', dom_event, true);
            root.addEventListener('mousedown', dom_event, true);
            root.addEventListener('mousemove', dom_event, true);
            root.addEventListener('click', dom_event, true);
            root.addEventListener('dblclick', dom_event, true);
            root.addEventListener('keypress', dom_event, true);
        } else {
            root.onfocusin       = root.onfocusout  = root.onmouseout  =
                root.onmousedown = root.onmousemove = root.onmouseup   =
                root.onmouseover = root.onclick     = root.ondblclick  =
                root.onkeypress  = dom_event;
        }
        return [dom, Bunch.prototype];
    }


    function F() {}


//  Return the ADSAFE object.

    return {

        create: typeof Object.create === 'function' ? Object.create : function (o) {
            F.prototype = typeof o === 'object' && o ? o : Object.prototype;
            return new F();
        },

//  ADSAFE.get retrieves a value from an object.

        get: function (object, name) {
            reject_global(object);
            if (arguments.length === 2 && !reject_property(object, name)) {
                return object[name];
            }
            error();
        },

//  ADSAFE.go allows a guest widget to get access to a wrapped dom node and
//  approved ADsafe libraries. It is passed an id and a function. The function
//  will be passed the wrapped dom node and an object containing the libraries.

        go: function (id, f) {
            var dom, fun, root, i, scripts;

//  If ADSAFE.id was called, the id better match.

            if (adsafe_id && adsafe_id !== id) {
                error();
            }

//  Get the dom node for the widget's div container.

            root = document.getElementById(id);
            if (root.tagName !== 'DIV') {
                error();
            }
            adsafe_id = null;

//  Delete the scripts held in the div. They have all run, so we don't need
//  them any more. If the div had no scripts, then something is wrong.
//  This provides some protection against mishaps due to weakness in the
//  document.getElementById function.

            scripts = root.getElementsByTagName('script');
            i = scripts.length - 1;
            if (i < 0) {
                error();
            }
            do {
                root.removeChild(scripts[i]);
                i -= 1;
            } while (i >= 0);
            root = make_root(root, id);
            dom = root[0];


// If the page has registered interceptors, call then.

            for (i = 0; i < interceptors.length; i += 1) {
                fun = interceptors[i];
                if (typeof fun === 'function') {
                    try {
                        fun(id, dom, adsafe_lib, root[1]);
                    } catch (e1) {
                        ADSAFE.log(e1);
                    }
                }
            }

//  Call the supplied function.

            try {
                f(dom, adsafe_lib);
            } catch (e2) {
                ADSAFE.log(e2);
            }
            root = null;
            adsafe_lib = null;
        },

//  ADSAFE.id allows a guest widget to indicate that it wants to load
//  ADsafe approved libraries.

        id: function (id) {

//  Calls to ADSAFE.id must be balanced with calls to ADSAFE.go.
//  Only one id can be active at a time.

            if (adsafe_id) {
                error();
            }
            adsafe_id = id;
            adsafe_lib = {};
        },

//  ADSAFE.isArray returns true if the operand is an array.

        isArray: Array.isArray || function (value) {
            return Object.prototype.toString.apply(value) === '[object Array]';
        },


//  ADSAFE.later calls a function at a later time.

        later: function (func, timeout) {
            if (typeof func === 'function') {
                setTimeout(func, timeout || 0);
            } else {
                error();
            }
        },


//  ADSAFE.lib allows an approved ADsafe library to make itself available
//  to a widget. The library provides a name and a function. The result of
//  calling that function will be made available to the widget via the name.

        lib: function (name, f) {
            if (!adsafe_id || reject_name(name)) {
                error("ADsafe lib violation.");
            }
            adsafe_lib[name] = f(adsafe_lib);
        },


//  ADSAFE.log is a debugging aid that spams text to the browser's log.
//  Overwrite this function to send log matter somewhere else.

        log: function log(s) {
            if (window.console) {
                console.log(s);        /* Firebug */
            } else if (typeof Debug === 'object') {
                Debug.writeln(s);      /* IE */
            } else if (typeof opera === 'opera') {
                opera.postError(s);    /* Opera */
            }
        },


//  ADSAFE.remove deletes a value from an object.

        remove: function (object, name) {
            if (arguments.length === 2 && !reject_property(object, name)) {
                delete object[name];
                return;
            }
            error();
        },


//  ADSAFE.set stores a value in an object.

        set: function (object, name, value) {
            reject_global(object);
            if (arguments.length === 3 && !reject_property(object, name)) {
                object[name] = value;
                return;
            }
            error();
        },

//  ADSAFE._intercept allows the page to register a function that will
//  see the widget's capabilities.

        _intercept: function (f) {
            interceptors.push(f);
        }

    };
}());
// intercept.js
// 2011-01-06

// This file makes it possible for JSLint to run as an ADsafe widget by
// adding lib features.

// It provides a JSON cookie facility. Each widget is allowed to create a
// single JSON cookie.

// It also provides a way for the widget to call JSLint. The widget cannot
// call JSLint directly because it is loaded as a global variable. I don't
// want to change that because other versions of JSLint depend on that.

// And it provides access to the syntax tree that JSLint constructed.

/*jslint nomen: false */

/*global ADSAFE, document, JSLINT */

/*members ___nodes___, _intercept, cookie, edition, get, getTime,
    indexOf, innerHTML, jslint, length, parse, replace, report, set,
    setTime, slice, stringify, toGMTString, tree
*/

ADSAFE._intercept(function (id, dom, lib, bunch) {
    "use strict";

// Give every widget access to a cookie. The name of the cookie will be the
// same as the id of the widget.

    lib.cookie = {
        get: function () {

// Get the raw cookie. Extract this widget's cookie, and parse it.

            var c = ' ' + document.cookie + ';',
                s = c.indexOf((' ' + id + '=')),
                v;
            try {
                if (s >= 0) {
                    s += id.length + 2;
                    v = JSON.parse(c.slice(s, c.indexOf(';', s)));
                }
            } catch (ignore) {}
            return v;
        },
        set: function (value) {

// Set a cookie. It must be under 2000 in length. Escapify equal sign
// and semicolon if necessary.

            var d,
                j = JSON.stringify(value)
                    .replace(/[=]/g, '\\u003d')
                    .replace(/[;]/g, '\\u003b');

            if (j.length < 2000) {
                d = new Date();
                d.setTime(d.getTime() + 1e9);
                document.cookie = id + "=" + j + ';expires=' + d.toGMTString();
            }
        }
    };
});

ADSAFE._intercept(function (id, dom, lib, bunch) {
    "use strict";

// Give only the JSLINT_ widget access to the JSLINT function.
// We add a jslint function to its lib that calls JSLINT and
// then calls JSLINT.report, and stuffs the html result into
// a node provided by the widget. A widget does not get direct
// access to nodes.

// We also add an edition function to the lib that gives the
// widget access to the current edition string.

    if (id === 'JSLINT_') {
        lib.jslint = function (source, options, output) {
            JSLINT(source, options);
            output.___nodes___[0].innerHTML = JSLINT.report();
        };
        lib.edition = function () {
            return JSLINT.edition;
        };
        lib.tree = function () {
            return JSLINT.tree;
        };
    }
});
