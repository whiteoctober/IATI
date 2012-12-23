var _ = require('underscore');

require('../lib/underscore_mixins.js').init(_);

describe('without attrs', function(){
    it('removes @attrs', function(){
        var w = _.without_xml_attrs({
            '@one':1,
            'two':2,
            '@three':3
        });

        expect(w).toEqual({'two':2});
    });
    
});

