# Attack Simulation Detection Agent

## Description

This agent detects suspicious contract functions by simulating their invoking, and then the bot will observe defined suspicious state changes and raise alerts. This bot does not use any external APIs, so it will support all chains that forta supports.

Specifically, this bot will detect the creation of any contract, and then pull its bytecode from the blockchain. Then the bot will firstly translate the bytecode to opcode, and then do it will go through the opcode and determine the entrypoint of every function in the contract. Finally, it will hardfork the blockchain, and simulate the invoking of the function to see if there is any suspicious state changes.

Speaking of the invoking, the bot will also automatically determine the passed arguments / calldata of the function if it is not parameterless by brute force attack. Since the simulation of function call takes time, users can set how many times they want the bot to try in `./src/constant.ts`.

## Supported Chains

- All chains that Forta supports.

## Configuration

All configurations for this bot are located in `./src/constant.ts`. Specifically, there is a variable called `MONITORING` where you can configure the alert limit:

```json
{
	"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
		name: "WETH",
		decimal: 18,
		limit: "10", // i.e. if the transfer amount of WETH is greater of equal than 10, report it
	},
	"<ERC Token Address>": {
	    name: "<What this token's name>",
	    decimal: "What this token's decimal",
	    limit: "<How many transfer will trigger an alert>"
	},
	...
}}
```

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when an invoking of a contract function causes a token in `MONITORING` to be transferred with an amount greater or equal than the set limit.
  - By default severity is always set to "High".
  - Type is always set to "suspicious".
  - Metadata fields contain the creator of the suspicious contract, the contract address, and the function hash and its call data.

## Test Data

Saddle Finance:

```shell
npm run block 14684300 # https://etherscan.io/tx/0x494b578bce7572e4fb8b1357ddf12754a28eec3439a62f6b14432dacda9cbb76
```

will return:

```shell
1 findings for transaction 0x494b578bce7572e4fb8b1357ddf12754a28eec3439a62f6b14432dacda9cbb76 {
  "name": "Suspicious contract function",
  "description": "Invoking function 0xaf8271f7 of contract 0x7336f819775b1d31ea472681d70ce7a903482191 will transfer 3375.538166306826437272 WETH to the contract creator 0x63341ba917de90498f3903b199df5699b4a55ac0",
  "alertId": "FORTA-1",
  "protocol": "ethereum",
  "severity": "High",
  "type": "Suspicious",
  "metadata": {
    "creator": "0x63341ba917de90498f3903b199df5699b4a55ac0",
    "contract": "0x7336f819775b1d31ea472681d70ce7a903482191",
    "function": "0xaf8271f7",
    "calldata": "0xaf8271f7"
  },
  "addresses": []
}
```
