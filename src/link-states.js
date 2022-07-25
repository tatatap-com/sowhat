import {
  SYMBOL_PATTERN,
  WS_PATTERN,
  OPERATOR_PATTERN,
  ARG_PATTERN,
  QUOTED_NAME_PATTERN,
  LPAREN,
  RPAREN

}  from './constants.js'

const argValue = t => {
  if (QUOTED_NAME_PATTERN.test(t)) {
    return t.substring(1, t.length - 1);
  } else if (t === '-') {
    return null;
  } else {
    return t;
  }
}

export default function (alternativeTokens) { // NOTE: alternative tokens are the standard set. here because we want to be able to fill a partial link without getting an error. the alternative is to make the whitespace syntax fixed (break to standard tokens on whitespace or something, this seems like a better solution)
  const fallback = 'standard'

  return {
    'link-open': {
      space: {match: WS_PATTERN, lineBreaks: true },

      lparen:  { match: '(', next: 'link-setup-url'},

      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_OPEN_FORMAT',
          text: t
        }
      }},
    },

    'link-setup-url': {
      href: {match: QUOTED_NAME_PATTERN, value: argValue, next: 'link-setup-title'},
      space: {match: WS_PATTERN, lineBreaks: true },
      rparen: {match: ')', next: 'link-img-open'},

      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_SETUP_FORMAT',
          text: t
        }
      }}
    },

    'link-setup-title': {
      title: {match: QUOTED_NAME_PATTERN, value: argValue, next: 'link-setup-close'},
      rparen:  { match: ')', next: 'link-img-open'},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_SETUP_CLOSE_FORMAT',
          text: t
        }
      }}
    },

    'link-setup-close': {
      rparen:  { match: ')', next: 'link-img-open'},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_SETUP_CLOSE_FORMAT',
          text: t
        }
      }}
    },



    'link-img-open': {
      space: {match: WS_PATTERN, lineBreaks: true },
      lparen:  { match: '(', next: 'link-img-url'},

      ...alternativeTokens
    },


    'link-img-url': {
      'img-src': {match: QUOTED_NAME_PATTERN, value: argValue, next: 'link-img-title'},
      space: {match: WS_PATTERN, lineBreaks: true },
      rparen:  { match: ')', next: fallback},
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_IMAGE_URL_FORMAT',
          text: t
        }
      }}
    },

    'link-img-title': {
      'img-title': {match: QUOTED_NAME_PATTERN, value: argValue, next: 'link-img-close'},
      rparen:  { match: ')', next: fallback},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_SETUP_CLOSE_FORMAT',
          text: t
        }
      }}
    },

    'link-img-close': {
      rparen:  { match: ')', next: fallback},
      space: {match: WS_PATTERN, lineBreaks: true },
      error: {match: SYMBOL_PATTERN, error: true, next: fallback, value: (t) => {
        return {
          type: 'INVALID_LINK_SETUP_CLOSE_FORMAT',
          text: t
        }
      }}
    },
  }
}
