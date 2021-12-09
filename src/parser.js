const lexer = require('./states')
const {PI_PATTERN} = require('./constants')

const argVal = token => {
  if (PI_PATTERN.test(token.value)) {
    return Math.PI.toString()
  } else {
    return token.value
  }
}

const func = tokens => {
  let res = {
    type: 'func',
    operator: null,
    args: [],
    text: '',
    error: null,
    offset: tokens[0].offset,
    line: tokens[0].line,
    col: tokens[0].col,
    lineBreaks: 0
  }

  let error
  let text = ''
  let numTok = 0

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    if (t.type === 'operator') {
      numTok++
      res.text += t.text
      res.operator = t.value
    } else if (i !== 0 && t.type === 'lparen') {

      const {numTokens, token, err} = func(tokens.slice(i))

      numTok += numTokens
      i += numTokens

      res.text += token.text
      if (error) {
        res.type = 'error'
        error = err
        break
      }
      res.args.push(token)

    } else if (t.type === 'arg') {
      numTok++
      res.text += t.text
      res.args.push(argVal(t))
    } else if (t.type === 'error') {
      numTok++
      res.text += t.text
      res.error = true
      error = t
      break
    } else if (t.type === 'rparen') {
      numTok++
      res.text += t.text
      break
    } else if (t.type === 'lparen') {
      // NOTE this does not need to advance numTok because it is accounted for in the parent

      res.text += t.text
    } else {
      numTok++
      res.text += t.text
    }
  }

  return {numTokens: numTok, err: error, token: res}
}

const formula = tokens => {
  let error

  let res = {
    type: 'formula',
    value: {
      name: null,
      procedure: null
    },
    text: '',
    offset: tokens[0].offset,
    line: tokens[0].line,
    col: tokens[0].col,
    lineBreaks: 0,
    error: null
  }
  let numTok = 0
  let i = 0

  while (tokens[i] && ['error'].indexOf(tokens[i].type) === -1) {
    const t = tokens[i]
    numTok++
    res.text += t.text

    if (t.type === 'arg') {
      res.value.name = t.value
    } else if (t.type === 'rparen') {
      break
    }

    i++
  }

  for (i; i < tokens.length; i++) {
    const t = tokens[i]
    numTok++

    if (t.type === 'error') {
      res.error = true
      res.value.procedure = t.value
      break
    } else if (t.type === 'lparen') {

      const {numTokens, token, err} = func(tokens.slice(i))
      i += numTokens
      numTok += numTokens

      res.text += token.text
      if (err) {
        res.error = true
        res.value = err.value
      }
      res.value.procedure = token
      break
    } else if (t.type === 'rparen') {
      
    } else {
      res.text += t.text
    }
  }

  return {token: res, numTokens: numTok, error}
}

const reaction = tokens => {
  const reactionMap = {
    'LOVED': 'LOVE',
    'LIKED': 'LIKE',
    'DISLIKED': 'DISLIKE',
    'LAUGHED AT': 'LAUGH',
    'QUESTIONED': 'QUESTION',
    'EMPHASIZED': 'EMPHASIZE'
  }

  let numTokens = 0
  const res = {
    type: 'reaction',
    value: {},
    text: '',
    offset: 0,
    line: 0,
    col: 0,
    lineBreaks: 0
  }

  let error
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i]
    numTokens++
    res.text += t.text
    if (t.type === 'reaction_open') {
      res.value.reaction = reactionMap[t.text.substr(0, t.text.length - 2).toUpperCase()]
    } else if (t.type === 'reaction_close') {
      break
    } else if (t.type === 'text_blob') {
      res.value.record = t.value
    }  else if (t.type === 'error') {
      error = t
      break
    }
  }

  return {token: res, error, numTokens}
}


module.exports = function (input) {
  lexer.reset(input)
  const tokens = Array.from(lexer)
  const res = {
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
  }

  for(let i=0; i < tokens.length; i++){
    let t = tokens[i]

    // Capture everything but the folder, todo, done
    if (t.type === 'formula_open') {
      const {token, numTokens, error} = formula(tokens.slice(i))

      i += numTokens - 1 // NOTE the -1 here accounts for the 
      t = token

    } else if (t.type === 'reaction_open') {

      const {token, numTokens, error} = reaction(tokens.slice(i))

      if (error) {
        res.error.push(error)
      }

      i += numTokens - 1
      t = token
    }

    res.text += t.text

    if (!['date', 'folder', 'todo', 'done'].includes(t.type)) {
      res.body += t.text
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
      })
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
      }
    }
  }

  // Post rollup cleanup
  res.body = res.body.trim()
  return res
}
