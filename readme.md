# Gnot Code Transpiler
Gnot Code Transpiler is a project which takes in Gnot Code and converts it to [Gnelf Code](https://adventofcode.com/2018/day/19).

## Modifications of the [AOC Specification](https://adventofcode.com/2018/day/19)
* The use of 10 registers instead of 6 registers in order to allow more variables to be displayed on output.
* The introduction of a `getr` operator, which allows characters to be read from a file.
* The introduction of the `divi` and `divr` operators, which allow for more efficient integer division.
* Numbers are treated as [BigInts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) instead of infinite precision and magnitude decimal numbers.
* The index pointer's register is not specified in the outputted Gnot Code, and is always 9.

# How to run Gnot Code
1. Write your Gnot Code in `input.gnot`
2. Transpile the Gnot Code into Gnelf Code by cding into `Parser` and running `node conversion.js`
3. The corresponding Gnelf Code will be stored in `output.gnelf`
4. Go back to the main directory and run `node runGnelf.js`

# Gnot Code Syntax
## Variable Names
Variable names should be alphanumeric but cannot be a number or the letters between a and j (these represent registers)
## Operations
Operations happen on the variable left to right
```gnot
variable = 5
otherVariable = -294
anotherOne = 24
addition = variable + otherVariable + anotherOne
subtraction = anotherOne + -1
```
A list of operators can be found here:
* \+ Addition
* \* Multiplication
* / Integer Division
* & Bitwise And
* | Bitwise Or
* == Equality
* \> Greater Than
* < Less Than
## Special Operators
### `getr`
`variable = getr line position`

`getr` takes in two variables/registers and sets the result value to the ASCII char code of the corresponding character in `data.txt`. If the value is out of index, the variable is set to 0.
### `show`
`show variable register`
Sets a register to a value without side effects on other display registers.
Variables can be displayed safely in registers a, b, c, e, f, g as long as no other non-show operations happen after the variable is displayed.
### `end`
End stops the program from running (by setting the index pointer to a negative value.)
## If Block
```gnot
if (condition) {
    expressions
}
if (variable > 5) {
    otherVariable = 2
}
```
The if operator takes a condition and runs the code in the corresponding block if the condition is equal to 1.
## For Loop
For loops allow both typical for-loop syntax and half-open range syntax
```gnot
for (variable in [start, end)) {
    yey = 1   
}
for (start = 1; start < 20; start = start + 1) tag {
    if (start == 5) {
        continue tag
    }
    variable = variable + start
}
```
Half-open range syntax runs the loop with every value `start + n` where n is an integer and the value is larger than or equal to start and less than end.

Typical for-loop syntax runs the first statement (e.g. `start = 1`) on the first run of the loop, then the third statement for all other runs. After this is done, the code is only ran if the expression is equal to 1 (if it isn't, the for loop will stop running)

### Tags and Continue Syntax
The next iteration of a for loop can be jumped to through the use of `continue tag`, where tag is specified for a for loop between its last closing parenthesis and the first open curly-bracket.
# Examples
Example code can be found in `input.gnot` and `output.gnelf`. This is a solution to AOC Day 19 Part 1, and should take a large amount of time to run (due to the amount of operations AOC Day 19 requires.)
