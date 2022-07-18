import moo from 'moo'

import formulaStateFactory from './formula-states.js'

import {
  SYMBOL_PATTERN,
  WS_PATTERN,
  DATETIME_PATTERN,
  FOLDER_PATTERN,
  REACTION_PATTERN,
  TAG_PATTERN,
  MENTION_PATTERN,
  CELL_PATTERN,
  EVENT_PATTERN,
  BEAN_PATTERN,
  URL_PATTERN,
  FORMULA_OPEN_PATTERN,
  LINK_PATTERN,
  PIN_PATTERN,
  TODO_DONE_KW,
  QUOTED_NAME_PATTERN
} from './constants.js'

const standard_tokens = {
  tag: {match: TAG_PATTERN, push: 'tag', value: t => {
    if (QUOTED_NAME_PATTERN.test(t)) {
      return t.substring(2, t.length - 1);
    } else {
      return t.substring(1).toLowerCase()
    }
  }},

  mention: {match: MENTION_PATTERN, push: 'mention', value: t => {
    return t.substring(1).toLowerCase()
  }},

  cell: {match: CELL_PATTERN, push: 'cell', value: t => {
    let symbol
    let value
    let unit

    let rest = t.substring(1);
    if (QUOTED_NAME_PATTERN.test(rest)) {
      const quotedText = rest.match(QUOTED_NAME_PATTERN)[0]
      symbol = quotedText.substring(1, quotedText.length - 1)

      rest = rest.substring(quotedText.length)

      const nI = rest.indexOf(':')

      const uI = rest.indexOf(',')

      value = nI === -1 ?
              '0' :
              (uI === -1 ? rest.substring(nI + 1) : rest.substring(nI + 1, uI)).toLowerCase()
      unit = uI === -1 ? null : rest.substring(uI + 1)

    } else {
      const nI = rest.indexOf(':')

      symbol = (nI === -1 ? rest.substring(0) : rest.substring(0, nI)).toLowerCase()

      const uI = rest.indexOf(',')

      value = nI === -1 ?
              '1' :
              (uI === -1 ? rest.substring(nI + 1) : rest.substring(nI + 1, uI)).toLowerCase()
      unit = uI === -1 ? null : rest.substring(uI + 1)

    }

    return {
      value,
      symbol,
      unit
    }
  }},

  event: {match: EVENT_PATTERN, push: 'event', value: t => {
    const isOpenRange = /(?:…|[\.]{3})$/.test(t);
    const isCloseRange = /^(?:…|[\.]{3})/.test(t);

    let labelPortion = isOpenRange ? t.substring(1, t.length - 3) :
                       isCloseRange ? t.substring(3, t.length) : t.substring(1, t.length);

    if (QUOTED_NAME_PATTERN.test(t)) {
      return {
        label: labelPortion.substring(1, labelPortion.length - 1),
        isRange: isOpenRange || isCloseRange,
        form: isOpenRange ? 'open' : isCloseRange ? 'close' : 'point'
      }
    } else {
      return {
        label: labelPortion.toLowerCase(),
        isRange: isOpenRange || isCloseRange,
        form: isOpenRange ? 'open' : isCloseRange ? 'close' : 'point'
      }
    }
  }},

  url: { match: URL_PATTERN, push: 'url' },
  bean: { match: BEAN_PATTERN, push: 'bean', value: (t) => {
    const sign = t.substring(0,1);
    let symbol;
    let value;

    const rest = t.substring(1);
    if (QUOTED_NAME_PATTERN.test(rest)) {
      const quotedText = rest.match(QUOTED_NAME_PATTERN)[0];
      symbol = quotedText.substring(1, quotedText.length - 1);
      value = rest.substring(quotedText.length + 1);
      value = value ? value : '1';
    } else {
      const nI = rest.search(/:/);
      symbol = (nI === -1 ? rest.substring(0) : rest.substring(0, nI)).toLowerCase();
      value = nI === -1 ? '1' : rest.substring(nI + 1)
    }

    return {
      sign,
      value,
      symbol
    }
  }},
  formula_open: {
    match: FORMULA_OPEN_PATTERN,
    next: 'formula-open'
  },

  link: {
    match: LINK_PATTERN,
    push: 'standard'
  },

  word: {
    match: SYMBOL_PATTERN,
    next: 'standard',
    lineBreaks: true
  },
}

