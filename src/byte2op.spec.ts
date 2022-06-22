import byte2op from "./byte2op"

describe("Byte2OP", () => {
	describe("translate bytecodes", () => {
		it("should translate bytecodes properly", async () => {
			const opcodes = byte2op.decode("6080");
			expect(opcodes[0].opcode.hex).toEqual('60');
			expect(opcodes[0].value.hex).toEqual('0x80');
		});
	});
});