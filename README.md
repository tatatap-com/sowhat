# sowhat

Sowhat is a markup language for organizing a collection of short note records. Records can include: organization and categorization elements, accounting elements, URLs, productivity elements, and formulas. 

The following record contains a few of the elements listed above:

```
2021-01-30 00:55 /lunch <-- Folder

Todo Purchase <-- Todo

* bacon
* lettuce
* tomatoes
* bread
* mayo

-"Groceries Budget":20.50 <-- Bean

$$("Cash After Shopping")
  (- (BEAN "All My Money")
     (BEAN "Groceries Budget")) <-- Formula
```

[The parsed result of the above record](#intro-example)

## Table of Contents

* [Origin](#origin)
* [Integration](#integration)
* [Usage](#usage)
* [Elements](#elements)
  * **[Dates](#dates)**
  * **[Folders](#folders)**
  * **[Todo/Done](#tododone)**
  * **[URLs](#urls)**
  * **[Tags](#tags)**
  * **[Events](#events)**
  * **[Beans](#beans)**
  * **[Formulas](#formulas)**
* [Examples](#examples)

## Origin

Sowhat was originally designed for the note-taking service [/tap](https://www.tatatap.com?ref=SOWHAT). One of the primary input methods for /tap is SMS, hence the extremely terse syntax of sowhat.

/tap is also a useful reference implementation for the sowhat language. The [/tap How-to guide](https://www.tatatap.com/how-to) has a lot of in-depth information about how the sowhat elements are interpreted.


## Integration

Sowhat is meant to be used in conjunction with a storage engine to keep track of a collection of records. The collection will accumulate records in folders, values (referred to as Beans) that can be referenced by Formulas, Events that span multiple records, and any other application that can make use of the elements listed below.

Of course, not all sowhat elements are necessary to produce a useful system. In-fact it started with only a single element, Folders.


## Usage

### Installation

```
npm install @tatatap-com/sowhat
```


### Parsing

```
sowhat.parse(`
2021-01-30 10:00 /a/b 

Todo Find out http://whattimeisit.com #time !task 

-budget:150.00 

$$("Estimated Cost")
  (* 
    (BEAN budget) 
    1.1)
`);
```

### Tokenizing

```
sowhat.tokenize('!hello #world');
```

### Compiling

Any changes to grammar.ne will require recompiling the parser.

```
npm run compile
```

## Elements

Any text will parse as a valid sowhat record. The elements listed below add meaning and values to the record:

* **[Dates](#dates)**: The date the record pertains to (see below for more information about why this is not implied via file create time or some other meta-data source)
* **[Folders](#folders)**: Describes where to file the record
* **[Todo/Done](#tododone)**: Indicates whether the record is something todo or something done
* **[URLs](#urls)**: See the [urlPattern](https://github.com/tatatap-com/sowhat/blob/master/src/urlPattern.js) for the exact Regex
* **[Tags](#tags)**: Standard tagging organizational structure
* **[Events](#events)**: Just like a tag, but utilizes the date element to indicate that _something_ happened at that time. In addition to marking a moment in time, events can include a continuation notation indicating the event spans a time range ending when a record dated in the future includes an _event close token_
* **[Beans](#beans)**: Beans are meant to be counted, and so they must be, or they are not much use. They are like tags combined with a number used to increase or decrease the value of a symbol. 
* **[Formulas](#formulas)**: Lisp-style equations that are able to reference the value of *Beans* and other *Formulas*
* Words: words wonderful words, whatever words you like.


```
<Date>? <Folder>? <Todo|Done>? < Word | URL | Tag | Event | Bean | Formula | Whitespace >*
```

Replace the `<Element>` with the element specifications below. `?` after an element indicates the element is optional. `*` after an element indicates 0 or more of the preceding element(s).


[See examples below](#examples)


The placement of Dates, Folders, Todos and Dones is fixed. These four elements must conform to the following order: 

```
<Date>:? <Folder>:? <Todo|Done>:?
```
Dates, Folders and Todo/Done are all optional


### Element Label


Folders, Tags, Events and Beans all include a Label portion. The regex for this portion is: 

```
'("([^"\\\n]|\\.)*")|(([\u1000-\uffff]|[a-zA-Z]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F])([\u1000-\uffff]|[a-zA-Z0-9\-_]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F]){0,18})'
```

It matches quoted text or non-whitespace text limited to the character sequence: `(([\u1000-\uffff]|[a-zA-Z]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F])([\u1000-\uffff]|[a-zA-Z0-9\-_]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F]){0,18})` 

### Dates

An optional date of the record can be specified as the first element. It must conform to the following format YYYY-MM-DD HH:MM:SS

The exact regex is:

```
(\d{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])(([\sT])?(2[0-3]|[01][0-9]):?([0-5][0-9]):?([0-5][0-9])?(\.[0-9]+)?Z?)
```

As you can see, sowhat does not validate whether the date is a real date. This task is left to the system using the sowhat language. It's possible, for example, to send 2021-02-31 and sowhat understands this to be a date. 

Depending on your application you may wish to ignore the date portion of the record in favor of the timestamp associated with an entity in your own system. 

It can also be used to override a default date assignment provided by entities in your own system.


### Folders

A record can include one folder. It must follow the date element or be the first element of a record. Folders must be a `/` followed by the *[element label pattern](#element-label)*

Folders may contain any number of nested folder segments.

If a folder is not specified no assumption is made as to what folder the record belongs. In other words no default folder is set. If folders are implemented it might make sense to implement a default value such as `/`.

### Todo/Done

Todo and Done keywords occur at the beginning of a record or follow a folder or date. The two elements are two aspects of the same concept -- they are meant to indicate whether the record is something to do or something that has been done! 

The keywords can be capital or lowercase or a mix, it does not matter: `todo`, `DONE`, `ToDo`, `dONe` are all OK.


### URLs

URLs identified in the record are parsed into a list for further processing. They can be included anywhere in the record except within another element.

The URL regex can be found [here](https://github.com/tatatap-com/sowhat/blob/master/src/urlPattern.js) 

### Tags

A `#` character followed by the *label pattern* regex. Full tag regex:

### Events

Events indicate that _something_ happened at a certain time. There are two forms of events: single point in time and ranges. The time associated with an event is the date specified along with the record.

The name of the event must match the *[element label pattern](#element-label)* of the element referenced above.

#### Point-in-time Events

Syntactically the same as a tag, but instead of a "#" they begin with a "!"

#### Range Events

Range events have two parts: an opening and a closing. To open a Range Event include "..." after the event like so: `!foo...`. To close this Range Event use the following format `...foo` 

A couple notes on Range Events:

* In order for a range to be defined the open and close need to be defined in two separate records with the Close Range element record's date later than the Start Range element record's date.
* Sowhat only handles the identification of these elements, the specific implementation will require a methodology for disambiguation when multiple open/close pairs are found with the same *label*

### Beans

Beans are used to increase or decrease a value associated with a symbol (the label pattern of the Bean). 

The syntax is:

```
<+|-><Label><:<Number>>?
```

The number portion is optional, and if ommitted will result in an increase or decrease of `1`.

To increase a Bean value use a `+` sign

```
+cash:42
```

To decrease a Bean value use a `-` sign

```
-cash:42
```

The value is any number that matches the following regex:

```
/([0-9]*\\.?[0-9]+|[0-9]+\\.?[0-9]*)([eE][+-]?[0-9]+)?/
```

### Formulas

Formulas are used to calculate number values. 

They use the following syntax

```
$$(<Label>)<S-Expression Formula Body>
```

Matching a formula is not one regex, but a collection of different patterns -- the details can be found [here](https://github.com/sowhat-lang/sowhat/blob/main/src/formula-states.js)

The formula name or `<Label>` must conform to the *[Element Label Pattern](#element-label)* above

The Formula body uses a lisp style s-expression syntax. Any non-space sequence of characters up to 42 in total length registers as an operator.

Formulas are intended to use alongside *Beans*. Beans values could be referenced as arguments to other math functions or invoked as part of a custom function that looks up their value.

For a reference implementation see the [/tap documentation on Formulas](https://www.tatatap.com/formulas)

### Errors

Even though all text will parse as a valid record, an individual element may contain errors. Errors that are encountered parsing a formula are captured and stored with the formula object. All other errors are stored in the top-level record object. 

All errors include the offending text and location it was encountered.

## Examples

A record in the Folder "Special Stuff" which is inside the Folder "goods":

```
/goods/"Special Stuff" This is a basic record inside of a subfolder. 
```

```JSON
{
  "date": null,
  "reaction": null,
  "folder": [
    {
      "value": "/goods",
      "text": "/goods",
      "offset": 0,
      "line": 1,
      "col": 1,
      "lineBreaks": 0,
      "error": null
    },
    {
      "value": "/Special Stuff",
      "text": "/\"Special Stuff\"",
      "offset": 6,
      "line": 1,
      "col": 7,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "/goods/\"Special Stuff\" This is a basic record inside of a subfolder.",
  "body": "This is a basic record inside of a subfolder."
}
```


A Dated record with a Point-in-Time Event "surprise":

```
2021-12-25 !Surprise 
```

```JSON
{
  "date": {
    "value": "2021-12-25",
    "text": "2021-12-25",
    "offset": 0,
    "line": 1,
    "col": 1,
    "lineBreaks": 0,
    "error": null
  },
  "reaction": null,
  "folder": [],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [
    {
      "value": "surprise",
      "text": "!Surprise",
      "offset": 11,
      "line": 1,
      "col": 12,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "2021-12-25 !Surprise",
  "body": "!Surprise"
}
```

A record that contains an increase of 1000 in the Bean "cash" and a decrease of 42.42 in the Bean "budget":

```
+cash:1000 -budget:42.42
```


```JSON
{
  "date": null,
  "reaction": null,
  "folder": [],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [],
  "url": [],
  "bean": [
    {
      "value": {
        "sign": "+",
        "value": "1000",
        "symbol": "cash"
      },
      "text": "+cash:1000",
      "offset": 0,
      "line": 1,
      "col": 1,
      "lineBreaks": 0,
      "error": null
    },
    {
      "value": {
        "sign": "-",
        "value": "-42.42",
        "symbol": "budget"
      },
      "text": "-budget:42.42",
      "offset": 10,
      "line": 1,
      "col": 11,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "error": [],
  "formula": [],
  "text": "+cash:1000 -budget:42.42",
  "body": "+cash:1000 -budget:42.42"
}
```

A record with a Formula that calculates the net value of the Bean "cash" divided by 30:

```
$$("NV Cash")(/ (BEAN cash) 30) 
```

```JSON
{
  "date": null,
  "reaction": null,
  "folder": [],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [
    {
      "value": {
        "name": "NV Cash",
        "procedure": {
          "type": "func",
          "operator": "/",
          "args": [
            {
              "type": "func",
              "operator": "BEAN",
              "args": [
                "cash"
              ],
              "text": "(BEAN cash)",
              "error": null,
              "offset": 16,
              "line": 1,
              "col": 17,
              "lineBreaks": 0
            },
            "30"
          ],
          "text": "(/ (BEAN cash) 30)",
          "error": null,
          "offset": 13,
          "line": 1,
          "col": 14,
          "lineBreaks": 0
        }
      },
      "text": "$$(\"NV Cash\")(/ (BEAN cash) 30)",
      "offset": 0,
      "line": 1,
      "col": 1,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "text": "$$(\"NV Cash\")(/ (BEAN cash) 30)",
  "body": "$$(\"NV Cash\")(/ (BEAN cash) 30)"
}
```

A record with a Todo: Dated and in the Folder "work":

```
2021-11-24 20:00 /work Todo Put turkey in the oven. 
```

```JSON
{                                                                                                        
  "date": {
    "value": "2021-11-24 20:00",
    "text": "2021-11-24 20:00",
    "offset": 0,
    "line": 1,
    "col": 1,
    "lineBreaks": 0,
    "error": null
  },
  "reaction": null,
  "folder": [
    {
      "value": "/work",
      "text": "/work",
      "offset": 17,
      "line": 1,
      "col": 18,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "todo": {
    "value": "Todo",
    "text": "Todo",
    "offset": 23,
    "line": 1,
    "col": 24,
    "lineBreaks": 0,
    "error": null
  },
  "done": null,
  "tag": [],
  "event": [],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "2021-11-24 20:00 /work Todo Put turkey in the oven.",
  "body": "Put turkey in the oven."
}
```

The same record as above, but Done:
  
```
2021-11-25 08:15 /work Done Put turkey in the oven. 
```

```JSON
{
  "date": {
    "value": "2021-11-25 08:15",
    "text": "2021-11-25 08:15",
    "offset": 0,
    "line": 1,
    "col": 1,
    "lineBreaks": 0,
    "error": null
  },
  "reaction": null,
  "folder": [
    {
      "value": "/work",
      "text": "/work",
      "offset": 17,
      "line": 1,
      "col": 18,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "todo": null,
  "done": {
    "value": "Done",
    "text": "Done",
    "offset": 23,
    "line": 1,
    "col": 24,
    "lineBreaks": 0,
    "error": null
  },
  "tag": [],
  "event": [],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "2021-11-25 08:15 /work Done Put turkey in the oven.",
  "body": "Put turkey in the oven."
}
```

A Dated record that contains a Range Event "Dance": 

  
```
2021:02:20 09:00 !Dance...
```

```JSON
{
  "date": null,
  "reaction": null,
  "folder": [],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [
    {
      "value": {
        "label": "dance",
        "isRange": true,
        "form": "open"
      },
      "text": "!Dance...",
      "offset": 17,
      "line": 1,
      "col": 18,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "2021:02:20 09:00 !Dance...",
  "body": "2021:02:20 09:00 !Dance..."
}
```
  
Close range
  
```
2021:02:20 10:00 ...Dance
```

```JSON
{
  "date": null,
  "reaction": null,
  "folder": [],
  "todo": null,
  "done": null,
  "tag": [],
  "event": [
    {
      "value": {
        "label": "dance",
        "isRange": true,
        "form": "close"
      },
      "text": "...Dance",
      "offset": 17,
      "line": 1,
      "col": 18,
      "lineBreaks": 0,
      "error": null
    }
  ],
  "url": [],
  "bean": [],
  "error": [],
  "formula": [],
  "text": "2021:02:20 10:00 ...Dance",
  "body": "2021:02:20 10:00 ...Dance"
}
```
  
#### Intro Example

```
2021-01-30 00:55 /lunch

Todo Purchase

* bacon
* lettuce
* tomatoes
* bread
* mayo

-"Groceries Budget":20.50 

$$("Cash After Shopping")
  (- (BEAN "All My Money")
     (BEAN "Groceries Budget"))
```

The parsed result of the above record:

```JSON
{
  "date": {
    "value": "2021-01-30 00:55",
    ...
  },
  "folder": [
    {
      "value": "/lunch",
      ....
    }
  ],
  "todo": {
    "value": "Todo",
    ...
  },
  ...
  "bean": [
    {
      "value": {
        "sign": "-",
        "value": "-20.00",
        "symbol": "Groceries Budget"
      },
      ...
    }
  ],
  ...
  "formula": [
    {
      "value": {
        "name": "Cash After Shopping",
        "procedure": {
          "type": "func",
          "operator": "-",
          "args": [
            {
              "type": "func",
              "operator": "BEAN",
              "args": [
                "All My Money"
              ],
              ...
            },
            {
              "type": "func",
              "operator": "BEAN",
              "args": [
                "Groceries Budget"
              ],
              ...
            }
          ],
          "text": "(- (BEAN \"All My Money\")\n    (BEAN \"Groceries Budget\"))",
          ...
        }
      },
      "text": "...",                                                                                                     
     ...
    }
  ],
  "text": "...",                                                                         
  "body": "..." 
}
```
