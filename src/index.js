import lexer from './states.js'
import parser from './parser.js'

export const tokenize = function (input) {
  lexer.reset(input)
  return Array.from(lexer)
}

export const parse = parser

export default {
  parse, tokenize
}

