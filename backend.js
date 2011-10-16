// BlaastCacheCloudStorage -- backend.js
log.info('Hello from backend bootstrap.');

var http = require('blaast/simple-http');
var jsdom = require('jsdom');
var _ = require('underscore');
var storage = require('blaast/simple-data');




function Kateglo() {
	this.istilah = [];
	this.refreshCache();
}

Kateglo.prototype = {
	get: function(istilah) {
		return _.detect(this.istilah, function(i) { return i.istilah === istilah; });
	},

	set: function(istilah, definisi) {
		var k = this.get(istilah);
        if(!k){
            this.istilah.push({
                istilah: istilah,
                definisi: definisi
            });
        }
	},


	toArray: function() {
		return this.istilah;
	},

	// Read istilah from persistent storage
	refreshCache: function() {
		var self = this;

		storage.get('kateglo_istilah', function(err, value) {
			if (value && value.istilah) {
				self.istilah = value.istilah;
				log.info('read istilah, count=' + self.istilah.length);
			} else {
				log.info('no istilah found, value=' + JSON.stringify(value));
			}
		});
	},

	// Write istilah to persistent storage
	updateStorage: function() {
		storage.set('kateglo_istilah', { istilah: this.istilah }, function(err, oldData) {
			if (err) {
				log.info('Failed to store istilah: ' + err);
			} else {
				log.info('Stored istilah.');
			}
		});
	}
};

function kirimDefinisi( client, action, definisi){
    var definisiIstilah = [];
    if(definisi){
        for(var idx = 0; idx < definisi.length; idx++){
            definisiIstilah[ definisiIstilah.length ] = definisi[ idx ].def_text;
        }
    }

    client.msg( action, {
        word: {
            definisi: definisiIstilah
        }
    });    
}

var kateglo = new Kateglo();

app.message(function(client, action, param) {
    if(action === 'cariArti'){
        console.log("sedang mencari arti kata: " + param.istilah);
        
        var kata = kateglo.get( param.istilah );
        
        if( !kata ){
            console.log("kita belum punya cache kata: " + param.istilah);
            http.get("http://bahtera.org/kateglo/api.php?format=json&phrase=" + param.istilah, {
                ok: function(data) {
                    var node = JSON.parse(data);
                    
                    kirimDefinisi(client, action, node.kateglo.definition);
                    console.log("berhasil memperoleh informasi definisi dari kateglo: " + node.kateglo.definition.length);
                    
                    kateglo.set(param.istilah, node.kateglo);                
                    kateglo.perluUpdate = true;

                },
                error: function(err) {
                    console.log('err: ' + err);
                }
            });
        } else {
            console.log("sudah punya cache kata: " + param.istilah);
            //console.dir( kata );
            
            kirimDefinisi(client, action, kata.definisi.definition);
        }
    }
});

// Every thirty seconds, write data to db if changes happened.
setInterval(function() {
	if (kateglo.perluUpdate) {
        console.log( "cache database perlu diupdate ke storage." );
		delete kateglo.perluUpdate;
		kateglo.updateStorage();
	}
}, 30 * 1000);
