import {
  getEthersProvider,
  getTransactionReceipt,
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType, ethers, getJsonRpcUrl,
} from "forta-agent";

import ganache from "ganache-core";
import byte2op from "./byte2op"

const {
  ERC20_TRANSFER,
  ERC1155_SINGLE_TRANSFER,
  ERC1155_BATCH_TRANSFER,
  MONITORING,
  NUM_FUNCTION_INVOKE
} = require("./constant");

type EntryPoint = {
  hash: string,
  pc: string,
}

let findingsCount = 0;

const getEthersForkProvider = (blockNumber: number, unlockedAccounts: string[]) => {
  return new ethers.providers.Web3Provider(
    // @ts-ignore
    ganache.provider({
      fork: getJsonRpcUrl(),
      fork_block_number: blockNumber,
      unlocked_accounts: unlockedAccounts,
    })
  );
}

const guessFunction = async (
  provider: ethers.providers.Web3Provider,
  fromAddress: string,
  contractAddress: string,
  functionHash: string,
  numGuess: number = NUM_FUNCTION_INVOKE) => {
  let errorPc = -1, current = 0;
  while (current++ !== numGuess) {
    let data = functionHash;
    try {
      for (let i = 0; i < current - 1; i++) {
        data += "0000000000000000000000000000000000000000000000000000000000000001";
      }
      const rawTx = {
        to: contractAddress,
        value: "0",
        data
      }
      const tx = await provider.getSigner(fromAddress).sendTransaction(rawTx);
      await tx.wait();
      return [tx, data]
    } catch (e) {
      if (errorPc < 0) {
        // @ts-ignore
        errorPc = e.results[e.hashes[0]].program_counter
      } else {
        // @ts-ignore
        if (errorPc != e.results[e.hashes[0]].program_counter) {
          return [null, data];
        }
      }
    }
  }

  return [null, functionHash];
}

