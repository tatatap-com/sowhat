const {
  NUMBER_PATTERN,
  PI_PATTERN
} = require('./constants');

const seg = (i) => (segs) => segs[i]

const funcs = {
  first: seg(0),
  second: seg(1),
  filter: d => d.filter(i => !!i),
  flatten: (d) => {
    return d.flat();
  },

  error: d => {
    if (Array.isArray(d)) {
      return d.reduce((acc, i) => {
        acc.text += i.text;
        if (i.type === 'error') {
          acc.value = i.value;
          acc.type = 'error';
        }

        return acc;
      }, { text: '' })
    }

    return d;
  },

  func: d => {
    const tokens = d.flat().flat().flat().filter(i => !!i);

    const error = tokens.reduce((acc, t) => {
      if (t.type === 'error') acc = t.value;
      return acc;
    }, null);

    return {
      type: !!error ? 'error' : 'func',
      operator: d[2].text,
      args: Array.isArray(d[4]) ? d[4].flat().flat().filter(i => i.type !== 'space').map(i => {
        if (!!i.operator) {
          return i;
        } else if (PI_PATTERN.test(i.value)) {
          return Math.PI.toString();
        } else {
        return i.value;
        }
      }) : [],
      text: tokens.reduce((acc, t) => acc += t.text, ''),
      error,
      offset: d[0].offset,
      line: d[0].line,
      col: d[0].col,
      lineBreaks: tokens.reduce((acc, t) => acc || t.lineBreaks, false),
    }
  },

  formula: d => {
    const tokens = d.flat().flat().flat().filter(i => !!i);
    const procedure = tokens.find(t => t.type === 'func') || null;
    const error = tokens.find(t => t.type === 'error') || null;
    const arg = tokens.find(t => t.type === 'arg');

    return {
      type: 'formula',
      value: {
        name: !!arg ? arg.value : null,
        procedure: procedure
      },
      text: tokens.reduce((acc, t) => acc += t.text, ''),
      offset: d[0].offset,
      line: d[0].line,
      col: d[0].col,
      lineBreaks: tokens.reduce((acc, t) => acc || t.lineBreaks, false),
      error
    }
  },

  identity: i => i,

  debug: i => {
    console.log(`
%%%%%%%%%%%%%%%%%%%%%%%%
${JSON.stringify(i, null, ' ')}
%%%%%%%%%%%%%%%%%%%%%%%%`);
    return i;
  },
  reaction: d => {
    const reactionMap = {
      'LOVED': 'LOVE',
      'LIKED': 'LIKE',
      'DISLIKED': 'DISLIKE',
      'LAUGHED AT': 'LAUGH',
      'QUESTIONED': 'QUESTION',
      'EMPHASIZED': 'EMPHASIZE'
    };

    return d.reduce((res, t) => {
      res.text += t.text;
      if (t.type === 'text_blob') {
        res.value.record = t.value;
      } else if (t.type === 'reaction_open') {
        res.value.reaction = reactionMap[t.text.substr(0, t.text.length - 2).toUpperCase()];
      }

      return res;
    }, {
      type: 'reaction',
      value: {},
      text: '',
      offset: 0,
      line: 0,
      col: 0,
      lineBreaks: false
    })
  },
  rollup: d => {
    const res = d.reduce((res, t) => {

      // Capture the raw text
      res.text += t.text;

      // Capture everything but the folder, todo, done
      if (!['date', 'folder', 'todo', 'done'].includes(t.type)) {
        res.body += t.text;
      }

      if (t.type in res && Array.isArray(res[t.type])) {
        // Capture all standard tokens
        res[t.type].push({
          value: t.value,
          text: t.text,
          offset: t.offset,
          line:t.line,
          col: t.col,
          lineBreaks: t.lineBreaks,
          error: t.error || null
        });
      } else if (t.type in res) {
        // Capturing all one-per-note tokens
        res[t.type] = {
          value: t.value,
          text: t.text,
          offset: t.offset,
          line:t.line,
          col: t.col,
          lineBreaks: t.lineBreaks,
          error: t.error || null
        };
      }

      return res;
    }, {
      date: null,
      reaction: null,
      folder: [],
      todo: null,
      done: null,
      tag: [],
      event: [],
      url: [],
      bean: [],
      error: [],
      formula: [],
      text: '',
      body: ''
      // tokens: d
    });

    // Post rollup cleanup
    res.body = res.body.trim();

    return res;
  }

}

const _ = (...fns) => {
  return function (d) {
    let term = d;

    fns.forEach(f => {
      if (typeof funcs[f] !== 'function') {
        const msg = `No such function ${f}`
        throw msg;
      }
      term = funcs[f](term)
    })

    return term;
  }
}

module.exports = { _ }
