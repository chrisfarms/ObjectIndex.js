
var ObjectIndex = (function(){
  
  // poorman's is-array test
  var isArray = function(o){
    return o.constructor == Array;
  };
  
  var isNumber = function(v){
    if(typeof v == 'number' && (v>0 || v<0 || v===0))
      return true;    
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
  Index.prototype.propertyFilter = function(key, keyword){
    keyword = keyword.replace(/^"|"$/g,'');
    var self = this;
    return function(record){
      var d1,d2,rangeStrings,value = self.getRecordValue(record,key);
      if(!value)
        return false;
      if(isArray(value)){ 
        if(value.length===0)
          return false;
        // cast keyword to number if array is numeric
        if(isNumber(value[0]))
          keyword = parseInt(keyword,10);
        return value.indexOf(keyword)>=0;
      // if we're comaring a number the convert
      }else if(isNumber(value)){
        // check for range
        if(keyword[0]=="["){
          rangeStrings = keyword.slice(1,keyword.length-1).split('TO');
          // if only one number, then it is a "from 0 TO X" search
          if(rangeStrings.length==1 || !rangeStrings[0])
            d1 = 0;
          else
            d1 = parseInt(rangeStrings[0],10);
          d2 = parseInt(rangeStrings[1],10);
          return value >= d1 && value <= d2;
        // exact match
        }else{
          return value===parseInt(keyword,10);  
        }
      // if it's a date we're comaring against parse Date
      }else if(value.getTime){
        // date range
        if(keyword[0]=="["){
          rangeStrings = keyword.slice(1,keyword.length-1).split('TO');
          // if only one date, then it is a "from 0 TO X" search
          if(rangeStrings.length==1 || !rangeStrings[0])
            d1 = new Date('1970-01-01');
          else
            d1 = new Date(rangeStrings[0]);
          d2 = new Date(rangeStrings[1]);
          return value >= d1 && value <= d2;
        // exact match   
        }else{
          d1 = new Date(keyword);
          return value.getTime() == d1.getTime();
        }

      // otherwise treat as a free text search
      }else{
        var matcher = new RegExp(keyword,'i');
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
        var value = self.getRecordValue(record,key);
        if(value && typeof value == 'string' && matcher.test(value)){
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
  
  Index.prototype.filterMatchers = [
    {matcher: /^([\w_]+):([\w_\-£\.$]+|"[^"]+"|\[[^\]]+\])/, name:'propertyFilter'},
    {matcher: /^([\w_\-£\.$]+)/, name:'phraseFilter'}
  ];
  
  Index.prototype.consumeBuffer = function(buffer,fns){
    var match;
    for(var i=0; i<this.filterMatchers.length; i++){
      match = buffer.match(this.filterMatchers[i].matcher);
      if(!match)
        continue;
      // found a match so removed the consumed part of the buffer
      buffer = buffer.slice(match[0].length);
      // and add the filter fn
      fns.push(
        this[this.filterMatchers[i].name].apply(this, match.slice(1))
      );
      // and return
      return buffer;
    }
    // nothing consumed.
    // assume the first character is junk, eat it and continue
    return buffer.slice(1);
  };
  
  // transform the search query string q into a
  // filter function to be run against each record
  Index.prototype.compileQuery = function(q){
    var m,fn,fns = [];
    var buffer = q;
    while(buffer.length>0){
        buffer = this.consumeBuffer(buffer,fns);
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