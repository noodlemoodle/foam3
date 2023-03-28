foam.CLASS({
  name: 'RebindTest',
  extends: 'foam.u2.Controller',

  properties: [ 'a', 'b' ],

  methods: [
    function render() {
      var self = this;
      this.a = 'foo'; this.b = 'a,b,c,d,efg';
      this.add('A:', this.A, ' B: ', this.B).br().br();

      this.react(function(a, b) {
        this.add('react a:', a, ', b:', b).br();
      });

      this.react(function(a) {
        this.add('reacta ', a).br();
      });

      this.react(function(a) {
        if ( a === 'kgr' ) this.add('kgr').br();
      });

      this.react(function(b) {
        this.add('reactb ', b).br();
      });

      this.start('ol').
        react(function(b) {
          b.split(',').forEach(i => this.start('li').add(i).end());
        }, self).
      end().

      add('END').br();
    }
  ]
});