export default moo.states({
  main: {
    pin: {
      match: PIN_PATTERN,
      next: 'pin',
      lineBreaks: false,
      value: t => {
        const seq = t.substring(1)
        return seq ? seq : '0'
      }
    },

    date: {
      match: DATETIME_PATTERN,
      next: 'date',
      lineBreaks: false,
      value: t => {
        try {
          return (new Date(t)).toISOString()
        } catch (err) {
          return {
            type: 'INVALID_DATE_FORMAT',
            message: 'Not a valid date.',
            text: t
          }
        }
      }
    },

    link: {
      match: LINK_PATTERN,
      push: 'standard'
    },

    folder: {  match: FOLDER_PATTERN, next: 'folder', value: t => {
      if (QUOTED_NAME_PATTERN.test(t)) {
        return '/' + t.substring(2, t.length - 1);
      } else {
        return t.toLowerCase()
      }
    }},



    reaction_open: { match: REACTION_PATTERN, next: 'reaction'}, // TODO: decide if this should go to main or push on to standard

    ...standard_tokens,

    word: {
      type: TODO_DONE_KW,
      match: SYMBOL_PATTERN,
      next: 'standard',
      lineBreaks: true
    },

    space: {  match: WS_PATTERN, lineBreaks: true}, // can match any amount of ws at the beginning
  },

  standard: {
    space: { match: WS_PATTERN, lineBreaks: true },
    ...standard_tokens
  },


  pin: {
    space: { match: WS_PATTERN, lineBreaks: true },

    date: {
      match: DATETIME_PATTERN,
      next: 'date',
      lineBreaks: false,
      value: t => {
        try {
          return (new Date(t)).toISOString()
        } catch (err) {
          return {
            type: 'INVALID_DATE_FORMAT',
            message: 'Not a valid date.',
            text: t
          }
        }
      }
    },

    folder: {
      match: FOLDER_PATTERN,
      next: 'folder',
      value: t => {
        if (QUOTED_NAME_PATTERN.test(t)) {
          return '/' + t.substring(2, t.length - 1);
        } else {
          return t.toLowerCase()
        }
      },

      ...standard_tokens,

      word: {
        type: TODO_DONE_KW,
        match: SYMBOL_PATTERN,
        next: 'standard',
        lineBreaks: true
      }
    },

    ...standard_tokens,

    word: {
      type: TODO_DONE_KW,
      match: SYMBOL_PATTERN,
      next: 'standard',
      lineBreaks: true
    }
  },

  date: {
    space: { match: WS_PATTERN, lineBreaks: true },

    folder: {  match: FOLDER_PATTERN, next: 'folder', value: t => {
      if (QUOTED_NAME_PATTERN.test(t)) {
        return '/' + t.substring(2, t.length - 1);
      } else {
        return t.toLowerCase()
      }
    }},

    ...standard_tokens,

    word: {
      type: TODO_DONE_KW,
      match: SYMBOL_PATTERN,
      next: 'standard',
      lineBreaks: true
    }
  },

  reaction: {
    reaction_close: { match: /\u201d/ },
    text_blob: { match: /[\S\s]+(?!$)/, lineBreaks: true },
    error: {
      match: /[\S\s]+$/,
      lineBreaks: true,
      value: (t) => {
        return {
          type: 'INVALID_REACTION_FORMAT',
          message: 'Missing end quote.',
          text: t
        }
      }
    }
  },

  folder_standard_start: {
    space: { match: WS_PATTERN, lineBreaks: true, next: 'standard' },
    ...standard_tokens,
    word: {
      type: TODO_DONE_KW,
      match: SYMBOL_PATTERN,
      next: 'standard', lineBreaks: true
    }
  },

  folder: {
    folder: {match: FOLDER_PATTERN, value: t => {
      if (QUOTED_NAME_PATTERN.test(t)) {
        return '/' + t.substring(2, t.length - 1);
      } else {
        return t.toLowerCase()
      }
    }},
    space: {match: WS_PATTERN, lineBreaks: true, next: "folder_standard_start"},
    error: {match: SYMBOL_PATTERN, error: true, next: "folder_standard_start", value: (t) => {
      return {
        type: 'INVALID_FOLDER_FORMAT',
        text: t
      }
    }}
  },

  tag: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_TAG_FORMAT',
        text: t
      }
    }}
  },

  cell: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_CELL_FORMAT',
        text: t
      }
    }}
  },

  mention: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_MENTION_FORMAT',
        text: t
      }
    }}
  },

  event: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_EVENT_FORMAT',
        text: t
      }
    }}
  },

  url: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_URL_FORMAT',
        text: t
      }
    }}
  },

  // +$100 or -$100
  bean: {
    space: {match: WS_PATTERN, lineBreaks: true, next: 'standard'},
    error: {match: SYMBOL_PATTERN, error: true, next: 'standard', value: (t) => {
      return {
        type: 'INVALID_BEAN_FORMAT',
        text: t
      }
    }}
  },

  ...formulaStateFactory('', 'standard'),
})


