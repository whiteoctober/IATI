gently = global.GENTLY = new (require 'gently')()

helpers = require '../lib/dynamicHelpers.js'

describe 'url helper', ->
  
  url_with = helpers.url_with
    originalUrl: '/current?key1=value1'
  
  
  it 'changes path', ->
    expect(url_with '/new').toBe('/new?key1=value1')

  it 'replaces parameters', ->
    expect(url_with '/new', {key1:'newValue'}).toBe('/new?key1=newValue')
    
  it 'changes parameters', ->
    expect(url_with '/new', {key1:'newValue', key2:'somekey'}).toBe('/new?key1=newValue&key2=somekey')


describe 'the url helper', ->
  
  url = helpers.url
    originalUrl: '/current?key1=value1'
  
  
  it 'gives the current url', ->
    expect(url()).toBe('/current?key1=value1')

  it 'sets the path', ->
    expect(url '/new').toBe('/new?key1=value1')
  
  it 'sets the params', ->
    expect(url {p:'value'}).toBe('/current?p=value')
  
  it 'removes the params', ->
    expect(url {}).toBe('/current')
  
  it 'sets the path and params', ->
    expect(url '/new', {p:'value'}).toBe('/new?p=value')

  it 'sets the path and removes params', ->
    expect(url '/new', {}).toBe('/new')
