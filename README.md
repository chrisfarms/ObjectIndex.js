
ObjectIndex.js
==============

Overview
--------

objectindex is a little wrapper around Arrays of Objects that provides you with the ability to search through the array using a text query much like Gmail's search filters.

Examples
--------

It's easist to explain with an example, so Say you have a collection of Objects in an Array like:

```javascript
var data = [
    {name:'Peter', email:'pete@example.com', description: 'He has a ball that is red'},
    {name:'Jane', email:'jane@example.com', description: 'Jane likes Peter'},
    {name:'Paul', email:'paul@example.com', description: 'Paul has a red ball'}
];
```
    
You could then create an ObjectIndex based on this array, and tell it what fields you will be querying against.

```javascript
var index = new ObjectIndex({
    records: data,
    fields: ['name','email','description']
});
```

Once you have an index, you can run text-based queries against your collection like you would with a search engine.

```javascript
results = index.query('peter');
=> [
    {name:'Peter', email:'pete@example.com', description: 'Peter has a ball'},
    {name:'Jane', email:'jane@example.com', description: 'Jane likes Peter'}
]
```

"peter" appeared in two of the records, so those two Objects were returned.

Queries can contain multiple terms and phrase-style searches too:

```javascript
results = index.query('"red ball"');
=> [
    {name:'Paul', email:'paul@example.com', description: 'Paul has a red ball'}
]
```

Even though both "Paul" and "Peter" records contain 'red' and 'ball', the phrase search (inside "quotes") limited it to just the "Paul" record.

You can limit your search to just a single property by writing columname:query:

```javascript
results = index.query('name:peter');
=> [
    {name:'Peter', email:'pete@example.com', description: 'He has a ball that is red'}
]
```

Lies, lies lies
---------------

Ok, ok, so Object*Index* is stretching it a bit at the moment, right now each query is run over all the original records, no "index" is actually created just yet.

I just needed the query part of this first to get it working, the next part is to work on increasing performance of the queries by creating an index and word stemmer so acts like full-text search. That said performance isn't actually too bad for <10K records. Please fork and play with trying to get the graph as low as you can in test.html


What on earth is test.html!
---------------------------

Try to avert your eyes from test.html, I just wanted to write a little script so I can test and evaluate performance. If you open it in a browser it will continually run a tiny set of basic test queries over an ever increasing set of records, and draw a little graph of how long it took, the aim of the game is to keep those numbers down.


Browser Support
---------------

This version will not work in IE as I use `indexOf`, it would be a pretty minor fix, but I don't need it right now. Again, please fork if you want to help.


Licence & Author(s)
-------------------

MIT "do what you want" Licenced
Written by Chris Farmiloe © 2011
Tokenizer code based on a version written by Douglas Crockford © 2006


