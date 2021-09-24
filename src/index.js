import Handlebars from 'handlebars'
import fs from 'fs'
import YAML from 'js-yaml'

const TEXT_SPEED_Y = 12.9 / 10.0
const LINE_HEIGHT = 0.5

const cleanString = str => str.split('\n').map(s => s.trim()).filter(s => !!s).join('\\n')
const createStyledString = (str, style) => {
  if (style.color) {
    str = `<hex_${style.color}>${str}</>`
  }

  if (style.size) {
    str = `<s_${style.size}>${str}</>`
  }

  return str
}

let messageId = 1000
let lastAt = -1337
let blockStarted = false

Handlebars.registerHelper('text', function (options) {
  let at = options.hash.at
  let alignment = 1
  let hAnchor = 1
  let vAnchor = 1
  let fadeIn = 0
  let fadeOut = 0
  const x = options.hash.x ?? 0

  if (at === undefined) {
    at = lastAt + (blockStarted ? (LINE_HEIGHT * (options.hash.spacing ?? 0)) : 0)
  }

  if (options.hash.anchor === 'left') {
    hAnchor = 0
  }
  if (options.hash.anchor === 'right') {
    hAnchor = 2
  }

  blockStarted = true
  messageId++
  lastAt = at

  return new Handlebars.SafeString(
    [
      `1|${at}|${TEXT_SPEED_Y * 10}|${messageId}|${x}|-5.0|${cleanString(options.fn(this))}|${alignment}|${hAnchor}|${vAnchor}|${fadeIn}|${fadeOut}`,
      `2|${at}|${TEXT_SPEED_Y * 10}|${messageId}|${x}|-5.0|${x}|5.0`,
    ].join('\n') + '\n')
})

Handlebars.registerHelper('style', function (options) {
  return new Handlebars.SafeString(createStyledString(cleanString(options.fn(this)), options.hash))
})

Handlebars.registerHelper('rainbow_style', function (options) {
  const colors = options.hash.colors.split(',')
  let nextColor = 0
  return cleanString(options.fn(this)).split('').map(letter => {
    const styledLetter = createStyledString(letter, {
      ...options.hash,
      color: colors[nextColor],
    })
    nextColor++
    if (nextColor >= colors.length) {
      nextColor = 0
    }
    return styledLetter
  }).join('')
})

Handlebars.registerHelper('block', function (options) {
  blockStarted = false
  lastAt = options.hash.at ?? lastAt
  return options.fn(this)
})

Handlebars.registerHelper('two_columns', function (context, options) {
  return options.fn({
    column1: context.slice(0, context.length / 2),
    column2: context.slice(context.length / 2, context.length)
  })
})

const template = Handlebars.compile(await fs.promises.readFile('./data/credits.hbs', {encoding: 'utf-8'}))
const data = YAML.load(await fs.promises.readFile('./data/credits.yaml', {encoding: 'utf-8'}))

await fs.promises.writeFile('./credits', template(data))

