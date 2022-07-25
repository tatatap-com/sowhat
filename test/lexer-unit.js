import chai from 'chai'
import assertArrays from 'chai-arrays'

import {tokenize} from '../src/index.js'

const {expect} = chai

chai.use(assertArrays)

const getTokens = tokenize

describe('sowhat lexer', () => {
  describe('Everything is valid', () => {
    it('should have tokens', () => {
      const tokens = getTokens('hello world')
      expect(tokens.filter(t => t.type === 'word').length).to.equal(2)
      expect(tokens.length).to.equal(3)
    })

    it('should have tag tokens', () => {
      const tokens = getTokens('#hello #world')
      expect(tokens.filter(t => t.type === 'tag').length).to.equal(2)
      expect(tokens.length).to.equal(3)
    })

    it('should have a mention token', () => {
      let tokens = getTokens('@J')
      expect(tokens.filter(t => t.type === 'mention').length).to.equal(1)
      expect(tokens[0].value).to.equal('j')
      expect(tokens.length).to.equal(1)

      tokens = getTokens('@J-')
      expect(tokens.filter(t => t.type === 'mention').length).to.equal(1)
      expect(tokens[0].value).to.equal('j')
      expect(tokens.length).to.equal(2)

      tokens = getTokens('@J--')
      expect(tokens.filter(t => t.type === 'mention').length).to.equal(1)
      expect(tokens[0].value).to.equal('j')
      expect(tokens.length).to.equal(2)

      tokens = getTokens('@J-j-j')
      expect(tokens.filter(t => t.type === 'mention').length).to.equal(1)
      expect(tokens[0].value).to.equal('j-j-j')
      expect(tokens.length).to.equal(1)
    })
  })


  describe('Pin', () => {
    it('should have a pin', () => {
      const tokens = getTokens('*0')
      expect(tokens[0].text).to.equal('*0')
      expect(tokens[0].value).to.equal('0')
      expect(tokens[0].type).to.equal('pin')
    })

    it('should have a pin without a number', () => {
      const tokens = getTokens('* foo')
      expect(tokens[0].text).to.equal('*')
      expect(tokens[0].value).to.equal('0')
      expect(tokens[0].type).to.equal('pin')
    })

    it('should not have a pin', () => {
      const tokens = getTokens('foo *0')
      expect(tokens[2].text).to.equal('*0')
      expect(tokens[2].type).to.equal('word')
    })

    it('should have a pin and date and time', () => {
      const tokens = getTokens('*999 2021-01-01T10:00 foo')

      expect(tokens[0].text).to.equal('*999')
      expect(tokens[0].value).to.equal('999')
      expect(tokens[0].type).to.equal('pin')

      expect(tokens[2].text).to.equal('2021-01-01T10:00')
      expect(tokens[2].type).to.equal('date')
    })

    it('should have a date and time and folder', () => {
      const tokens = getTokens('*999 2021-01-01T10:00 /foo')

      expect(tokens[0].text).to.equal('*999')
      expect(tokens[0].value).to.equal('999')
      expect(tokens[0].type).to.equal('pin')

      expect(tokens[2].text).to.equal('2021-01-01T10:00')
      expect(tokens[2].type).to.equal('date')

      expect(tokens[4].value).to.equal('/foo')
      expect(tokens[4].type).to.equal('folder')
    })


    it('should have a date and time and folder and todo', () => {
      const tokens = getTokens('*999 2021-01-01T10:00 /foo todo')

      expect(tokens[0].text).to.equal('*999')
      expect(tokens[0].value).to.equal('999')
      expect(tokens[0].type).to.equal('pin')

      expect(tokens[2].text).to.equal('2021-01-01T10:00')
      expect(tokens[2].type).to.equal('date')

      expect(tokens[4].value).to.equal('/foo')
      expect(tokens[4].type).to.equal('folder')

      expect(tokens[6].value).to.equal('todo')
      expect(tokens[6].type).to.equal('todo')
    })
  })

  describe('Dates', () => {
    it('should have a date', () => {
      const tokens = getTokens('2021-01-01 foo')
      expect(tokens[0].text).to.equal('2021-01-01')
      expect(tokens[0].type).to.equal('date')
    })

    it('should have a date and time', () => {
      const tokens = getTokens('2021-01-01T10:00 foo')

      expect(tokens[0].text).to.equal('2021-01-01T10:00')
      expect(tokens[0].type).to.equal('date')
    })

    it('should have a date and time and folder', () => {
      const tokens = getTokens('2021-01-01T10:00 /foo')

      expect(tokens[0].text).to.equal('2021-01-01T10:00')
      expect(tokens[0].type).to.equal('date')

      expect(tokens[2].value).to.equal('/foo')
      expect(tokens[2].type).to.equal('folder')
    })


    it('should have a date and time and folder and todo', () => {
      const tokens = getTokens('2021-01-01T10:00 /foo todo')

      expect(tokens[0].text).to.equal('2021-01-01T10:00')
      expect(tokens[0].type).to.equal('date')

      expect(tokens[2].value).to.equal('/foo')
      expect(tokens[2].type).to.equal('folder')

      expect(tokens[4].value).to.equal('todo')
      expect(tokens[4].type).to.equal('todo')
    })

    it('should have a date and time and todo', () => {
      const tokens = getTokens('2021-01-01T10:00 todo')

      expect(tokens[0].text).to.equal('2021-01-01T10:00')
      expect(tokens[0].type).to.equal('date')

      expect(tokens[2].value).to.equal('todo')
      expect(tokens[2].type).to.equal('todo')
    })
  })

  describe('Folders', () => {
    it('should have folder with one segment', () => {
      const tokens = getTokens('/foo bar')
      expect(tokens[0].value).to.equal('/foo')
      expect(tokens[0].type).to.equal('folder')
    })

    it('should have folder with multiple segments', () => {
      const tokens = getTokens('/foo/bar/baz qux')
      expect(tokens[0].value).to.equal('/foo')
      expect(tokens[1].value).to.equal('/bar')
      expect(tokens[2].value).to.equal('/baz')
      expect(tokens[0].type).to.equal('folder')
      expect(tokens[1].type).to.equal('folder')
      expect(tokens[2].type).to.equal('folder')
    })

    it('should have folder with quoted segments', () => {
      const tokens = getTokens('/foo/"bar Baz" qux')
      expect(tokens[0].value).to.equal('/foo')
      expect(tokens[1].value).to.equal('/bar Baz')
      expect(tokens[3].value).to.equal('qux')
      expect(tokens[0].type).to.equal('folder')
      expect(tokens[1].type).to.equal('folder')
      expect(tokens[3].type).to.equal('word')
    })
  })


  describe('Beans', () => {
    it('should have a Bean token', () => {
      const tokens = getTokens('+foo')
      expect(tokens.filter(t => t.type === 'bean').length).to.equal(1)
      
      expect(tokens[0].value.value).to.equal('1')
    })


    it('should have a Bean token', () => {
      const tokens = getTokens('+f3oo:33')
      expect(tokens.filter(t => t.type === 'bean').length).to.equal(1)
      expect(tokens[0].value.value).to.equal('33')
    })
  })

  describe('Cells', () => {
    it('should have a Cell token', () => {
      const tokens = getTokens('&foo')
      expect(tokens.filter(t => t.type === 'cell').length).to.equal(1)
      expect(tokens[0].value.value).to.equal('1')
    })


    it('should have a Cell token', () => {
      const tokens = getTokens('&foo:3.3,g')
      expect(tokens.filter(t => t.type === 'cell').length).to.equal(1)
      expect(tokens[0].value).to.eql({
        value: '3.3',
        symbol: 'foo',
        unit: 'g'
      })
    })

    it('should have a Cell token with a negative value', () => {
      const tokens = getTokens('&foo:-3.3,g')
      expect(tokens.filter(t => t.type === 'cell').length).to.equal(1)
      expect(tokens[0].value).to.eql({
        value: '-3.3',
        symbol: 'foo',
        unit: 'g'
      })
    })
  })


  describe('Events', () => {
    it('should have an event token', () => {
      const tokens = getTokens('!foo')
      expect(tokens.filter(t => t.type === 'event').length).to.equal(1)
      expect(tokens.length).to.equal(1)
    })

    it('should have an event token with a range open component', () => {
      const tokens = getTokens('!foo...')
      expect(tokens[0].text).to.equal('!foo...')

      expect(tokens[0].value.label).to.equal('foo')
      expect(tokens[0].value.form).to.equal('open')

      

      expect(tokens.filter(t => t.type === 'event').length).to.equal(1)
      expect(tokens.length).to.equal(1)
    })


    it('should have an event token with a range close component', () => {
      const tokens = getTokens('...foo bar baz')
      expect(tokens[0].text).to.equal('...foo')

      expect(tokens[0].type).to.equal('event')

      expect(tokens[0].value.label).to.equal('foo')
      expect(tokens[0].value.form).to.equal('close')

      expect(tokens.filter(t => t.type === 'event').length).to.equal(1)
      expect(tokens.length).to.equal(5)
    })


    it('should have an event token with a range close component', () => {
      const tokens = getTokens('..."Foo Bar Baz"')
      expect(tokens[0].text).to.equal('..."Foo Bar Baz"')

      expect(tokens[0].type).to.equal('event')

      expect(tokens[0].value.label).to.equal('Foo Bar Baz')
      expect(tokens[0].value.form).to.equal('close')

      expect(tokens.length).to.equal(1)
    })
  })



  

  describe('Token case', () => {
    it('should have a tag with quoted text and unquoted set to lower case', () => {
      const tokens = getTokens('#"FOO bar" #BAZ')
      expect(tokens.filter(t => t.type === 'tag').length).to.equal(2)

      expect(tokens[0].value).to.equal('FOO bar')
      expect(tokens[2].value).to.equal('baz')
    })

    it('should have tag tokens', () => {
      const tokens = getTokens('/"FOO bar"/BAZ')
      expect(tokens[0].value).to.equal('/FOO bar')
      expect(tokens[1].value).to.equal('/baz')
    })
  })


  describe('Links', () => {
    // formulas
    it('should be a link', () => {
      const tokens = getTokens('://()')

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link', () => {
      const tokens = getTokens('://("")')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link', () => {
      const tokens = getTokens('://("" "")')

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link with an image', () => {
      const tokens = getTokens('://("" "")()')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link with an image', () => {
      const tokens = getTokens('://("" "")("")')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link with an image', () => {
      const tokens = getTokens('://("" "")("" "")')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link with an image with odd spacing', () => {
      const tokens = getTokens('://(""    "")   ("""")')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link with escaped quotes', () => {
      const tokens = getTokens('://("\\"foo\\" bar"    "baz\\"")   ("""")')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
    })

    it('should be a link and a tag', () => {
      const tokens = getTokens('://("foo"    "bar") #baz   ("""")')

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'link_open')).to.equal(true)
      expect(tokens.some(t => t.type === 'tag')).to.equal(true)
    })
  })

  describe('Formulas', () => {
    // formulas
    it('should be a formula', () => {
      const tokens = getTokens('$$()(+ 1 1)')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
      // expect(tokens.some(t => t.type === 'formula_close')).to.equal(true)
    })

    it('should have a formula with standard tokens after', () => {
      const tokens = getTokens(`$$(name)(+ 1 2) 
foo bar baz`)

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
    })

    it('should have a formula with standard tokens before', () => {
      const tokens = getTokens(`foo bar baz
$$()`)

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
    })

    it('should be a named formula', () => {
      const tokens = getTokens('$$(foo)(+ 1 1)')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'arg')).to.equal(true)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
    })

    it('should have a formula', () => {
      const tokens = getTokens('foo bar $$()(+ 1 1)')
      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
    })

    it('should have a formula and not care about weird whitespace', () => {
      const tokens = getTokens('foo    bar $$()    ( +    1       1 )  ')

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.some(t => t.type === 'formula_open')).to.equal(true)
    })


    it('should have three formulas', () => {
      const tokens = getTokens('foo bar $$ ()(+ 1 1)  $$()(+ 1 1) $$()(+ 1 1)  baz qux')

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(t => t.type === 'formula_open').length).to.equal(3)
    })

    it('should have a formula with a function in it', () => {
      const tokens = getTokens('$$() (+ 1 (BEAN foo))')
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })


    it('should have a formula with all valid operators in it', () => {
      const tokens = getTokens('$$() (+ 1 (BEAN foo) (BeaN- foo) (bean+ foo) ($ foo))')
      const operators = ['+', 'BEAN', 'BeaN-', 'bean+', '$'];
      const args = ['1', 'foo', 'foo', 'foo', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with a function in it and three standard tokens after', () => {
      const tokens = getTokens('$$ () (+ 1 (BEAN foo)) bar baz qux')
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(t => t.type === 'word').length).to.equal(3)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with a function with multiple args', () => {
      const tokens = getTokens('$$()(+ 1 (BEAN foo "2021-09-01" "/p/p/p"))')
      const operators = ['+', 'BEAN'];
      const args = ['1', 'foo', '2021-09-01', '/p/p/p'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with a function with an arg with escaped quotes', () => {
      const tokens = getTokens(`$$()(+ 1 (BEAN "\\"hello world\\""))`)

      const operators = ['+', 'BEAN'];
      const args = ['1', '\\"hello world\\"'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with a function with an arg with null value', () => {
      const tokens = getTokens(`$$()(foo - 1)`)

      const operators = ['foo'];
      const args = [null, '1'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with a function with a null arg and a negative number', () => {
      const tokens = getTokens(`$$()(foo - 1 -1.23)`)

      const operators = ['foo'];
      const args = [null, '1', '-1.23'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a named formula with a function in it', () => {
      const tokens = getTokens('$$(foo) (+ 1 (BEAN bar))')

      const operators = ['+', 'BEAN'];
      const args = ['foo', '1', 'bar'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with nested functions with multiple args in each', () => {
      const tokens = getTokens('$$() (- 1 (+ (BEAN "bar") (BEAN baz) (BEAN qux)) (* 5 (- 10 10)))')
      const operators = ['-', '+', 'BEAN', 'BEAN', 'BEAN', '*', '-'];
      const args = ['1', 'bar', 'baz', 'qux', '5', '10', '10'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should have a formula with nested functions and non function args in the last position of the function', () => {
      const tokens = getTokens('$$() (- 1 (+ 2 3) 4) ')
      const operators = ['-', '+'];
      const args = ['1', '2', '3', '4'];

      expect(tokens.some(i => i.type === 'error')).to.equal(false)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should produce an error because unsupported characters are present in the formula definition', () => {
      const tokens = getTokens('$$ (") (+ 0.0 1) foo')
      const operators = [];
      const args = [];

      expect(tokens.some(i => i.type === 'error')).to.equal(true)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should produce an error because the formula has a symbol in the wrong place', () => {
      const tokens = getTokens('$$ (foo bar) (+ 1 (BEAN baz))')
      const operators = [];
      const args = ['foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should produce an error because the formula has an incorrect sequence of characters starting in the operator position', () => {
      const tokens = getTokens('$$() (+ 1 ("F☔ " bar))')
      const operators = ['+', '"F☔'];
      const args = ['1']

      expect(tokens.some(i => i.type === 'error')).to.equal(true)
      expect(tokens.filter(t => t.type === 'word').length).to.equal(1)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should produce an error because unsupported characters are present in the arg', () => {
      const tokens = getTokens('$$( foo )(+ 0.0 ??) foo')
      const operators = ['+'];
      const args = ['foo', '0.0'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })

    it('should produce an error because there are too many args in the formula setup', () => {
      const tokens = getTokens('$$(foo bar) (+ 1 1)')
      const operators = [];
      const args = ['foo'];

      expect(tokens.some(i => i.type === 'error')).to.equal(true)
      expect(tokens.filter(i => i.type === 'operator').map(i => i.value)).to.equalTo(operators)
      expect(tokens.filter(i => i.type === 'arg').map(i => i.value)).to.equalTo(args)
    })
})
})
