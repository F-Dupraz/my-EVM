import { Trie } from "@ethereumjs/trie";
import { isHexString, arrayify, hexlify } from "@ethersproject/bytes";
import Opcodes from "../../opcodes";
import Instruction from "../instructions";
import Memory from "../memory";
import Stack from "../stack";
import {
  InvalidBytecode,
  InvalidProgramCounterIndex,
  UnknownOpcode,
  InvalidJump,
  OutOfGas,
} from "./errors";

class ExecutionContext {
  private readonly code: Uint8Array;
  public stack: Stack;
  public memory: Memory;
  private pc: number;
  private stopped: boolean;
  public output: bigint = BigInt(0);
  public storage: Trie;
  public gas: bigint;
  public readonly originalStorage: Trie;

  constructor(code: string, gas: bigint, storage: Trie) {
    if (!isHexString(code) || code.length % 2 !== 0)
      throw new InvalidBytecode();
    this.code = arrayify(code);
    this.stack = new Stack();
    this.memory = new Memory();
    this.pc = 0;
    this.stopped = false;
    this.storage = storage;
    this.gas = gas;
    this.originalStorage = storage.copy();
  }

  public stop(): void {
    this.stopped = true;
  }

  public async run() {
    while (!this.stopped) {
      const currentPc = this.pc;

      const instruction = this.fetchInstruction();
      const currentAvailableGas = this.gas;
      const { gasFee } = await instruction.execute(this);

      console.info(`${instruction.name}\t @pc=${currentPc}\t gas=${currentAvailableGas}\t cost=${gasFee}`);

      this.memory.print();
      this.stack.print();
      console.log("");
    }

    console.log("Output:\t", hexlify(this.output));
    console.log("Root:\t", hexlify(this.storage.root()));
  }

  private fetchInstruction(): Instruction {
    if (this.pc >= this.code.length) return Opcodes[0];

    if (this.pc < 0) throw new InvalidProgramCounterIndex();

    const opcode = this.readBytesFromCode(1);

    const instruction = Opcodes[Number(opcode)];

    if (!instruction) throw new UnknownOpcode();

    return instruction;
  }

  public readBytesFromCode(bytes = 1): bigint {
    const hexValues = this.code.slice(this.pc, this.pc + bytes); 
    const values = BigInt(hexlify(hexValues));

    this.pc += bytes;

    return values;
  }

  public useGas(fee: number): void {
    this.gas -= BigInt(fee);
    if(this.gas <= 0) throw new OutOfGas();
  }

  public jump(destination: bigint): void {
    if (!this.isValidJump(destination)) throw new InvalidJump();
    this.pc = Number(destination);
  }

  private isValidJump(destination: bigint): boolean {
    return this.code[Number(destination) - 1] === Opcodes[0x5b].opcode
  }
}

export default ExecutionContext;