@{%

const moo = require("moo");
let lexer = require('./states');
const postProcessor = require('./postProcessors');
const { _ } = postProcessor;

%}

# Pass your lexer object using the @lexer option:
@lexer lexer

main
  ->
    _ ((%date __):? note_body) _ {% _('second', 'flatten', 'flatten', 'filter', 'rollup') %}
  | _ ((%date __):? folder_form)  _ {% _('second', 'flatten', 'flatten', 'filter',  'rollup') %}  
  | _ ((%date __):? todo_form) _ {% _('second', 'flatten', 'flatten', 'filter', 'rollup') %}
  | reaction_form {% _('rollup') %}

reaction_form
  ->
  %reaction_open %text_blob:? %reaction_close:? %error:? {% _('flatten', 'filter', 'reaction') %}

folder_form
  ->
  %folder:+ %error:? (__ note_body):? {% _('flatten', 'flatten', 'filter') %}
  | %folder:+ __ todo_form {% _('flatten', 'filter') %}

todo_form
  ->
  (%todo | %done) (__ note_body):? {% _('flatten', 'flatten', 'filter') %}

note_body
  ->
  standard_token (__ standard_token):* {% _('flatten', 'flatten', 'flatten') %}

standard_token
  ->
  ( %tag %error:? | %event %error:? | %url %error:? | %word %error:? | %bean %error:? | formula )  {% _('flatten', 'flatten', 'filter') %}

formula
  ->
  # valid state
  %formula_open _ %lparen _ %arg:? _ %rparen _ func {% _('formula') %}

  # incomplete states
  | %formula_open {% _('formula') %}
  | %formula_open _ %lparen {% _('formula') %}
  | %formula_open _ %lparen _ %arg {% _('formula') %}
  | %formula_open _ %lparen _ %arg:? _ %rparen {% _('formula') %}

  # error states
  | %formula_open _ %error {% _('formula') %}
  | %formula_open _ %lparen _ %error {% _('formula') %}
  | %formula_open _ %lparen _ %arg _ %error {% _('formula') %}
  | %formula_open _ %lparen _ %arg:? _ %rparen _ %error {% _('formula') %}

func
  ->
  %lparen _ %operator __ (%arg _ | func _):* %rparen {% _('func') %}
  | %lparen _ %operator __ (%arg _ | func _ ):* (%arg | func) (_ %error):? {% _('func') %}
  | %lparen _ %operator __ %error:? {% _('func') %}
  | %lparen _ %operator %error:? {% _('func') %}
  | %lparen _ %error:? {% _('flatten', 'filter', 'error') %}

_
->
  %space:* {% _('first', 'flatten') %}
__
->
  %space:+ {% _('first', 'flatten') %}
