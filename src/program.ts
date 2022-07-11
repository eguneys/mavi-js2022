export interface IAttributeData {
  tpe: string;
  size: number;
  location: number;
  name: string;
}

export interface IUniformData {
  name: string;
  index: number;
  location: WebGLUniformLocation;
}

export class Program {

  constructor(
    readonly uniformData: { [key: string]: IUniformData },
    readonly attributeData: { [key: string]: IAttributeData },
    readonly program: WebGLProgram) {}
}


export function generateProgram(gl: WebGL2RenderingContext,
vertexSource: string,
fragmentSource: string): Program {

  const gl_vShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource),
    gl_fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  const glProgram = gl.createProgram()!

  gl.attachShader(glProgram, gl_vShader)
  gl.attachShader(glProgram, gl_fShader)
  gl.linkProgram(glProgram)

  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    logProgramError(gl, glProgram, gl_vShader, gl_fShader)
  }

  let attributeData = getAttributeData(gl, glProgram)
  let uniformData = getUniformData(gl, glProgram)


  const keys = Object.keys(attributeData)

  for (let i = 0; i < keys.length; i++) {
    attributeData[keys[i]]["location"] = i
    gl.bindAttribLocation(glProgram, i, keys[i])
  }

  gl.linkProgram(glProgram)

  gl.deleteShader(gl_vShader)
  gl.deleteShader(gl_fShader)


  for (let i in uniformData) {
    let data = uniformData[i]
    uniformData[i]["location"] = gl.getUniformLocation(glProgram, i)!
  }

  return new Program(uniformData, attributeData, glProgram)
}

function getUniformData(gl: WebGL2RenderingContext, program: WebGLProgram): { [key: string]: IUniformData } {

  const res: { [key: string]: IUniformData } = {}
  const total = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)

  for (let i = 0; i < total; i++) {
    const uniformData = gl.getActiveUniform(program, i)!

    const data = { name: uniformData.name, location: -1, index: i }

    res[uniformData.name] = data
  }

  return res
}

function getAttributeData(gl: WebGL2RenderingContext, program: WebGLProgram): { [key: string]: IAttributeData } {
  const res: { [key: string]: IAttributeData } = {}

  const total = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)

  for (let i = 0; i < total; i++) {
    const attribData = gl.getActiveAttrib(program, i)!

    if (attribData.name.indexOf('gl_') === 0) {continue}

    //const tpe = mapType(gl, attribData.type)
    const data = {
      tpe: 'tpe',
      name: attribData.name,
      size: 0, // mapSize(tpe),
      location: i
    }

    res[attribData.name] = data

  }
  return res
}

function compileShader(gl: WebGL2RenderingContext, _type: number, src: string): WebGLShader {
const shader = gl.createShader(_type)!

gl.shaderSource(shader, src)
gl.compileShader(shader)

return shader
}

function logProgramError(gl: WebGL2RenderingContext,
program: WebGLProgram,
vertexShader: WebGLShader,
fragmentShader: WebGLShader): void {
  

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      logPrettyShaderError(gl, vertexShader)
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      logPrettyShaderError(gl, fragmentShader)
    }
    console.error(`Iksir: Couldn't initialize shader`)

    if(gl.getProgramInfoLog(program) !== '') {
      console.warn(`Iksir: gl.getProgramInfoLog()`, gl.getProgramInfoLog(program))
    }
  }


  }

function logPrettyShaderError(gl: WebGLRenderingContext, shader: WebGLShader): void
{
    const shaderSrc = gl.getShaderSource(shader)!
        .split('\n')
        .map((line, index) => `${index}: ${line}`)

    const shaderLog = gl.getShaderInfoLog(shader)!
    const splitShader = shaderLog.split('\n')

    const dedupe: Record<number, boolean> = {}


  const lineNumbers = splitShader.map((line) => 
    parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, '$1')))
  .filter((n) =>
    {
      if (n && !dedupe[n])
      {
        dedupe[n] = true

        return true
      }

      return false
    });

  const logArgs = ['']

  lineNumbers.forEach((number) =>
    {
      shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`
      logArgs.push('background: #FF0000; color:#FFFFFF; font-size: 10px', 'font-size: 10px')
    })
  const fragmentSourceToLog = shaderSrc
  .join('\n')

  logArgs[0] = fragmentSourceToLog

  console.error(shaderLog)

  console.groupCollapsed('click to view full shader code')
  console.warn(...logArgs)
  console.groupEnd()
}

