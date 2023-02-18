//
// PARSER COMBINATORS
//

const addParensInRegexForSplit =
  re => new RegExp("("+(""+re).slice(1,(""+re).lastIndexOf("/"))+")")

const isString = myVar => typeof myVar === 'string' || myVar instanceof String
const isError = v => Array.isArray(v) && v.length === 2 && Number.isFinite(v[0])

// BASIC PARSER
// returns a parser which recognizes specified pattern at start of string
// A parser takes a string and returns a tuple of an AST which the parser
// accepts and the rest of the input
// a parser may also return a string in the case of an error
match = (pattern, errorMsg = null) => (
  input => {
    re = new RegExp(pattern) //cast to regex
    const [test,...[head,...tail]] = input.split(addParensInRegexForSplit(re))
    let err_msg = isString(errorMsg) ? errorMsg : `Error: Could not match ${re}`
    return test == '' ? [head,tail.join('')] : [0, err_msg]
  }
)


// BASIC COMBINATORS
// sequence parser combinator ⊛ 
andThen = (parser1, parser2) => (
  input => {
    let res1 = parser1(input)
    if (isError(res1)) return res1
    const [firstParsed,restInput1] = res1
    let res2 = parser2(restInput1)
    if (isError(res2))
      return [(input.length - restInput1.length) + res2[0],res2[1]]
    const [secondParsed,restInput2] = res2
    return [[firstParsed,secondParsed],restInput2]
  }
)

// disjunction parser combinator ⊕ 
orElse = (parser1, parser2, custom_error = null) => (
  input => {
    let res1 = parser1(input)
    if (!isError(res1)) return res1
    let res2 = parser2(input)
    if (!isError(res2)) return res2
    return isString(custom_error) ? [res1[0],custom_error] : res1
  }
)

// map parser combinator
map = (parser, func) => (
  input => {
    let res1 = parser(input)
    if (isError(res1)) return res1
    const [parsed,restInput] = res1
    return [func(parsed),restInput]
  }
)


// Errors

// TODO actually display the line instead of 10 chars before and after
// TODO alos display on a newline the position of the using '^'
const displayline = (wholestr, pos) =>
  wholestr.substring(Math.max(0, pos-10), Math.min(pos+10, wholestr.length))

displayError = (parser) => (
  input => {
    const res = parser(input)
    if (isError(res)) {
      //const error_position = res[0]
      //const error_message = res[1]
      console.log(displayline(input, res[0]) + `\n ${res[1]}`)
    }
    return res
  }
)


// COMPLEX COMBINATORS
choice = parsers => parsers.reduce(orElse)


// Useful basic examples
parseLowercase = match(/[a-z]/, 'Error: could not match lowercase char')
parseUppercase = match(/[A-Z]/, 'Error: could not match uppercase char')
parseChar = orElse(parseLowercase, parseUppercase, 'Error: Could not match char')
parseDigit = match(/[0-9]/, 'Error: could not match digit')
parseWhitespace = match(/\s+/, 'Error: could not match whitespace')
parseWord = match(/[A-Za-z]+/, 'Error: Could not match word')
