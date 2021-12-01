const nearley = require('nearley');
const grammar = require('./grammar');
const lexer = require('./states');

exports.parse = function (input) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(input);
  return parser.results[0];
}

exports.tokenize = function (input) {
  lexer.reset(input)
  return Array.from(lexer);
}
