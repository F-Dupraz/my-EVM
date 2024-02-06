import { Trie } from "@ethereumjs/trie";
import { runCli, Command } from "command-line-interface";
import { Level } from "level";
import ExecutionContext from "../classes/execution";
import LevelDB from "../classes/storage";
import { DB_PATH } from "../constants";

interface EVMOptions {
  code: string;
  gasLimit: number;
}

const evm: Command<EVMOptions> = {
  name: "evm",
  description: "Platzi Virtual Machine execution environment",
  optionDefinitions: [
    {
      name: "code",
      description: "Bytecode to execute by the EVM",
      type: "string",
      alias: "c",
      isRequired: true,
    },
    {
      name: "gasLimit",
      description: "Available gas for the EVM execution",
      type: "number",
      alias: "g",
      isRequired: true,
    },
  ],
  handle: async ({ options: { gasLimit, code } }) => {
    const executionContext = new ExecutionContext(
      code,
      BigInt(gasLimit),
      await Trie.create({
        db: new LevelDB(new Level(DB_PATH)),
        useRootPersistence: true,
      })
    );

    await executionContext.run();
  },
};

runCli({ rootCommand: evm, argv: process.argv });