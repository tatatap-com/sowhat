 const chai = require('chai');
const assertArrays = require('chai-arrays');
const {expect} = chai;

chai.use(assertArrays);

const lexer = require('../src/states');

const getTokens = (code) => {
  lexer.reset(code);
  return Array.from(lexer);
}

describe('sowhat lexer', async () => {
  describe('Everything is valid', async () => {
    it('should have tokens', async () => {
      const tokens = getTokens('hello world');
      expect(tokens.filter(t => t.type === 'word').length).to.equal(2);
      expect(tokens.length).to.equal(3);
    });

    it('should have tag tokens', async () => {
      const tokens = getTokens('#hello #world');
      expect(tokens.filter(t => t.type === 'tag').length).to.equal(2);
      expect(tokens.length).to.equal(3);
    });
  });

  describe('Dates', async () => {
    it('should have a date', async () => {

      const tokens = getTokens('2021-01-01 foo');
      expect(tokens[0].text).to.equal('2021-01-01');
      expect(tokens[0].type).to.equal('date');
    });

    it('should have a date and time', async () => {
      const tokens = getTokens('2021-01-01T10:00 foo');

      expect(tokens[0].text).to.equal('2021-01-01T10:00');
      expect(tokens[0].type).to.equal('date');
    });

    it('should have a date and time and folder', async () => {
      const tokens = getTokens('2021-01-01T10:00 /foo');

      expect(tokens[0].text).to.equal('2021-01-01T10:00');
      expect(tokens[0].type).to.equal('date');

      expect(tokens[2].value).to.equal('/foo');
      expect(tokens[2].type).to.equal('folder');
    });


    it('should have a date and time and folder and todo', async () => {
      const tokens = getTokens('2021-01-01T10:00 /foo todo');

      expect(tokens[0].text).to.equal('2021-01-01T10:00');
      expect(tokens[0].type).to.equal('date');

      expect(tokens[2].value).to.equal('/foo');
      expect(tokens[2].type).to.equal('folder');

      expect(tokens[4].value).to.equal('todo');
      expect(tokens[4].type).to.equal('todo');
    });

    it('should have a date and time and todo', async () => {
      const tokens = getTokens('2021-01-01T10:00 todo');

      expect(tokens[0].text).to.equal('2021-01-01T10:00');
      expect(tokens[0].type).to.equal('date');

      expect(tokens[2].value).to.equal('todo');
      expect(tokens[2].type).to.equal('todo');
    });
  });

  describe('Folders', async () => {
    it('should have folder with one segment', async () => {
      const tokens = getTokens('/foo bar');
      expect(tokens[0].value).to.equal('/foo');
      expect(tokens[0].type).to.equal('folder');
    });

    it('should have folder with multiple segments', async () => {
      const tokens = getTokens('/foo/bar/baz qux');
      expect(tokens[0].value).to.equal('/foo');
      expect(tokens[1].value).to.equal('/bar');
      expect(tokens[2].value).to.equal('/baz');
      expect(tokens[0].type).to.equal('folder');
      expect(tokens[1].type).to.equal('folder');
      expect(tokens[2].type).to.equal('folder');
    });

    it('should have folder with quoted segments', async () => {
      const tokens = getTokens('/foo/"bar Baz" qux');
      expect(tokens[0].value).to.equal('/foo');
      expect(tokens[1].value).to.equal('/bar Baz');
      expect(tokens[3].value).to.equal('qux');
      expect(tokens[0].type).to.equal('folder');
      expect(tokens[1].type).to.equal('folder');
      expect(tokens[3].type).to.equal('word');
    });
  });


  describe('Beans', async () => {
    it('should have a Bean token', async () => {
      const tokens = getTokens('+foo');
      expect(tokens.filter(t => t.type === 'bean').length).to.equal(1);
      
      expect(tokens[0].value.value).to.equal('1');
    });


    it('should have a Bean token', async () => {
      const tokens = getTokens('+f3oo:33');
      expect(tokens.filter(t => t.type === 'bean').length).to.equal(1);
      
      expect(tokens[0].value.value).to.equal('33');
    });
  });


  describe('Events', async () => {
    it('should have an event token', async () => {
      const tokens = getTokens('!foo');
      expect(tokens.filter(t => t.type === 'event').length).to.equal(1);
      expect(tokens.length).to.equal(1);
    });

    it('should have an event token with a range open component', async () => {
      const tokens = getTokens('!foo...');
      expect(tokens[0].text).to.equal('!foo...');

      expect(tokens[0].value.label).to.equal('foo');
      expect(tokens[0].value.form).to.equal('open');

      

      expect(tokens.filter(t => t.type === 'event').length).to.equal(1);
      expect(tokens.length).to.equal(1);
    });


    it('should have an event token with a range close component', async () => {
      const tokens = getTokens('...foo bar baz');
      expect(tokens[0].text).to.equal('...foo');

      expect(tokens[0].type).to.equal('event');

      expect(tokens[0].value.label).to.equal('foo');
      expect(tokens[0].value.form).to.equal('close');

      expect(tokens.filter(t => t.type === 'event').length).to.equal(1);
      expect(tokens.length).to.equal(5);
    });


    it('should have an event token with a range close component', async () => {
      const tokens = getTokens('..."Foo Bar Baz"');
      expect(tokens[0].text).to.equal('..."Foo Bar Baz"');

      expect(tokens[0].type).to.equal('event');

      expect(tokens[0].value.label).to.equal('Foo Bar Baz');
      expect(tokens[0].value.form).to.equal('close');

      expect(tokens.length).to.equal(1);
    });
  });



  

  describe('Token case', async () => {
    it('should have a tag with quoted text and unquoted set to lower case', async () => {
      const tokens = getTokens('#"FOO bar" #BAZ');
      expect(tokens.filter(t => t.type === 'tag').length).to.equal(2);

      expect(tokens[0].value).to.equal('FOO bar');
      expect(tokens[2].value).to.equal('baz');
    });

    it('should have tag tokens', async () => {
      const tokens = getTokens('/"FOO bar"/BAZ');
      expect(tokens[0].value).to.equal('/FOO bar');
      expect(tokens[1].value).to.equal('/baz');
    });
  });


  describe('Formulas', async () => {
    // formulas
    it('should be a formula', async () => {
      const tokens = getTokens('$$()(+ 1 1)');
      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
      // expect(tokens.some(t => t.type === 'formula_close')).to.equal(true);
    });

    it('should have a formula with standard tokens after', async () => {
      const tokens = getTokens(`$$(name)(+ 1 2) 
foo bar baz`);

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
    });

    it('should have a formula with standard tokens before', async () => {
      const tokens = getTokens(`foo bar baz
$$()`);

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
    });

    it('should be a named formula', async () => {
      const tokens = getTokens('$$(foo)(+ 1 1)');
      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.some(t => t.type === 'arg')).to.equal(true);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
    });

    it('should have a formula', async () => {
      lexer.reset('foo bar $$()(+ 1 1)');
      const tokens = []
      for (t of lexer) {
        tokens.push(t);
      }

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
    });

    it('should have a formula and not care about weird whitespace', async () => {
      lexer.reset('foo    bar $$()    ( +    1       1 )  ');

      const tokens = []
      for (t of lexer) {
        tokens.push(t);
      }

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true);
    });


    it('should have three formulas', async () => {
      const tokens = getTokens('foo bar $$ ()(+ 1 1)  $$()(+ 1 1) $$()(+ 1 1)  baz qux');

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(t => t.type === 'formula_open').length).to.equal(3);
    });

    it('should have a formula with a function in it', async () => {
      const tokens = getTokens('$$() (+ 1 (BEAN foo))')
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });


    it('should have a formula with all valid operators in it', async () => {
      const tokens = getTokens('$$() (+ 1 (BEAN foo) (BeaN- foo) (bean+ foo) ($ foo))')
      const operators = ['+', 'BEAN', 'BeaN-', 'bean+', '$'];
      const args = ['1', 'foo', 'foo', 'foo', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with a function in it and three standard tokens after', async () => {
      const tokens = getTokens('$$ () (+ 1 (BEAN foo)) bar baz qux')
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with a function with multiple args', async () => {
      const tokens = getTokens('$$()(+ 1 (BEAN foo "2021-09-01" "/p/p/p"))');
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo', '2021-09-01', '/p/p/p'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with a function with an arg with escaped quotes', async () => {
      const tokens = getTokens(`$$()(+ 1 (BEAN "\\"hello world\\""))`);

      const operators = ['+', 'BEAN'];
      const args = ['1', '\\"hello world\\"'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with a function with an arg with escaped quotes', async () => {
      const tokens = getTokens(`$$()(foo - 1)`);

      const operators = ['foo'];
      const args = [null, '1'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a named formula with a function in it', async () => {
      const tokens = getTokens('$$(foo) (+ 1 (BEAN bar))');

      const operators = ['+', 'BEAN'];
      const args = ['foo', '1', 'bar'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with nested functions with multiple args in each', async () => {
      const tokens = getTokens('$$() (- 1 (+ (BEAN "bar") (BEAN baz) (BEAN qux)) (* 5 (- 10 10)))');
      const operators = ['-', '+', 'BEAN', 'BEAN', 'BEAN', '*', '-'];
      const args = ['1', 'bar', 'baz', 'qux', '5', '10', '10'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should have a formula with nested functions and non function args in the last position of the function', async () => {
      const tokens = getTokens('$$() (- 1 (+ 2 3) 4) ');
      const operators = ['-', '+'];
      const args = ['1', '2', '3', '4'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should produce an error because unsupported characters are present in the formula definition', async () => {
      const tokens = getTokens('$$ (") (+ 0.0 1) foo')
      const operators = [];
      const args = [];

      expect(tokens.some(i => i.type === 'error')).to.equal(true);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should produce an error because the formula has a symbol in the wrong place', async () => {
      const tokens = getTokens('$$ (foo bar) (+ 1 (BEAN baz))')
      const operators = [];
      const args = ['foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should produce an error because the formula has an incorrect sequence of characters starting in the operator position', async () => {
      const tokens = getTokens('$$() (+ 1 ("F☔ " bar))')
      const operators = ['+', '"F☔'];
      const args = ['1']

      expect(tokens.some(i => i.type === 'error')).to.equal(true);
      expect(tokens.filter(t => t.type === 'word').length).to.equal(1);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should produce an error because unsupported characters are present in the arg', async () => {
      const tokens = getTokens('$$( foo )(+ 0.0 ??) foo')
      const operators = ['+'];
      const args = ['foo', '0.0'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });

    it('should produce an error because there are too many args in the formula setup', async () => {
      const tokens = getTokens('$$(foo bar) (+ 1 1)')
      const operators = [];
      const args = ['foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true);
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators);
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args);
    });
});
});
