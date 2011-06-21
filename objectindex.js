
String.prototype.tokens = function (prefix, suffix) {
    // 2010-02-23
    // (c) 2006 Douglas Crockford
    var c;                      // The current character.
    var from;                   // The index of the start of the token.
    var i = 0;                  // The index of the current character.
    var length = this.length;
    var n;                      // The number value.
    var q;                      // The quote character.
    var str;                    // The string value.

    var result = [];            // An array to hold the results.

    var make = function (type, value) {

// Make a token object.

        return {
            type: type,
            value: value,
            from: from,
            to: i
        };
    };

// Begin tokenization. If the source string is empty, return nothing.

    if (!this) {
        return;
    }

// If prefix and suffix strings are not provided, supply defaults.

    if (typeof prefix !== 'string') {
        prefix = '<>+-&';
    }
    if (typeof suffix !== 'string') {
        suffix = '=>&:';
    }


// Loop through this text, one character at a time.

    c = this.charAt(i);
    while (c) {
        from = i;

// Ignore whitespace.

        if (c <= ' ') {
            i += 1;
            c = this.charAt(i);

// name.

        } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            str = c;
            i += 1;
            for (;;) {
                c = this.charAt(i);
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                        (c >= '0' && c <= '9') || c === '_') {
                    str += c;
                    i += 1;
                } else {
                    break;
                }
            }
            result.push(make('keyword', str));

// number.

// A number cannot start with a decimal point. It must start with a digit,
// possibly '0'.

        } else if (c >= '0' && c <= '9') {
            str = c;
            i += 1;

// Look for more digits.

            for (;;) {
                c = this.charAt(i);
                if (c < '0' || c > '9') {
                    break;
                }
                i += 1;
                str += c;
            }

// Look for a decimal fraction part.

            if (c === '.') {
                i += 1;
                str += c;
                for (;;) {
                    c = this.charAt(i);
                    if (c < '0' || c > '9') {
                        break;
                    }
                    i += 1;
                    str += c;
                }
            }

// Look for an exponent part.

            if (c === 'e' || c === 'E') {
                i += 1;
                str += c;
                c = this.charAt(i);
                if (c === '-' || c === '+') {
                    i += 1;
                    str += c;
                    c = this.charAt(i);
                }
                if (c < '0' || c > '9') {
                    make('number', str).error("Bad exponent");
                }
                do {
                    i += 1;
                    str += c;
                    c = this.charAt(i);
                } while (c >= '0' && c <= '9');
            }

// Make sure the next character is not a letter.

            if (c >= 'a' && c <= 'z') {
                str += c;
                i += 1;
                make('number', str).error("Bad number");
            }

// Convert the string value to a number. If it is finite, then it is a good
// token.

            n = +str;
            if (isFinite(n)) {
                result.push(make('number', n));
            } else {
                make('number', str).error("Bad number");
            }

// string

        } else if (c === '\'' || c === '"') {
            str = '';
            q = c;
            i += 1;
            for (;;) {
                c = this.charAt(i);
                if (c < ' ') {
                    make('phrase', str).error(c === '\n' || c === '\r' || c === '' ?
                        "Unterminated string." :
                        "Control character in string.", make('', str));
                }

// Look for the closing quote.

                if (c === q) {
                    break;
                }

// Look for escapement.

                if (c === '\\') {
                    i += 1;
                    if (i >= length) {
                        make('phrase', str).error("Unterminated string");
                    }
                    c = this.charAt(i);
                    switch (c) {
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
                        if (i >= length) {
                            make('phrase', str).error("Unterminated string");
                        }
                        c = parseInt(this.substr(i + 1, 4), 16);
                        if (!isFinite(c) || c < 0) {
                            make('phrase', str).error("Unterminated string");
                        }
                        c = String.fromCharCode(c);
                        i += 4;
                        break;
                    }
                }
                str += c;
                i += 1;
            }
            i += 1;
            result.push(make('phrase', str));
            c = this.charAt(i);

// comment.

        } else if (c === '/' && this.charAt(i + 1) === '/') {
            i += 1;
            for (;;) {
                c = this.charAt(i);
                if (c === '\n' || c === '\r' || c === '') {
                    break;
                }
                i += 1;
            }

// combining

        } else if (prefix.indexOf(c) >= 0) {
            str = c;
            i += 1;
            while (true) {
                c = this.charAt(i);
                if (i >= length || suffix.indexOf(c) < 0) {
                    break;
                }
                str += c;
                i += 1;
            }
            result.push(make('operator', str));

// single-character operator

        } else {
            i += 1;
            result.push(make('operator', c));
            c = this.charAt(i);
        }
    }
    return result;
};



