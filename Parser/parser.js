module.exports = {convert: (string, ifRegister) => parse(layers(clean(string)), ifRegister)};

function clean(string) {
  if (string === undefined) return "";
  return string.split`\n`.map(a => a.split`//`[0].trim()).join`\n`;
}

function layers(string) {
  const lines = string.split`\n`;
  const layerList = [];
  let layerStart = "";
  let layerString = "";
  let bracketCounter = 0;
  lines.forEach(line => {
    if (line.includes("}")) {
      bracketCounter--;
      if (bracketCounter === 0) {
        layerList.push([layerString.split`\n`[0], layers(layerString.split`\n`.slice(1).join`\n`)]);
      }
    }
    if (line.includes("{")) {
      if (bracketCounter === 0) {
        layerStart = line;
        layerString = "";
      }
      bracketCounter++;
    }
    if (bracketCounter === 0) {
      if (line.trim() !== "") layerList.push([line]);
    }
    if (bracketCounter !== 0) {
      layerString += line + "\n";
    }
  });
  return layerList;
}

function convert(list) {
  // 1 represents an immediate and 0 represents a register
  const variables = new Set();
  const varMap = {};
  const varTypes = [];
  return [list.map((a, i) => {
    if (a[0] == "$" || a.match(/^-?\d+$/g)) { // $ for the use of position tags
      varTypes.push(1);
      return a;
    } else if ("abcdefghij".split``.includes(a)) {
      varTypes.push(0);
      return a;
    } else {
      varTypes.push(0);
      variables.add(a);
      varMap["abcdefghij"[i]] = a;
      return "abcdefghij"[i];
    }
  }), varTypes, variables, varMap];
}

function parse(layeredVersion, ifRegister) {
  const varList = new Set();
  const add = (set) => {
    set.forEach(a => varList.add(a));
  }; // adds to var list
  const handle = (parsed) => {
    parsed[1].forEach(a => varList.add(a));
    return parsed;
  }; // adds vars from a parsed to result to var list
  const instructions = layeredVersion.map(a => {
    a = [a[0].trim(), a[1]];
    const words = a[0].split(" ");
    const splitBrackets = a[0].split(`(`);

    if (words[0] === "if") {
      if (!splitBrackets.length || !splitBrackets[1].split(`)`).length) {
        throw new Error(`If Statement: ${a[0]} contains no condition.`);
      }
      const expression = splitBrackets[1].split(`)`)[0];
      const info = {expression: handle(parse([[`${ifRegister} = ${splitBrackets[1].split(`)`)[0]}`]], ifRegister)), run: handle(parse(a[1], ifRegister))};
      return ["if", info];
    } else if (words[0] === "for") {
      if (!splitBrackets.length || !splitBrackets[1].split(`)`).length) {
        throw new Error(`For Statement: ${a[0]} contains no conditions.`);
      }
      let conditions = a[0].match(/\(.+\)/g)[0].slice(1, -1);
      if (conditions.match(/.+ in \[.+, .+\)/g)) { // half-open range support
        const split = conditions.split` `;
        const parts = [split[0], split[2].slice(1, -1), split[3].slice(0, -1)];
        conditions = `${parts[0]} = ${parts[1]}; ${parts[0]} < ${parts[2]}; ${parts[0]} = ${parts[0]} + 1`;
      }
      const parts = conditions.split`;`.map(str => str.trim());
      if (parts.length !== 3) {
        throw new Error(`For Statement: ${a[0]} does not contain 3 terms.`);
      }
      const info = {initialize: handle(parse([[parts[0]]], ifRegister)), check: handle(parse([[`${ifRegister} = ${parts[1]}`]], ifRegister)), prerun: handle(parse([[parts[2]]], ifRegister)), run: handle(parse(a[1], ifRegister))};
      const tag = a[0].split`)`[a[0].split`)`.length - 1].split`{`[0].trim();
      if (tag) info.tag = tag;
      return ["for", info];
    } else if (words[0] === "continue") {
      return handle(parse([[`j = \$\{${words[1]}\}`]], ifRegister))[0][0]; // [0][0] so that it isn't wrapped
    }
    if (a[0] === "end") {
      return parse([["j = -10"]], ifRegister)[0][0];
    }
    if (words[0] === "continue") {
      return parse([`j = $${words[1]}$`], ifRegister)[0][0];
    }
    if (words[2] === "getr") {
      const vars = [words[3], words[4], words[0]]; // ordering
      const parts = convert(vars);
      add(parts[2]);
      return [`op getr ${parts[0][0]} ${parts[0][1]} ${parts[0][2]}`, {variables: parts[3], types: parts[1]}];
    }
    if (words.length == 3 && words[1] == "=") {
      const vars = [words[2], words[0]]; // how set operation works
      const parts = convert(vars);
      add(parts[2]);
      return [`op set ${parts[0][0]} 0 ${parts[0][1]}`, {variables: parts[3], types: parts[1]}];
    }
    if (words.length == 5 && words[1] == "=") {
      const vars = [words[2], words[4], words[0]];
      const parts = convert(vars);
      add(parts[2]);
      return [`op ${words[3]} ${parts[0][0]} ${parts[0][1]} ${parts[0][2]}`, {variables: parts[3], types: parts[1]}];
    }

    if (words.length > 5 && words.length % 2 === 1 && words[1] == "=") {
      const setVariable = words[0];
      const operations = [];
      for (let i = 0; i < (words.length - 5) / 2; i++) {
        operations.push(`${setVariable} = ${setVariable} ${words[5 + (i * 2)]} ${words[6 + (i * 2)]}`);
      }
      return ['multiple', {operations: handle(parse([words.slice(0, 5).join` `, ...operations].map(op => [op])))}];
    }
    if (words[0] === "show" && words.length === 3) {
      return [a[0]];
    }
  }).filter(a => a);
  return [instructions, [...varList]];
}
