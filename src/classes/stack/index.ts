import { InvalidStackValue, StackOverflow, StackUnderflow } from "./errors";
import { MAX_UNIT256 } from "../../constants";

class Stack {
  private readonly maxDepth;
  private stack: bigint[];

  constructor(maxDepth = 1024) {
    this.maxDepth = maxDepth;
    this.stack = [];
  }

  public push(value: bigint): void {
    if(value < 0 || value > MAX_UNIT256) throw new InvalidStackValue(value);
    if(this.stack.length + 1 >  this.maxDepth) throw new StackOverflow();
    
    this.stack.push(value);
  }

  public pop(): bigint {
    const value = this.stack.pop();
    if(value === undefined) throw new StackUnderflow();
    return value;
  }
}

export default Stack;