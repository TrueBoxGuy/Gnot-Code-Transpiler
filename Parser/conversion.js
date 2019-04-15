const fs = require("fs");
const parse = require("./parser.js").convert;
const operationInfo = require("./operationTypes.json"); //describes types operations take and if order of first two vars matter

const bitsPerVar = 32n;
const negativeMask = 2n ** (bitsPerVar - 1n);
const notNegativeMask = negativeMask - 1n;

const computerVersionRegister = letterReg => "abcdefghij".indexOf(letterReg);
const transpile = (str, ifRegister) => tags(convert(parse(str, ifRegister), ifRegister).split`\n`.filter(a => a).join`\n`);

function load(variables, variable, register) {
  const beforeMultiplier = (2n ** (BigInt(variables.indexOf(variable)) * bitsPerVar)); //multiply mask to put it in right position
  const mask = (2n ** bitsPerVar - 1n) * beforeMultiplier;
  const computerReg = computerVersionRegister(register);
  return transpile(`${register} = d & ${mask}
  ${register} = ${register} / ${beforeMultiplier}
  h = ${register} & ${negativeMask}
  h = h / ${negativeMask}
  if (h == 1) {
    ${register} = ${register} & ${notNegativeMask}
    ${register} = ${register} * -1
  }`, "h");
}

function store(variables, variable, register) {
  const selectAllBitMask = (2n ** (bitsPerVar * BigInt(variables.length))) - 1n;
  const beforeMultiplier = (2n ** (BigInt(variables.indexOf(variable)) * bitsPerVar));
  const dontSelectMask = (2n ** bitsPerVar - 1n) * beforeMultiplier;
  const mask = selectAllBitMask - dontSelectMask;
  const computerReg = computerVersionRegister(register);

  return transpile(`if (0 > ${register}) {
    ${register} = ${register} * -1
    ${register} = ${register} | ${negativeMask}
  }
  d = d & ${mask}
  ${register} = ${register} * ${beforeMultiplier}
  d = d | ${register}`, "h") //has effect on register, which will have another variable stored into it
}

function toGnelfOP(operation, types, variables) {
  const flip = arr => [arr[1], arr[0], ...arr.slice(2)];
  if (operation === "<") return toGnelfOP(">", flip(types), flip(variables));
  const possibilities = operationInfo[operation];
  if (!possibilities) {
    throw new Error(`${operation} is not a valid operation.`)
  }

  for (const key in possibilities[0]) {
    if (possibilities[0][key].every((elem, i) => elem === types[i])) return [key, variables]
    else if (!possibilities[1]) {
      const flipped = flip(types);
      const flippedVars = flip(variables);
      if (possibilities[0][key].every((elem, i) => elem === flipped[i])) return [key, flippedVars]
    }
  }
}


function convert(object, ifRegister, variables = false) {
  const computerIfRegister = computerVersionRegister(ifRegister);
  let string = "";
  if (!variables) {
    variables = object[1];
  }
  
  object[0].forEach(a => {
    const params = a[0].split` `;
    if (params[0] === "op") {
      const operation = toGnelfOP(params[1], a[1].types, params.slice(2, 5));
      const vars = a[1].variables;
      const letterToReg = vari => computerVersionRegister(vari) !== -1 ? computerVersionRegister(vari) : vari;
      const useVars = operation[1].map(letterToReg);
      Object.entries(vars).forEach(pair => string += load(variables, pair[1], pair[0]) + "\n")
      string += [operation[0], ...useVars].join` ` + "\n";
      Object.entries(vars).forEach(pair => string += store(variables, pair[1], pair[0]) + "\n")
    }

    if (params[0] === "for") {
      const initialize = convert(a[1].initialize, ifRegister, variables); //tag on this line (implicit jump to next line)
      const prerun = convert(a[1].prerun, ifRegister, variables)
      const check = convert(a[1].check, ifRegister, variables)
      const run = convert(a[1].run, ifRegister, variables)
      const lengths = [initialize, prerun, check, run].map(str => str.split`\n`.length);
      string += initialize + "\n";
      string += `addi 9 ${lengths[1]} 9${a[1].tag ? `$[${a[1].tag}]`: ""}\n` //the prerun clause doesn't happen on the first run
      string += prerun + "\n" + check + "\n";
      string += `eqri ${computerIfRegister} 0 ${computerIfRegister}\nmuli ${computerIfRegister} ${lengths[3] + 1} ${computerIfRegister}\naddr 9 ${computerIfRegister} 9\n`//skip run if check fails (implicit +1) and go to next line condition operations done by the program are stored in register i
      string += run + "\n";
      string += `addi 9 -${lengths[1] + lengths[2] + lengths[3] + 4} 9\n` //the 4 is the length of the skip condition plus the implicit jump
    }

    if (params[0] === "if") {
      const check = convert(a[1].expression, ifRegister, variables);
      const run = convert(a[1].run, ifRegister, variables)
      const lengths = [check, run].map(str => str.split`\n`.length);
      string += check + "\n";
      string += `eqri ${computerIfRegister} 0 ${computerIfRegister}\nmuli ${computerIfRegister} ${lengths[1]} ${computerIfRegister}\naddr 9 ${computerIfRegister} 9\n`
      string += run + "\n";
    }
    if (params[0] === "multiple") {
      string += convert(a[1].operations, ifRegister, variables) + "\n";
    }
    if (params[0] === "show") {
      string += load(variables, params[1], params[2]) + "\n";
    }
  });

  return string.slice(0, -1);
}

function tags(str) {
  const tagLines = {};
  str.split`\n`.forEach((line, i) => {
    if (line.match(/\$\[.+\]/g)) line.match(/\$\[.+\]/g).forEach(match => tagLines[match.slice(2, -1)] = i)
  });
  return str.replace(/\${(.+?)}/g, (_, group) => {
    if (tagLines[group] === undefined) throw new Error(`For-loop Tag ${group} does not exist.`);
    return tagLines[group];
  }).replace(/\$\[.+\]/g, "");
}

fs.writeFileSync("../output.gnelf", transpile(fs.readFileSync('../input.gnot', "utf8"), "i"));
