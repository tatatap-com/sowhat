const parser = require('../src');
const chai = require('chai');
const {expect} = chai;


describe('SoWhat parser', () => {

  describe('Standard form', () => {
    it('should have words', () => {
      const result = parser.parse('yeah baby.');
      expect(result.text).to.equal('yeah baby.');
    });

    it('should have a tag', () => {
      const result = parser.parse(`yeah baby #foo`);
      expect(result.tag[0].text).to.equal('#foo');
    });

    it('should have a tag when tag follows folder', () => {
      const result = parser.parse('/yeah #foo');
      expect(result.tag[0].text).to.equal('#foo');
    });

    it('should have 2 tags', () => {
      const result = parser.parse('yeah baby #foo #bar.');
      expect(result.tag[0].text).to.equal('#foo');
      expect(result.tag[1].text).to.equal('#bar');
    });

    it('should have events', () => {
      const result = parser.parse('yeah baby !foo !bar.');
      expect(result.event[0].text).to.equal('!foo');
      expect(result.event[1].text).to.equal('!bar');
    });

    it('should have events following folder', () => {
      const result = parser.parse('/yeah/baby !foo !bar.');
      expect(result.event[0].text).to.equal('!foo');
      expect(result.event[1].text).to.equal('!bar');
    });

    it('should have an event when there are certain unicode characters as the symbol', () => {
      const result = parser.parse('!❤ !☔ !💇 !🧙 !🧙 !🧙‍♀');
      expect(result.event.length).to.equal(6);
    });

    it('should not have an event when there is an unwelcome character', () => {
      const result = parser.parse('!! !. !? !/ !@ !# !% !^ !& !* !( !) !~ !` !< !> !: !; !\' !\ !{ !} ![ !] !| !+ != !- !_');

      expect(result.event.length).to.equal(0);
    });

    it('should have a url', () => {
      const result = parser.parse('http://foo.com');
      expect(result.url[0].text).to.equal('http://foo.com');
    });

    it('should have a url, tag, event', () => {
      const result = parser.parse('http://foo.com !foo #bar');
      expect(result.url[0].text).to.equal('http://foo.com');
      expect(result.event[0].text).to.equal('!foo');
      expect(result.tag[0].text).to.equal('#bar');
    });
  });


  describe('Token Locations', () => {
    it('should report the correct location of the tag token', () => {
      const result = parser.parse('foo #bar baz')
      const {col, offset} = result.tag[0]
      const len = result.tag[0].text.length
      expect(result.text.substring(offset, offset + len)).to.equal('#bar')
    });

    it('should report the correct location of the tag token with token variation and multiple lines', () => {
      const result = parser.parse(`/foo todo
    !bar

ok                              #baz


baz`)
      const {col, offset} = result.tag[0]
      const len = result.tag[0].text.length
      expect(result.text.substring(offset, offset + len)).to.equal('#baz')
    });


    it('should report the correct location of the formula token with multiple lines', () => {
      const result = parser.parse(`/foo $$("bar baz")

(+ "qux qux" (- 1 2 3)) and more`)
      const {col, offset} = result.formula[0]
      const len = result.formula[0].text.length
      expect(result.text.substring(offset, offset + len)).to.equal(`$$("bar baz")

(+ "qux qux" (- 1 2 3))`)
    });
  })

  describe('Chunks', () => {

    it('should have 4 chunks', () => {
      const result = parser.parse('/foo bar baz qux #quux a b c d   ');
      expect(result.chunks.length).to.equal(4);
      expect(result.chunks[0].text).to.equal('/foo');
      expect(result.chunks[1].text).to.equal(' bar baz qux ');
      expect(result.chunks[2].text).to.equal('#quux');
      expect(result.chunks[3].text).to.equal(' a b c d   ');
    });

    it('should have 4 chunks with formula', () => {
      const result = parser.parse('/foo $$()(+ 1 1)  aaaa bbb ccc ');
      expect(result.chunks.length).to.equal(4);
      expect(result.chunks[0].text).to.equal('/foo');
      expect(result.chunks[1].text).to.equal(' ');
      expect(result.chunks[2].text).to.equal('$$()(+ 1 1)');
      expect(result.chunks[3].text).to.equal('  aaaa bbb ccc ');
    });

  })
  
  describe('Dated Record', () => {
    it('should have a date and record body', () => {
      const result = parser.parse('2020-01-20 foo bar #baz');

      expect(result.date.text).to.equal('2020-01-20');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('foo bar #baz');
    });

    it('should have a date with time and record body', () => {
      const result = parser.parse('2020-01-20 10:00 foo bar #baz');

      expect(result.date.text).to.equal('2020-01-20 10:00');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('foo bar #baz');
    });

    it('should have a date with time ISO 8601 UTC format and record body', () => {
      const result = parser.parse('2020-01-20T10:00Z foo bar #baz');

      expect(result.date.text).to.equal('2020-01-20T10:00Z');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('foo bar #baz');
    });
  });

  describe('Pinned Record', () => {
    it('should have a pin and record body', () => {
      const result = parser.parse('*1 foo bar #baz');

      expect(result.pin.text).to.equal('*1');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('foo bar #baz');
    });

    it('should have a pin, date, folder and record body', () => {
      const result = parser.parse('*1 2022-01-22 /foo bar #baz');

      expect(result.pin.text).to.equal('*1');
      expect(result.date.text).to.equal('2022-01-22');
      expect(result.folder[0].text).to.equal('/foo');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('bar #baz');
    });
  });

  describe('Folder form', () => {
    it('should have one seg folder and text', () => {
      const result = parser.parse('/foo bar #baz');
      expect(result.folder[0].text).to.equal('/foo');
      expect(result.tag[0].text).to.equal('#baz');
      expect(result.body).to.equal('bar #baz');
    });

    it('should have folder only', () => {
      const result = parser.parse('/foo');
      expect(result.folder[0].text).to.equal('/foo');
      expect(result.body).to.equal('');
    });


    it('should have 3 segs and text', () => {
      const result = parser.parse('/foo/bar/baz qux');
      expect(result.folder.reduce((acc, i) => acc += i.value, '')).to.equal('/foo/bar/baz');
      expect(result.body).to.equal('qux');
    });

    it('should have an error with the folder', () => {
      const result = parser.parse('/fo#o/bar/baz qux');
      expect(result.error[0].value.type).to.equal('INVALID_FOLDER_FORMAT');
      expect(result.body).to.equal('#o/bar/baz qux');
    });

    it('should have multiple errors', () => {
      const result = parser.parse('/fo#o/bar/baz #qu!x');
      expect(result.error.length).to.equal(2);
    });
  });

  describe('TODO form', () => {
    it('should register as a todo', () => {
      const result = parser.parse('TODO foo bar');
      expect(!!result.todo).to.equal(true);
      expect(result.body).to.equal('foo bar');
    });

    it('should not register as a todo', () => {
      const result = parser.parse('foo TODO bar');
      expect(result.todo).to.equal(null);
      expect(result.body).to.equal('foo TODO bar');
    });

    it('should register as a done even with weird case', () => {
      const result = parser.parse('TOdo foo');

      expect(!!result.todo.value).to.equal(true);
    });

    it('should register as an empty todo', () => {
      const result = parser.parse('TODO');
      expect(!!result.todo).to.equal(true);
    });

    it('should register as an empty todo whitespace is not a problem', () => {
      const result = parser.parse('       TODO          ');
      expect(!!result.todo).to.equal(true);
    });

    it('should register as a done', () => {
      const result = parser.parse('DONE foo');
      expect(!!result.done).to.equal(true);
      expect(!!result.todo).to.equal(false);
    });

    it('should register as a done and not register a todo', () => {
      const result = parser.parse('DONE TODO foo');
      expect(!!result.done).to.equal(true);
      expect(!!result.todo).to.equal(false);
    });

    it('should register as a done and not register a todo', () => {
      const result = parser.parse('TODO DONE foo');
      expect(!!result.done).to.equal(false);
      expect(!!result.todo).to.equal(true);
    });

    it('should register as a done even with weird case', () => {
      const result = parser.parse('DOnE foo');
      expect(!!result.done).to.equal(true);
    });

    it('should register as an empty done', () => {
      const result = parser.parse('DONE');
      expect(!!result.done).to.equal(true);
    });

    it('should register as a todo with a bunch of standard tokens', () => {
      const result = parser.parse('DONE foo #bar !baz');
      expect(!!result.done).to.equal(true);
      expect(result.body).to.equal('foo #bar !baz')
    });

    it('should register the todo and the folder', () => {
      const result = parser.parse('/foo TODO bar');

      expect(result.folder[0].text).to.equal('/foo');
      expect(result.body).to.equal('bar');
      expect(!!result.todo).to.equal(true);
    });

    it('should register the done and the folder', () => {
      const result = parser.parse('/foo DONE bar');
      expect(result.folder[0].text).to.equal('/foo');
      expect(result.body).to.equal('bar');
      expect(!!result.done).to.equal(true);
    });


    it('should register the done and the folder even with a trailing slash on the path', () => {
      const result = parser.parse('/foo/ DONE bar');
      expect(result.folder[0].text).to.equal('/foo');
      expect(result.body).to.equal('bar');
      expect(!!result.done).to.equal(true);
    });

    it('should register the folder with no todo', () => {
      const result = parser.parse('/foo TODOnt bar');
      expect(!!result.todo).to.equal(false);
    });
  });

  describe('Reaction form', () => {
    // TODO: Create tests for each of the different reaction types

    it('Should find a reaction', () => {
      const tokens = parser.tokenize('Liked “foo #bar !baz”', '????????????????????');

      const result = parser.parse('Liked “foo #bar !baz”', '????????????????????');
      expect(result.reaction.value.record).to.equal('foo #bar !baz')
      expect(result.reaction.value.reaction).to.equal('LIKE')
    })

    it('Should find a reaction even if the end quote is missing', () => {
      const result = parser.parse('Liked “foo #bar !baz');
      // NOTE: one of the limitations at the moment is in the event the end character is missing
      // i will be one character down thus creating an invalid "text" field
      // this is OK for now, one solution is to add an unlikely unicode character to the end of every
      // parse stream going into the parser so that i have something to latch onto at the end.
      expect(result.reaction.value.record).to.equal('foo #bar !ba');
      expect(result.reaction.value.reaction).to.equal('LIKE');
    })
  });

  describe('Beans', () => {
    it('Should find a bean with a +', () => {
      const result = parser.parse('+$:100');
      expect(result.bean.length).to.equal(1);
      expect(result.bean[0].value.sign).to.equal('+');
    });

    it('Should find a bean with a -', () => {
      const result = parser.parse('-$:100');
      expect(result.bean[0].value.sign).to.equal('-');
    });

    it('Should find a bean with a decimal', () => {
      const result = parser.parse('-$:100.01');
      expect(result.bean[0].value.value).to.equal('100.01');
    });

    it('Should not find a bean with a decimal starting with "."', () => {
      const result = parser.parse('-$:.01');

      expect(result.bean.length).to.equal(1);
    });

    it('Should find a bean with a decimal starting with "0"', () => {
      const result = parser.parse('-$:0.01');

      expect(result.bean.length).to.equal(1);
    });

    it('Should find a bean with a decimal ending with "." but also include an error', () => {
      const result = parser.parse('-$:10.');

      expect(result.bean.length).to.equal(1);
      expect(result.error.length).to.equal(1);
    });

    it('Should find a bean with a + even when there is a folder', () => {
      const result = parser.parse('/foo +$:100');
      expect(result.bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a tag', () => {
      const result = parser.parse('#foo +$:100');
      expect(result.bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a todo', () => {
      const result = parser.parse('todo +$:100');
      expect(result.bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a done', () => {
      const result = parser.parse('done +$:100');
      expect(result.bean.length).to.equal(1)
    })


    it('Should find multiple beans', () => {
      const result = parser.parse('-foo +$:100');
      expect(result.bean.length).to.equal(2)
    })


    it('Should find a bean with a + and an emoji', () => {
      const result = parser.parse('+☔');
      expect(result.bean.length).to.equal(1)
    })

    it('Should find a bean with a -', () => {
      const result = parser.parse('-$:1');
      expect(result.bean.length).to.equal(1);
    });

    it('Should not find a bean when there is no symbol', () => {
      const result = parser.parse('-1');
      expect(result.bean.length).to.equal(0)
    });

    it('Should find a bean when there is no number', () => {
      const result = parser.parse('-$');
      expect(result.bean.length).to.equal(1);
    });

    it('Should find a bean when the symbol is more than two regular characters', () => {
      const result = parser.parse('-$$$$$:1');
      expect(result.bean.length).to.equal(1);
    });
  });


  describe('Formulas', () => {
    it('Should find a formula without a name', () => {
      const result = parser.parse('$$()(+ 1 1) ');
      expect(result.formula.length).to.equal(1);
    });

    it('Should find a formula with nothin', () => {
      const result = parser.parse('$$()');

      expect(result.formula.length).to.equal(1);
    });

    it('Should find a formula with name only', () => {
      const result = parser.parse('$$(foo)');

      expect(result.formula.length).to.equal(1);
    });

    it('Should find a formula with quoted name', () => {
      const result = parser.parse('$$("Foo bar") ');


      expect(result.formula[0].value.name).to.equal('Foo bar');
      expect(result.formula.length).to.equal(1);
    });

    it('Should find a formula with func with quoted arg', () => {
      const result = parser.parse('$$( "Foo bar") (BEAN "Baz Qux") ');

      const proc = {
        operator: 'BEAN',
        text: '(BEAN "Baz Qux")',
        error: null,
        col: 16,
        line: 1,
        lineBreaks: 0,
        offset: 15,
        type: 'func',
        args: [
          'Baz Qux'
        ]
      };

      expect(result.formula[0].value.procedure).to.deep.equal(proc);
      expect(result.formula.length).to.equal(1);
    });

    it('Should find a formula with func with a special character arg', () => {
      const result = parser.parse('$$()(BEAN $)');

      const proc = {
        operator: 'BEAN',
        text: '(BEAN $)',
        error: null,
        col: 5,
        line: 1,
        lineBreaks: 0,
        offset: 4,
        type: 'func',
        args: [
          '$'
        ]
      };

      expect(result.formula[0].value.procedure).to.deep.equal(proc);
      expect(result.formula.length).to.equal(1);
    });

    it('Should find 2 formulas', () => {
      const result = parser.parse('$$()(+ 1 1) $$()(+ 2 2)');

      expect(result.formula.length).to.equal(2);
    });

    it('Should find a formula with nested functions', () => {
      const result = parser.parse(`$$() (+ (- 1 1) 1)`);

      const proc = {
        operator: '+',
        text: '(+ (- 1 1) 1)',
        error: null,
        type: 'func',
        col: 6,
        line: 1,
        lineBreaks: 0,
        offset: 5,
        args: [
          {
            operator: '-',
            error: null,
            type: 'func',
            text: '(- 1 1)',
            args: ['1', '1'],
            col: 9,
            line: 1,
            lineBreaks: 0,
            offset: 8,
          },

          '1'
        ]
      };

      expect(result.formula.length).to.equal(1);
      expect(result.formula[0].value.procedure).to.deep.equal(proc);
    });

    it('Should find a formula with nested functions args before', () => {
      const result = parser.parse('$$()(+ 1 1 (- 1 1)) ');

      expect(result.formula.length).to.equal(1);
      expect(result.error.length).to.equal(0);
    });

    it('Should find a formula with nested functions args after', () => {
      const result = parser.parse('$$()(+ (- 1 1) 1 1) ');

      expect(result.formula.length).to.equal(1);
      expect(result.error.length).to.equal(0);
    });

    it('Should find a formula with nested functions args before and after', () => {
      const result = parser.parse('$$()(+ 1 (- 1 1) 1) foo');

      expect(result.text).to.equal('$$()(+ 1 (- 1 1) 1) foo');

      expect(result.body).to.equal('$$()(+ 1 (- 1 1) 1) foo');

      expect(result.formula.length).to.equal(1);
      expect(result.error.length).to.equal(0);
    });

    it('Should find a formula with a name', () => {
      const result = parser.parse('$$(foo) (+ 1 1)');
      expect(result.formula.length).to.equal(1)
      expect(result.formula[0].value.name).to.equal('foo');
    });

    it('Should create an error in the formula because of multiple names', () => {
      const result = parser.parse('$$(foo bar) (+ 1 1)');

      expect(result.formula.length).to.equal(1)
      expect(result.formula[0].value.name).to.equal('foo');
    });

    it('Should find a formula with an error', () => {
      const result = parser.parse('$$(foo) (+ 1 1 :$');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)
    });

    it('Should find an incomplete formula', () => {
      let result = parser.parse('$$ (foo) (+ 1 1 ');
      
      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (+ 1');


      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (!! foo');

      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (+');


      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (');


      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) ');


      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo ');


      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ ( ');
      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ ');

      expect(!!result.formula[0].error).to.equal(false)
      expect(result.formula.length).to.equal(1)
    });

    it('Should find an incomplete formula with an error', () => {
      let result = parser.parse('$$ (foo) (+ 1 1 !! foo');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (+ !! foo');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) (+ 1 !! foo');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ (foo) !! foo');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ ( !! foo');
      expect(!!result.formula[0].error).to.equal(true);
      expect(result.formula.length).to.equal(1)

      result = parser.parse('$$ !! foo');

      expect(!!result.formula[0].error).to.equal(true)
      expect(result.formula.length).to.equal(1)
    })

    it('should find a formula and the record text and body should be the same after parsing', () => {
      const result = parser.parse(`/foo $$()(a b (c    d    (e f (g    h ) i) ) j  )   `)
      expect(result.text).to.equal(`/foo $$()(a b (c    d    (e f (g    h ) i) ) j  )   `)
      expect(result.body).to.equal(`$$()(a b (c    d    (e f (g    h ) i) ) j  )`)
    })

})

});
