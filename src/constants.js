/* Credits
 * Currency portion of beans: https://stackoverflow.com/questions/25910808/javascript-regex-currency-symbol-in-a-string
 * Quoted string supporting escaped quotes: https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes
 * ISO 8601-ish datetime pattern: https://www.regextester.com/94925
 */

const moo = require("moo");

const LOVED = 'Loved “';
const LIKED = 'Liked “';
const DISLIKED = 'Disliked “';
const LAUGHED = 'Laughed at “'
const EMPH = 'Emphasized “'
const QUESTIONED = 'Questioned “';

const helpers = require('./helpers');

const LABEL_PORTION = '(?:(?:"(?:[^"\\\n]|\\.)*")|(?:(?:[\u1000-\uffff]|[a-zA-Z]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F])(?:[\u1000-\uffff]|[a-zA-Z0-9\-_]|[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F]){0,18}))';

const NUMBER_PATTERN = '(?:(?:[0-9]*\\.?[0-9]+|[0-9]+\\.?[0-9]*)(?:[eE][+-]?[0-9]+)?)';

module.exports = {
  SYMBOL_PATTERN: /\S+/,
  WS_PATTERN: /\s+/,

  QUOTED_NAME_PATTERN: /(?:"(?:[^"\\]|\\.)*")/,

  DATETIME_PATTERN: /(?:\d{4})-?(?:1[0-2]|0[1-9])-?(?:3[01]|0[1-9]|[12][0-9])(?:(?:[\sT])?(?:2[0-3]|[01][0-9]):?(?:[0-5][0-9]):?(?:[0-5][0-9])?(?:\.[0-9]+)?Z?)?/,

  // NOTE this collects all folder segments (post process splits by / and filters the empties, in other words the lexer is not broken by malformed, but very likely 'folder' statements)
  FOLDER_PATTERN: new RegExp('\/' + LABEL_PORTION + '?'),

  REACTION_PATTERN: new RegExp('(?:' + LOVED + '|' + LIKED + '|' + DISLIKED + '|' + LAUGHED + '|' + EMPH + '|' + QUESTIONED + ')'),

  // NOTE: this covers unicode chars including the quot which blows up the reaction form ending
  // Removed [\u2000-\u3300] because it includes quotes which break stuff. Need to test for more
  TAG_PATTERN: new RegExp('#' + LABEL_PORTION),

  EVENT_PATTERN: new RegExp(
    // Event point-in-time form and open form
    '(?:(?:!' + LABEL_PORTION + '(?:…|[\.]{3})?)|' +
    // Event close form
    '(?:(?:…|[\.]{3})' + LABEL_PORTION  +'))'),

  BEAN_PATTERN: new RegExp('[\+\-]' + LABEL_PORTION + '(?::' + NUMBER_PATTERN + ')?'),

  OPERATOR_PATTERN: /[\S]{1,42}/,

  ARG_PATTERN: new RegExp(LABEL_PORTION + '|' + NUMBER_PATTERN),

  NUMBER_PATTERN: new RegExp(NUMBER_PATTERN),
  PI_PATTERN: /(?:\ud83e\udd67|[Pp][Ii])/,

  URL_PATTERN: require('./urlPattern'),
  FORMULA_OPEN_PATTERN: /\$\$/,

  LPAREN: '(',
  RPAREN: '(',

  TODO_DONE_KW: moo.keywords({
    todo: helpers.casePermutations('todo'),
    done: helpers.casePermutations('done')
  })
}

