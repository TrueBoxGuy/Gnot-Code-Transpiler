const fs = require("fs");
const time = Date.now()
const text = fs.readFileSync("./output.gnelf", "utf8").split `\n`.map(a => a.replace(/^\s+|\s+$/gm, '')).filter(a => a);
const oof = fs.readFileSync("./data.txt", "utf8").split `\n`.map(a => a.replace(/^\s+|\s+$/gm, '')).filter(a => a);

class RegisterOP {
  constructor(register) {
    this.register = register;
  }
  addr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] + register[b];
    return register;
  }
  addi(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] + b;
    return register;
  }
  mulr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] * register[b];
    return register;
  }
  muli(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] * b;
    return register;
  }
  divr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] / register[b];
    return register;
  }
  divi(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] / b;
    return register;
  }
  banr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] & register[b];
    return register;
  }
  bani(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] & b;
    return register;
  }
  borr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] | register[b];
    return register;
  }
  bori(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a] | b;
    return register;
  }
  setr(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = register[a];
    return register;
  }
  seti(a, b, c) {
    if (!(c < 10n)) return null;
    const register = [...this.register];
    register[c] = a;
    return register;
  }
  gtir(a, b, c) {
    if (!(b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(a > register[b]);
    return register;
  }
  gtri(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(register[a] > b);
    return register;
  }
  gtrr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(register[a] > register[b]);
    return register;
  }
  eqir(a, b, c) {
    if (!(b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(a === register[b]);
    return register;
  }
  eqri(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(register[a] === b);
    return register;
  }
  eqrr(a, b, c) {
    if (!(a < 10n && b < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = BigInt(register[a] === register[b]);
    return register;
  }
  getr(a, b, c) {
    if (!(a < 10n && c < 10n)) return null;
    const register = [...this.register];
    register[c] = oof[registers[a]];
    if (b >= 0) register[c] = BigInt(oof[registers[a]] ? (oof[registers[a]][registers[b]] ? oof[registers[a]][registers[b]].charCodeAt(0) : 0) : 0);
    return register;
  }
}

let registers = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];

while (registers[9] < text.length && registers[9] >= 0n) {
  const line = text[registers[9]].split(" ");
  const registerBoy = new RegisterOP(registers);
  registers = registerBoy[line[0]](...line.slice(1, 10).map(BigInt));
  registers[9]++;
}

console.log(registers.join` `)
console.log(`Ran in: ${Date.now()-time}ms`)
