expect          = require('chai').expect
loopback        = require 'loopback'
StorageService  = require '../source'
request         = require 'supertest'

describe 'mongo gridfs connector', ->

  agent       = null
  app         = null
  datasource  = null
  server      = null

  describe 'datasource', ->

    it 'should exist', ->
      expect(StorageService).to.exist

    describe 'default configuration', ->

      before (done) ->
        datasource = loopback.createDataSource
          connector: StorageService
          hostname: 'localhost'
          port: 27017
        setTimeout done, 200
      
      it 'should create the datasource', ->
        expect(datasource).to.exist
        expect(datasource.connector).to.exist
        expect(datasource.settings).to.exist

      it 'should create the url', ->
        expect(datasource.settings.url).to.exist
        expect(datasource.settings.url).to.eql "mongodb://localhost:27017/test"

      it 'should be connected', ->
        expect(datasource.connected).to.eql true

  describe 'model usage', ->

    model = null

    before (done) ->
      datasource = loopback.createDataSource
        connector: StorageService
        hostname: 'localhost'
        port: 27017
      model = datasource.createModel 'MyModel'
      setTimeout done, 200

    it 'should create the model', ->
      expect(model).to.exist

    describe 'getContainers function', ->

      it 'should exist', ->
        expect(model.getContainers).to.exist

      it 'should return an empty list', (done) ->
        model.getContainers (err, list) ->
          expect(Array.isArray list).to.eql true
          done()

    describe 'getContainer function', ->

      it 'should exist', ->
        expect(model.getContainer).to.exist

    describe 'upload function', ->

      it 'should exist', ->
        expect(model.upload).to.exist

  describe 'application usage', ->

    app     = null
    server  = null
    
    before (done) ->
      app = loopback()
      app.set 'port', 5000
      app.set 'url', 'localhost'
      app.set 'legacyExplorer', false
      app.use loopback.rest()
      ds = loopback.createDataSource
        connector: StorageService
        hostname: 'localhost'
        port: 27017
      model = ds.createModel 'MyModel', {},
        plural: 'my-model'
      app.model model
      setTimeout done, 200

    before (done) ->
      server = app.listen done

    after ->
      server.close()

    describe 'getContainers', ->

      result = null

      it 'should return an array', (done) ->
        request 'http://localhost:5000'
        .get '/my-model'
        .end (err, res) ->
          expect(res.status).to.equal 200
          done()
