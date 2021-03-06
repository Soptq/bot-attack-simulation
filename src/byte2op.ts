const OPCODES = {
	'00' : 'STOP',
	'01' : 'ADD',
	'02' : 'MUL',
	'03' : 'SUB',
	'04' : 'DIV',
	'05' : 'SDIV',
	'06' : 'MOD',
	'07' : 'SMOD',
	'08' : 'ADDMOD',
	'09' : 'MULMOD',
	'0a' : 'EXP',
	'0b' : 'SIGNEXTEND',
	'10' : 'LT',
	'11' : 'GT',
	'12' : 'SLT',
	'13' : 'SGT',
	'14' : 'EQ',
	'15' : 'ISZERO',
	'16' : 'AND',
	'17' : 'OR',
	'18' : 'XOR',
	'19' : 'NOT',
	'1a' : 'BYTE',
	'1b' : 'SHL',
	'1c' : 'SHR',
	'1d' : 'SAR',
	'20' : 'SHA3',
	'30' : 'ADDRESS',
	'31' : 'BALANCE',
	'32' : 'ORIGIN',
	'33' : 'CALLER',
	'34' : 'CALLVALUE',
	'35' : 'CALLDATALOAD',
	'36' : 'CALLDATASIZE',
	'37' : 'CALLDATACOPY',
	'38' : 'CODESIZE',
	'39' : 'CODECOPY',
	'3a' : 'GASPRICE',
	'3b' : 'EXTCODESIZE',
	'3c' : 'EXTCODECOPY',
	'3d' : 'RETURNDATASIZE',
	'3e' : 'RETURNDATACOPY',
	'3f' : 'EXTCODEHASH',
	'40' : 'BLOCKHASH',
	'41' : 'COINBASE',
	'42' : 'TIMESTAMP',
	'43' : 'NUMBER',
	'44' : 'DIFFICULTY',
	'45' : 'GASLIMIT',
	'50' : 'POP',
	'51' : 'MLOAD',
	'52' : 'MSTORE',
	'53' : 'MSTORE8',
	'54' : 'SLOAD',
	'55' : 'SSTORE',
	'56' : 'JUMP',
	'57' : 'JUMPI',
	'58' : 'PC',
	'59' : 'MSIZE',
	'5a' : 'GAS',
	'5b' : 'JUMPDEST',
	'60' : 'PUSH1',
	'61' : 'PUSH2',
	'62' : 'PUSH3',
	'63' : 'PUSH4',
	'64' : 'PUSH5',
	'65' : 'PUSH6',
	'66' : 'PUSH7',
	'67' : 'PUSH8',
	'68' : 'PUSH9',
	'69' : 'PUSH10',
	'6a' : 'PUSH11',
	'6b' : 'PUSH12',
	'6c' : 'PUSH13',
	'6d' : 'PUSH14',
	'6e' : 'PUSH15',
	'6f' : 'PUSH16',
	'70' : 'PUSH17',
	'71' : 'PUSH18',
	'72' : 'PUSH19',
	'73' : 'PUSH20',
	'74' : 'PUSH21',
	'75' : 'PUSH22',
	'76' : 'PUSH23',
	'77' : 'PUSH24',
	'78' : 'PUSH25',
	'79' : 'PUSH26',
	'7a' : 'PUSH27',
	'7b' : 'PUSH28',
	'7c' : 'PUSH29',
	'7d' : 'PUSH30',
	'7e' : 'PUSH31',
	'7f' : 'PUSH32',
	'80' : 'DUP1',
	'81' : 'DUP2',
	'82' : 'DUP3',
	'83' : 'DUP4',
	'84' : 'DUP5',
	'85' : 'DUP6',
	'86' : 'DUP7',
	'87' : 'DUP8',
	'88' : 'DUP9',
	'89' : 'DUP10',
	'8a' : 'DUP11',
	'8b' : 'DUP12',
	'8c' : 'DUP13',
	'8d' : 'DUP14',
	'8e' : 'DUP15',
	'8f' : 'DUP16',
	'90' : 'SWAP1',
	'91' : 'SWAP2',
	'92' : 'SWAP3',
	'93' : 'SWAP4',
	'94' : 'SWAP5',
	'95' : 'SWAP6',
	'96' : 'SWAP7',
	'97' : 'SWAP8',
	'98' : 'SWAP9',
	'99' : 'SWAP10',
	'9a' : 'SWAP11',
	'9b' : 'SWAP12',
	'9c' : 'SWAP13',
	'9d' : 'SWAP14',
	'9e' : 'SWAP15',
	'9f' : 'SWAP16',
	'a0' : 'LOG0',
	'a1' : 'LOG1',
	'a2' : 'LOG2',
	'a3' : 'LOG3',
	'a4' : 'LOG4',
	'f0' : 'CREATE',
	'f1' : 'CALL',
	'f2' : 'CALLCODE',
	'f3' : 'RETURN',
	'f4' : 'DELEGATECALL',
	'f5' : 'CREATE2',
	'fa' : 'STATICCALL',
	'fd' : 'REVERT',
	'ff' : 'SELFDESTRUCT',
}

type Opcode = {
	pc?: number,
	opcode: {
		hex?: string,
		decoded?: string,
	}
	value: {
		hex?: string,
		int?: number
	}
	msg?: string,
}

const push_bytes = (hex: string, mode: string): string => {
	const i = parseInt(hex, 16).toString();
	const table = {
		'hex': `0x${hex}`,
		'int': i,
		'int:hex': `${i}:0x${hex}`,
	};
	if (mode in table) {
		// @ts-ignore
		return table[mode];
	}

	else return "";
}

const getNewOpcode = () => {
	return {
		opcode: {},
		value: {},
	}
}

const decode = (hexcode: string) => {
	let opcodes: Array<Opcode> = [];
	let h = '', pushcnt = 0, cnt = -1;
	let parsedOpcode: Opcode = getNewOpcode();
	for (let i = 0; i < hexcode.length; i += 2) {
		const item = hexcode.substring(i, i + 2);
		cnt += 1;
		if (pushcnt > 0) {
			h += item.toLowerCase();
			pushcnt -= 1;
			if (pushcnt == 0) {
				parsedOpcode.value.int = parseInt(push_bytes(h, 'int'));
				parsedOpcode.value.hex = push_bytes(h, 'hex');
				opcodes.push(parsedOpcode);
				parsedOpcode = getNewOpcode();
				h = '';
			}
		} else if (item.toLowerCase() in OPCODES) {
			parsedOpcode.pc = cnt;
			parsedOpcode.opcode.hex = item.toLowerCase();
			// @ts-ignore
			parsedOpcode.opcode.decoded = OPCODES[item.toLowerCase()];
			if (parseInt('60', 16) <= parseInt(item, 16) && parseInt(item, 16) <= parseInt('7f', 16)) {
				pushcnt = parseInt(item, 16) - parseInt('60', 16) + 1;
			} else {
				opcodes.push(parsedOpcode);
				parsedOpcode = getNewOpcode();
			}
		} else {
			parsedOpcode.msg = "ERROR"
			opcodes.push(parsedOpcode);
			parsedOpcode = getNewOpcode();
		}
	}

	return opcodes;
}

export default {
	decode
};
