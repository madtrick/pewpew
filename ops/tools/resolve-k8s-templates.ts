import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import traverse from 'traverse'
import * as mustache from 'mustache'

export interface Context {
  ImageTag: string
  ProjectId: string
}

export default function (options: { templatedFile: string, context: Context }): any {
  const {
    context,
    templatedFile
  } = options

  const pathToTemplateFile = path.resolve(process.cwd(), templatedFile)
  const templateYamls: object[] = yaml.safeLoadAll(
    fs.readFileSync(pathToTemplateFile, 'utf-8')
  )


  // Note: can't use fat arrow functions because the traverse library
  // exposes its functionality through `this` in the callback function
  const templated = templateYamls.map((templateYaml) => {
    return traverse(templateYaml).map(function (node: string | object): string | object {
      if (typeof node !== 'string') {
        return node
      }

      const templatedValue = mustache.render(node, context)
      return templatedValue
    })
  })

  const yamlStrings = templated.map((templatedYaml) => {
    return yaml.safeDump(templatedYaml)
  }).join('---\n')

  const templatedFileName = path.basename(templatedFile)
  const templatedFilePath = path.resolve(process.cwd(), 'ops/kubeconfigs', templatedFileName)

  fs.writeFileSync(templatedFilePath, yamlStrings)
}
