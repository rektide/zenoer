var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  events = require('events'),
  caminus = require('../lib/caminus')


var root = ""
if(typeof window !== 'undefined')
	root = window
if(typeof global !== 'undefined')
	root = global
if(typeof exports !== 'undefined')
	root = exports

var consumeData = function(e,callback) {
	var data = []
	e.on('data',function(chunk){
		data.push(chunk)
	})
	e.on('done',function(){
		callback(e,data,arguments.length?Array.prototype.slice.call(arguments):undefined)
	})
}



var zenoerFeed = (root.zenoerFeed||(root.zenoerFeed)) = function(url,dir){
	if(!(typeof this == 'zenoerFeed'))
		return new zenoerFeed(url,dir)
	var self = this

	this.url = url
	this.dir = dir

	var parsed = url.parse(url)
	this.httpClient = http.createClient(parsed.port, parsed.hostname)

	this.fetchFeed = function(dir) {
		var fetch = this.httpClient.request('GET', parsed.path, {'host':parsed.hostname})
		fetch.end()
		fetch.on('response',function(response){
			consumeData(response,function(e,data){
				// parse data via arclight
				// drop into directory via caminus
			})
		})
	}
}

var zenoer = (root.zenoer||(root.zenoer = {})) = function(feeds,dir)
{
	if(!(typeof this == 'zenoer'))
		return new zenoer()
	var self = this

	var purifyQueryKeys = function(q) {
		var replace = function(q,oldKey,replacementKey) {
			q[replacementKey] = q.oldKey
			delete q.oldKey
		}
		for(var k in q) {
			var updated = false,
			  key = k
			if(k.indexOf(".")!=-1) {
				key.replace(".","_")
				updated = true
			}
			if(updated) {
				var key = k
				replace(q,k,key)
			}
		}
		return q
	}

	this.handler = function(request,response) {
		if(request.headers["content-type"] != "application/x-www-form-urlencoded") {
			self.fail("invalid content-type")
		}
		consumeData(request,function(e,data){
			var param = purifyQueryKeys(querystring.parse(data.join("")))

			var hub = {mode: param.hub_mode, url: param.hub_url}
			if(hub.mode != "publish")
				self.fail("not a publish action for "+hub.url)
			var feed = feeds[hub_url]
			if(!feed)
				self.fail("feed not present: "+hub.url)

			self.updateFeed(feed)
		}
	}
	var boundCallback = function() { self.handler.apply(self,arguments) }
	var server = http.createServer(boundCallback)


	this.updateFeed = function(feed) {
		feed.fetchFeed(dir)
	}

	this.fail = function(err) {
		console.err(err+' [zenoer failure]')
	}
}