var ObjectIndex = (function(){
  
  // poorman's is-array test
  var isArray = function(o){
    return o.constructor == Array;
  };
  
  var Index = function(config){
    // the list of valid search fields 
    this.fields = config.fields;
    if(!this.fields)
      throw new Error("you must set the fields to index");
    // the list of records in the index
    this.records = config.records;
    if(!this.records)
      throw new Error("you must an array of records to index");
    // the getter function. leave blank for direct lookup
    this.getter = config.getter;
  };
  
  // replace the record index
  Index.prototype.update = function(records){
    this.records = records;
  };
  
  // method used to fetch the value of the property field
  // from the record. set the name of the getter method 
  // via config {getter: 'gettername'} or leave blank
  // for the default record[key] lookup
  Index.prototype.getRecordValue = function(record, key){
    return this.getter ? record[this.getter](key) : record[key];
  };

  // return a filter function that will do an exact match on the
  // property value
  Index.prototype.propertyFilter = function(key, token){
    var self = this;
    return function(record){
      var value = self.getRecordValue(record,key);
      if(value && isArray(value)){ 
        return value.indexOf(token.value)>=0;
      }else if(token.type=="number"){
        return value===token.value;
      }else{
        var matcher = new RegExp(token.value,'i');
        return matcher.test(value);
      }
    };
  };
  
  
  // return a filter that will do a case insensitive match
  // against any of the object properties listed in config.fields
  Index.prototype.phraseFilter = function(q){
    var matcher = new RegExp(q,'i');
    var self = this;
    return function(record){
      var i,key;
      for(i=0; i<self.fields.length; i++){
        key = self.fields[i];
        if( matcher.test(self.getRecordValue(record,key)) ){
          return true;
        }
      }
      return false;
    };
  };
  
  // AND together a list of functions into one function
  Index.prototype.andFilter = function(fns){
    return function(record){
      for (var i=0; i < fns.length; i++) {
        if( !fns[i](record) )
          return false;
      }
      return true;
    };
  };
  
  // transform the search query string q into a
  // filter function to be run against each record
  Index.prototype.compileQuery = function(q){
    var fn,fns = [],
        tokens = q.tokens();
    // is the token at index i a label for
    // a property filter like: 
    // color:red
    // someProperty: green
    var isPropertyFilter = function(i){
      return (tokens[i].type=="keyword" || tokens[i].type=="phrase") &&
        tokens[i+1] && 
        tokens[i+1].type=="operator" && tokens[i+1].value==":" &&
        tokens[i+2] &&
        (tokens[i+2].type=="keyword" || tokens[i+2].type=="phrase" || tokens[i+2].type=="number");
    };
    // is the token at index i a generic search term
    var isPhrase = function(){
      return tokens[i].type=="keyword" || 
        tokens[i].type=="phrase" || 
        tokens[i].type=="number";
    };
    // create a list of functions that will each be
    // run against each record to form an AND chain
    for (var i=0; i < tokens.length; i++) {
      if(isPropertyFilter(i)){
        fn = this.propertyFilter(tokens[i].value, tokens[i+2]);
        i += 2; // move past already consumed items
      }else if(isPhrase(i)){
        fn = this.phraseFilter(tokens[i].value.toString());
      }
      fns.push(fn);
    }
    // combine all the fns into a single AND function
    return this.andFilter(fns);
    
  };
  
  // loop over each record passing it to fn
  // if fn returns true, then include the record
  // in the results
  Index.prototype.filter = function(fn){
    var rs = [];
    for (var i=0; i < this.records.length; i++) {
      if( fn(this.records[i]) )
        rs.push(this.records[i]);
    }
    return rs;
  };
  
  // the main API for querying records.
  // pass in queries like: 
  // tony
  // tony daniels
  // tony gender:male
  Index.prototype.query = function(q){
    var fn = this.compileQuery(q);
    return this.filter(fn);
  };
  
  return Index;
  
})();