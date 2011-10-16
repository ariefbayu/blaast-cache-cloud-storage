var _ = require('common/util');
var InputBox = require('ui').InputBox;
var TextView = require('ui').TextView;

var input  = null;
var result = null;

_.extend(exports, {
	':load': function() {
        var self = this;
        self.clear();
        input = new InputBox();

        input.on('submit', function(){
            app.msg('cariArti', {istilah: input.value()});
        });
        
        result = new TextView();
        
        result.label("masukkan istilah yang anda cari.");
        
        
        self.add(input);
        self.add(result);

        app.on('message', function(action, param){
            if( action === 'cariArti'){
                result.label( param.word.definisi.join("\n") );
            }
        });
	},

	':keypress': function(key) {
        input.emit('keypress', key);
	}
});
