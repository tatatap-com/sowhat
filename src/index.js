const lexer = require('./states')
const parser = require('./parser')

exports.parse = parser

exports.tokenize = function (input) {
  lexer.reset(input)
  return Array.from(lexer)
}
