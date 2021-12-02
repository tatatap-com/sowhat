const nearley = require('nearley');
const chai = require('chai');
const {expect} = chai;

const grammar = require('../src/grammar');

describe('SoWhat parser', async () => {

  describe('Standard form', async () => {
    it('should have words', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      parser.feed('yeah baby.');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].text).to.equal('yeah baby.');
    });

    it('should have a tag', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      parser.feed(`yeah baby #foo`);
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].tag[0].text).to.equal('#foo');
    });

    it('should have a tag when tag follows folder', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/yeah #foo');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].tag[0].text).to.equal('#foo');
    });

    it('should have 2 tags', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('yeah baby #foo #bar.');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].tag[0].text).to.equal('#foo');
      expect(parser.results[0].tag[1].text).to.equal('#bar');
    });

    it('should have events', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('yeah baby !foo !bar.');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].event[0].text).to.equal('!foo');
      expect(parser.results[0].event[1].text).to.equal('!bar');
    });

    it('should have events following folder', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/yeah/baby !foo !bar.');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].event[0].text).to.equal('!foo');
      expect(parser.results[0].event[1].text).to.equal('!bar');
    });

    it('should have an event when there are certain unicode characters as the symbol', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('!❤ !☔ !💇 !🧙 !🧙 !🧙‍♀');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].event.length).to.equal(6);
    });

    it('should not have an event when there is an unwelcome character', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      parser.feed('!! !. !? !/ !@ !# !% !^ !& !* !( !) !~ !` !< !> !: !; !\' !\ !{ !} ![ !] !| !+ != !- !_');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].event.length).to.equal(0);
    });

    it('should have a url', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('http://foo.com');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].url[0].text).to.equal('http://foo.com');
    });

    it('should have a url, tag, event', async () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      parser.feed('http://foo.com !foo #bar');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].url[0].text).to.equal('http://foo.com');
      expect(parser.results[0].event[0].text).to.equal('!foo');
      expect(parser.results[0].tag[0].text).to.equal('#bar');
    });
  });

  describe('Dated Record', async () => {
    it('should have a date and record body', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('2020-01-20 foo bar #baz');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].date.text).to.equal('2020-01-20');
      expect(parser.results[0].tag[0].text).to.equal('#baz');
      expect(parser.results[0].body).to.equal('foo bar #baz');
    });

    it('should have a date with time and record body', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('2020-01-20 10:00 foo bar #baz');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].date.text).to.equal('2020-01-20 10:00');
      expect(parser.results[0].tag[0].text).to.equal('#baz');
      expect(parser.results[0].body).to.equal('foo bar #baz');
    });

    it('should have a date with time ISO 8601 UTC format and record body', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('2020-01-20T10:00Z foo bar #baz');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].date.text).to.equal('2020-01-20T10:00Z');
      expect(parser.results[0].tag[0].text).to.equal('#baz');
      expect(parser.results[0].body).to.equal('foo bar #baz');
    });
  });

  describe('Folder form', async () => {
    it('should have one seg folder and text', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo bar #baz');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder[0].text).to.equal('/foo');
      expect(parser.results[0].tag[0].text).to.equal('#baz');
      expect(parser.results[0].body).to.equal('bar #baz');
    });

    it('should have folder only', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder[0].text).to.equal('/foo');
      expect(parser.results[0].body).to.equal('');
    });


    it('should have 3 segs and text', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo/bar/baz qux');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder.reduce((acc, i) => acc += i.value, '')).to.equal('/foo/bar/baz');
      expect(parser.results[0].body).to.equal('qux');
    });

    it('should have an error with the folder', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/fo#o/bar/baz qux');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].error[0].value.type).to.equal('INVALID_FOLDER_FORMAT');
      expect(parser.results[0].body).to.equal('#o/bar/baz qux');
    });

    it('should have multiple errors', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/fo#o/bar/baz #qu!x');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].error.length).to.equal(2);
    });
  });

  describe('TODO form', () => {
    it('should register as a todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('TODO foo bar');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].todo).to.equal(true);
      expect(parser.results[0].body).to.equal('foo bar');
    });

    it('should not register as a todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('foo TODO bar');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].todo).to.equal(null);
      expect(parser.results[0].body).to.equal('foo TODO bar');
    });

    it('should register as a done even with weird case', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('TOdo foo');

      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].todo.value).to.equal(true);
    });

    it('should register as an empty todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('TODO');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].todo).to.equal(true);
    });

    it('should register as an empty todo whitespace is not a problem', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('       TODO          ');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].todo).to.equal(true);
    });

    it('should register as a done', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('DONE foo');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(true);
      expect(!!parser.results[0].todo).to.equal(false);
    });

    it('should register as a done and not register a todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('DONE TODO foo');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(true);
      expect(!!parser.results[0].todo).to.equal(false);
    });

    it('should register as a done and not register a todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('TODO DONE foo');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(false);
      expect(!!parser.results[0].todo).to.equal(true);
    });

    it('should register as a done even with weird case', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('DOnE foo');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(true);
    });

    it('should register as an empty done', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('DONE');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(true);
    });

    it('should register as a todo with a bunch of standard tokens', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('DONE foo #bar !baz');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].done).to.equal(true);
      expect(parser.results[0].body).to.equal('foo #bar !baz')
    });

    it('should register the todo and the folder', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo TODO bar');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder[0].text).to.equal('/foo');
      expect(parser.results[0].body).to.equal('bar');
      expect(!!parser.results[0].todo).to.equal(true);
    });

    it('should register the done and the folder', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo DONE bar');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder[0].text).to.equal('/foo');
      expect(parser.results[0].body).to.equal('bar');
      expect(!!parser.results[0].done).to.equal(true);
    });


    it('should register the done and the folder even with a trailing slash on the path', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo/ DONE bar');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].folder[0].text).to.equal('/foo');
      expect(parser.results[0].body).to.equal('bar');
      expect(!!parser.results[0].done).to.equal(true);
    });

    it('should register the folder with no todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo TODOnt bar');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].todo).to.equal(false);
    });
  });

  describe('Reaction form', () => {
    // TODO: Create tests for each of the different reaction types

    it('Should find a reaction', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('Liked “foo #bar !baz”', '????????????????????');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].reaction.value.record).to.equal('foo #bar !baz')
      expect(parser.results[0].reaction.value.reaction).to.equal('LIKE')
    })

    it('Should find a reaction even if the end quote is missing', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('Liked “foo #bar !baz');
      // NOTE: one of the limitations at the moment is in the event the end character is missing
      // i will be one character down thus creating an invalid "text" field
      // this is OK for now, one solution is to add an unlikely unicode character to the end of every
      // parse stream going into the parser so that i have something to latch onto at the end.
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].reaction.value.record).to.equal('foo #bar !ba');
      expect(parser.results[0].reaction.value.reaction).to.equal('LIKE');
    })
  });

  describe('Beans', () => {
    it('Should find a bean with a +', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('+$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
      expect(parser.results[0].bean[0].value.sign).to.equal('+');
    });

    it('Should find a bean with a -', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean[0].value.sign).to.equal('-');
    });

    it('Should find a bean with a decimal', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:100.01');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean[0].value.value).to.equal('100.01');
    });

    it('Should not find a bean with a decimal starting with "."', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:.01');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
    });

    it('Should find a bean with a decimal starting with "0"', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:0.01');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
    });

    it('Should find a bean with a decimal ending with "." but also include an error', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:10.');

      expect(parser.results.length).to.equal(1);

      expect(parser.results[0].bean.length).to.equal(1);
      expect(parser.results[0].error.length).to.equal(1);
    });


    it('Should find a bean with a + even when there is a folder', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('/foo +$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a tag', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('#foo +$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a todo', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('todo +$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1)
    })

    it('Should find a bean with a + even when there is a done', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('done +$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1)
    })


    it('Should find multiple beans', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-foo +$:100');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(2)
    })


    it('Should find a bean with a + and an emoji', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('+☔');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1)
    })

    it('Should find a bean with a -', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$:1');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
    });

    it('Should not find a bean when there is no symbol', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-1');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(0)
    });

    it('Should find a bean when there is no number', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
    });

    it('Should find a bean when the symbol is more than two regular characters', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('-$$$$$:1');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].bean.length).to.equal(1);
    });
  });


  describe('Formulas', () => {
    it('Should find a formula without a name', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(+ 1 1) ');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find a formula with nothin', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find a formula with name only', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$(foo)');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find a formula with quoted name', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$("Foo bar") ');

      expect(parser.results.length).to.equal(1);

      expect(parser.results[0].formula[0].value.name).to.equal('Foo bar');
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find a formula with func with quoted arg', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$( "Foo bar") (BEAN "Baz Qux") ');

      expect(parser.results.length).to.equal(1);

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

      expect(parser.results[0].formula[0].value.procedure).to.deep.equal(proc);
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find a formula with func with a special character arg', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(BEAN $)');

      expect(parser.results.length).to.equal(1);

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

      expect(parser.results[0].formula[0].value.procedure).to.deep.equal(proc);
      expect(parser.results[0].formula.length).to.equal(1);
    });

    it('Should find 2 formulas', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(+ 1 1) $$()(+ 2 2)');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(2);
    });

    it('Should find a formula with nested functions', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$() (+ (- 1 1) 1) ');

      expect(parser.results.length).to.equal(1);

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

      expect(parser.results[0].formula.length).to.equal(1);
      expect(parser.results[0].formula[0].value.procedure).to.deep.equal(proc);
    });

    it('Should find a formula with nested functions args before', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(+ 1 1 (- 1 1)) ');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
      expect(parser.results[0].error.length).to.equal(0);
    });

    it('Should find a formula with nested functions args after', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(+ (- 1 1) 1 1) ');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
      expect(parser.results[0].error.length).to.equal(0);
    });

    it('Should find a formula with nested functions args before and after', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$()(+ 1 (- 1 1) 1) ');

      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1);
      expect(parser.results[0].error.length).to.equal(0);
    });

    it('Should find a formula with a name', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$(foo) (+ 1 1)');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1)
      expect(parser.results[0].formula[0].value.name).to.equal('foo');
    });

    it('Should create an error in the formula because of multiple names', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$(foo bar) (+ 1 1)');
      expect(parser.results.length).to.equal(1);
      expect(parser.results[0].formula.length).to.equal(1)
      expect(parser.results[0].formula[0].value.name).to.equal('foo');
    });

    it('Should find a formula with an error', () => {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$(foo) (+ 1 1 :$');

      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)
    });

    it('Should find an incomplete formula', () => {
      let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+ 1 1 ');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+ 1');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (!! foo');

      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) ');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo ');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ ( ');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ ');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(false)
      expect(parser.results[0].formula.length).to.equal(1)
    });

    it('Should find an incomplete formula with an error', () => {
      let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+ 1 1 !! foo');
      
      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+ !! foo');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) (+ 1 !! foo');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ (foo) !! foo');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ ( !! foo');
      expect(parser.results.length).to.equal(1);
      expect(!!parser.results[0].formula[0].error).to.equal(true);
      expect(parser.results[0].formula.length).to.equal(1)

      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      parser.feed('$$ !! foo');

      expect(parser.results.length).to.equal(1);

      expect(!!parser.results[0].formula[0].error).to.equal(true)
      expect(parser.results[0].formula.length).to.equal(1)
    });
});
});
