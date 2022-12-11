//
// PARSER COMBINATORS
//

const addParensInRegexForSplit =
  re => new RegExp("("+(""+re).slice(1,(""+re).lastIndexOf("/"))+")")

const isString = myVar => typeof myVar === 'string' || myVar instanceof String
const isError = isString

// recognizer
// returns a parser which recognizes specified pattern at start of string
match = pattern => (
  input => {
    re = new RegExp(pattern) //cast to regex
    const [test,...[head,...tail]] = input.split(addParensInRegexForSplit(re))
    return test == '' ? [head,tail.join('')] : `Error: Could not match ${re}`
  }
)


// BASIC COMBINATORS

// sequence parser combinator ⊛ 
andThen = (parser1, parser2) => (
  input => {
    let res1 = parser1(input)
    if(isError(res1)) return res1   //TODO output where in code the error is
    const [firstParsed,restInput1] = res1
    let res2 = parser2(restInput1)
    if(isError(res2)) return res2
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
    return isError(custom_error) ? custom_error : res2
  }
)

// map parser combinator
// TODO use pipe() and helper functions to make this and the functions above pretty
map = (parser, func) => (
  input => {
    let res1 = parser(input)
    if(isError(res1)) return res1
    const [parsed,restInput] = res1
    return [func(parsed),restInput]
  }
)


// COMPLEX COMBINATORS

choice = parsers => parsers.reduce(orElse)

parseLowercase = match(/[a-z]/)
parseUppercase = match(/[A-Z]/)
parseChar = orElse(parseLowercase, parseUppercase, 'Error: Could not match character')
parseDigit = match(/[0-9]/)
parseWhitespace = match(/\s+/)

keepRight = (parser1, parser2) => map(andThen(parser1, parser2),
                                      x => {const [l,r] = x; return r})
keepLeft = (parser1, parser2) => map(andThen(parser1, parser2),
                                     x => {const [l,r] = x; return l})

function parseWordHelper(x) {
    return orElse(keepLeft(parseChar, parseWhitespace),
                  andThen(parseChar, parseWordHelper),
                  'Error: Could not match word')(x)
}
parseWord = map(parseWordHelper,
                x => [x].flat(Infinity).join(''))
