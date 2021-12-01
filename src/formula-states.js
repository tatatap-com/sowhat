const {
  SYMBOL_PATTERN,
  WS_PATTERN,
  OPERATOR_PATTERN,
  ARG_PATTERN,
  FORMULA_CLOSE_PATTERN,
  QUOTED_NAME_PATTERN,
  LPAREN,
  RPAREN

} = require('./constants');

const argValue = t => {
  if (QUOTED_NAME_PATTERN.test(t)) {
    return t.substring(1, t.length - 1);
  } else if (t === '-') {
    return null;
  } else {
    return t;
  }
};

module.exports = function (prefix, fallback = 'standard') {
  const prepend = prefix ? prefix + '_' : ''

  return {
    [prepend + 'formula-open']: {
      space: {match: WS_PATTERN, lineBreaks: true },

      lparen:  { match: '(', next: prepend + 'formula-setup-name'},

      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_OPEN_FORMAT',
          text: t
        }
      }},
    },

    [prepend + 'formula-setup-name']: {
      arg: {match: ARG_PATTERN, next: prepend + 'formula-setup-close', value: argValue},
      rparen: {match: ')', next: prepend + 'formula-func-open'},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_SETUP_NAME_FORMAT',
          text: t
        }
      }}
    },
    [prepend + 'formula-setup-close']: {
      rparen:  { match: ')', next: prepend + 'formula-func-open'},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_SETUP_CLOSE_FORMAT',
          text: t
        }
      }}
    },

    [prepend + 'formula-func-open']: {
      space: {match: WS_PATTERN, lineBreaks: true },
      lparen:  { match: '(', next: prepend + 'formula-func-operator'},
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_FUNC_OPEN_FORMAT',
          text: t
        }
      }}
    },


    [prepend + 'formula-func-operator']: {
      space: {match: WS_PATTERN, lineBreaks: true },

      operator: { match: OPERATOR_PATTERN, next: prepend + 'formula-func' },

      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_FUNC_OPERATOR_FORMAT',
          text: t
        }
      }},
    },

    [prepend + 'formula-func']: {
      space: {match: WS_PATTERN, lineBreaks: true },
      lparen:  { match: '(', push: prepend + 'operator'},
      rparen: {
        match: ')',
        next: fallback
      },
      arg: { match: ARG_PATTERN, value: argValue },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FORMULA_FUNC_FORMAT',
          text: t
        }
      }}
    },

    
    [prepend + 'func']: {
      space: {match: WS_PATTERN, lineBreaks: true },
      rparen:  { match: ')', pop: true },
      lparen:  { match: '(', push: prepend + 'operator' },
      // TODO: I could split the operators into ones that take normal args like numbers and things and operators like ! = that accept a search pattern, which is a collection of tokens that represent the query the same that would be passed to the command ":" function

      arg: { match: ARG_PATTERN, value: argValue },
      
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_FUNCTION_FORMAT',
          text: t
        }
      }},
    },

    [prepend + 'operator']: {
      operator: { match: OPERATOR_PATTERN, next: prepend + 'func' },
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_OPERATOR_FORMAT',
          text: t
        }
      }},
    },

  }
}
