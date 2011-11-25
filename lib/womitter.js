// some white october event emitter helpers
var _ = require('underscore');

// waits for all emitters to fire an event, then emits them together
var and = function(event, _emitters_){
    var _this = this;
    
    var emitters = _.rest(arguments);
    
    var values = [];
    var count = emitters.length;
    
    _.each(emitters,function(emitter, i){
      emitter.on(event,function(data){
        
        values[i] = data;
        if(--count) return;
        
        values.unshift(event);
        _this.emit.apply(_this,values);
        
      })
      
      // if any emitter errors - emit it
      .on('error',function(error){
        _this.emit('error', error);
      });
    });
    
    return this;
};

and.prototype = new process.EventEmitter();

exports.and = and;



/*
  having finished that - I think this might be a nicer way to do it…

// a group of emitters
var emitters = function(_emitters_){
  this.emitters = _.toArray(arguments);
}


emitters.prototype.onAll = function(event, callback){
  var values = [];
  var count = this.emitters.length;
  
  _.each(this.emitters,function(emitter, i){
    emitter.on(event,function(data){
      
      values[i] = data;
      if(--count) return;
      
      values.unshift(event);
      callback.apply(_this,values);
      
    });
  });
}

emitters.prototype.onAny = function(event, callback){
  _.each(this.emitters,function(emitter, i){
    emitter.on(event,function(){
      callback.apply(this, _.toArray(arguments));
    });
  });
}

//use the each from underscore
emitters.prototype.each = function(){
  _.each.apply(_(this.emitters).concat(_.toArray(arguments)))
}

exports.emitters = emitters;

*/