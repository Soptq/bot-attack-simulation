const ERC20_TRANSFER =
	"Transfer(address,address,uint256)";
const ERC1155_SINGLE_TRANSFER =
	"TransferSingle(address,address,address,uint256,uint256)";
const ERC1155_BATCH_TRANSFER =
	"TransferBatch(address,address,address,uint256[],uint256[])"

// token address needs to be checksum-ed
const MONITORING = {
	"native": {
		name: "ETH",
		decimal: 18,
		limit: "10",
	},
	"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
		name: "WETH",
		decimal: 18,
		limit: "10", // i.e. if the transfer amount of WETH is greater of equal than 10, report it
	}
}

// set how many times the bot try to guess arguments (calldata) of the function
const NUM_FUNCTION_INVOKE = 5;

module.exports = {
	ERC20_TRANSFER,
	ERC1155_SINGLE_TRANSFER,
	ERC1155_BATCH_TRANSFER,
	MONITORING,
	NUM_FUNCTION_INVOKE,
};