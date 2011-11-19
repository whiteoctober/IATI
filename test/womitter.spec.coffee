gently = global.GENTLY = new (require 'gently')()
eventEmitter = require('events').EventEmitter

womitter = require '../lib/womitter.js'

emitter = ->
emitter::= new eventEmitter()
emitter::fire = (name, value) ->
  @emit name, value


describe 'and', ->
  
  
  it 'works for one emitter', ->
    one = new emitter()
    
    anded = new womitter.and('hi', one)
    
    gently.expect anded, 'emit', (event, data) ->
      expect(event)
        .toBe 'hi'
      expect(data)
        .toBe 'data'
    
    one.fire 'hi', 'data' 
    
    
  
  
  it 'ands multiple emitters together', ->
    one = new emitter()
    two = new emitter()
    
    anded = womitter.and('hi', one, two)
    
    gently.expect anded, 'emit', (event, data1, data2) ->
      expect(event)
        .toBe 'hi'
        
      expect(data1)
        .toBe 'data1'
        
      expect(data2)
        .toBe 'data1'
    
    
    one.fire 'hi', 'data1'
    two.fire 'hi', 'data1'