function provideHandleTransaction(
  getTransactionReceipt: CallableFunction,
  getEthersProvider: CallableFunction,
  getEthersForkProvider: CallableFunction,
  guessFunction: CallableFunction,
) {
  return async function (
    txEvent: TransactionEvent
  ) {
    const findings: Finding[] = [];

    // limiting this agent to emit only 5 findings so that the alert feed is not spammed
    if (findingsCount >= 5) return findings;

    // check if the transaction creates a new contract
    const fromAddress = txEvent.transaction.from;
    const toAddress = txEvent.transaction.to;
    const txContractAddress = txEvent.contractAddress;

    if (toAddress || txContractAddress) {
      return findings;
    }

    const receipt = await getTransactionReceipt(txEvent.hash);
    const receiptContractAddress = receipt.contractAddress;

    if (!receiptContractAddress) {
      return findings;
    }

    const data = await getEthersProvider().getCode(receiptContractAddress);
    const opcodes = byte2op.decode(data.substring(2));
    const pc2op = {};
    for (let i = 0; i < opcodes.length - 3; i++) {
      const currentPc = opcodes[i].pc;
      if (!currentPc) {
        continue;
      }
      // @ts-ignore
      pc2op[currentPc] = opcodes[i];
    }

    // retrieve possible function entry points (pattern: PUSH4 -> EQ -> PUSH -> JUMPI)
    const entryPoints: Array<EntryPoint> = [];
    for (let i = 0; i < opcodes.length - 3; i++) {
      if (opcodes[i].opcode.decoded === "PUSH4"
        && opcodes[i + 1].opcode.decoded === "EQ"
        && opcodes[i + 2].opcode.decoded?.startsWith("PUSH")
        && opcodes[i + 3].opcode.decoded === "JUMPI") {
        const nextPc = opcodes[i + 2].value.int;
        if (!nextPc) {
          continue;
        }

        // test if the `jumpi` goes to a `jumpdest`
        // @ts-ignore
        if (!(nextPc in pc2op) || pc2op[nextPc].opcode?.decoded !== "JUMPDEST") {
          continue;
        }

        // @ts-ignore

        entryPoints.push({
          hash: opcodes[i].value.hex!,
          pc: opcodes[i + 2].value.hex!,
        })
      }
    }

    if (entryPoints.length === 0) {
      return findings;
    }

    const forkedProvider = getEthersForkProvider(txEvent.block.number, [fromAddress]);
    for (const entryPoint of entryPoints) {
      try {
        let initialBalance = await forkedProvider.getBalance(fromAddress);
        const [tx, calldata] = await guessFunction(forkedProvider, fromAddress, receiptContractAddress, entryPoint.hash)
        if (!tx) continue;
        let finalBalance = await forkedProvider.getBalance(fromAddress);
        // check native token transfer
        let tokenAddress = "native";
        if (finalBalance.gt(initialBalance)
          && finalBalance.sub(initialBalance).gte(
            ethers.utils.parseUnits(MONITORING[tokenAddress].limit, MONITORING[tokenAddress].decimal)
          )
        ) {
          let value = finalBalance.sub(initialBalance);
          findings.push(
            Finding.fromObject({
              name: "Suspicious contract function",
              description: `Invoking function ${entryPoint.hash} of contract ${receiptContractAddress} will transfer ${ethers.utils.formatUnits(value, MONITORING[tokenAddress].decimal)} ${MONITORING[tokenAddress].name} to the contract creator ${fromAddress}`,
              alertId: "FORTA-1",
              severity: FindingSeverity.High,
              type: FindingType.Suspicious,
              metadata: {
                creator: fromAddress,
                contract: receiptContractAddress,
                function: entryPoint.hash,
                calldata: calldata as string,
              },
            })
          );
          findingsCount++;
        }

        // check erc token transfer
        const forkReceipt = await forkedProvider.getTransactionReceipt((tx as ethers.providers.TransactionResponse).hash);
        for (const log of forkReceipt.logs) {
          const tokenAddress: string = log.address;
          if (!(tokenAddress in MONITORING)) {
            continue;
          }

          let value: ethers.BigNumber = ethers.BigNumber.from(0);
          if (log.topics.length === 3
            && log.topics[0] === ethers.utils.id(ERC20_TRANSFER)
            && log.topics[2] === ethers.utils.hexZeroPad(fromAddress, 32)) {
            value = ethers.utils.defaultAbiCoder.decode(['uint256'], log.data)[0];
          }

          if (log.topics.length === 4) {
            if (log.topics[0] === ethers.utils.id(ERC1155_SINGLE_TRANSFER)
              && log.topics[3] === ethers.utils.hexZeroPad(fromAddress, 32)) {
              value = ethers.utils.defaultAbiCoder.decode(['uint256', 'uint256'], log.data)[1];
            }
          }

          if (log.topics.length === 4) {
            if (log.topics[0] === ethers.utils.id(ERC1155_BATCH_TRANSFER)
              && log.topics[3] === ethers.utils.hexZeroPad(fromAddress, 32)) {
              const values = ethers.utils.defaultAbiCoder.decode(['uint256[]', 'uint256[]'], log.data)[1];
              for (const _value of values) {
                value = value.add(_value);
              }
            }
          }
          const limit: ethers.BigNumber = ethers.utils.parseUnits(MONITORING[tokenAddress].limit, MONITORING[tokenAddress].decimal);
          if (value.gte(limit)) {
            findings.push(
              Finding.fromObject({
                name: "Suspicious contract function",
                description: `Invoking function ${entryPoint.hash} of contract ${receiptContractAddress} will transfer ${ethers.utils.formatUnits(value, MONITORING[tokenAddress].decimal)} ${MONITORING[tokenAddress].name} to the contract creator ${fromAddress}`,
                alertId: "FORTA-1",
                severity: FindingSeverity.High,
                type: FindingType.Suspicious,
                metadata: {
                  creator: fromAddress,
                  contract: receiptContractAddress,
                  function: entryPoint.hash,
                  calldata: calldata as string,
                },
              })
            );
            findingsCount++;
          }
        }
      } catch (e) {}
    }

    return findings;
  }
}

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(
    getTransactionReceipt,
    getEthersProvider,
    getEthersForkProvider,
    guessFunction
  )
  // handleBlock
};
