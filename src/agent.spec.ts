import { Finding, FindingSeverity, FindingType, HandleBlock, ethers } from "forta-agent"
import agent from "./agent"

describe("Transaction simulation agent", () => {
	const mockGetTransactionReceipt = jest.fn()
	const mockGetEthersProvider = jest.fn()
	const mockGetEthersForkProvider = jest.fn()
	const mockGuessFunction = jest.fn()

	const mockTransaction = {
		hash: "0x494b578bce7572e4fb8b1357ddf12754a28eec3439a62f6b14432dacda9cbb76",
		transaction: {
			from: "0x63341ba917de90498f3903b199df5699b4a55ac0",
			to: null,
		},
		block: {
			number: 14684300
		},
		contractAddress: null,
	} as any
	const mockTransactionReceipt = {
		contractAddress: "0x7336f819775b1d31ea472681d70ce7a903482191",
	}
	const mockEthersProvider = {
		getCode: jest.fn(),
	}
	const mockEthersForkProvider = {
		getBalance: jest.fn(),
		getTransactionReceipt: jest.fn(),
	}
	const mockGuess = [
		{
			hash: "0x2b023d65485c4bb68d781960c2196588d03b871dc9eb1c054f596b7ca6f7da56",
		},
		"0xaf8271f7"
	]
	const mockForkTransactionReceipt = {
		logs: [
			{
				address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x0000000000000000000000007336f819775b1d31ea472681d70ce7a903482191",
					"0x00000000000000000000000063341ba917de90498f3903b199df5699b4a55ac0"
				],
				data: "0x0000000000000000000000000000000000000000000000b6fedf4a176d8069f4"
			}
		]
	}
	const mockForkTransactionReceipt2 = {
		logs: []
	}
	const mockCode = "0x60806040526004361061002d5760003560e01c8063a15db5c514610039578063af8271f71461006257610034565b3661003457005b600080fd5b34801561004557600080fd5b50610060600480360381019061005b919061181f565b610079565b005b34801561006e57600080fd5b5061007761121d565b005b60007327182842e098f60e3d576794a5bffb0777e025d3905060007384721a3db22eb852233aeae74f9bc8477f8bcc429050600073a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4890506000736b175474e89094c44da98b954eedeac495271d0f9050600073dac17f958d2ee523a2206206994597c13d831ec7905060007357ab1ec28d129707052df4df418d58a2d46d5f5190506000735f86558387293b6009d7896a61fcc86c17808d629050600073a5407eae9ba41422680e2e00537571bcc53efbfd9050600073824dcd7b044d60df2e89b1bb888e66d8bcf414919050600073acb83e0633d6605c5001e2ab59ef3c745547c8c790508873ffffffffffffffffffffffffffffffffffffffff16630ecbcdab6000650da475abf0006040518363ffffffff1660e01b81526004016101b59291906118f2565b600060405180830381600087803b1580156101cf57600080fd5b505af11580156101e3573d6000803e3d6000fd5b505050508773ffffffffffffffffffffffffffffffffffffffff1663095ea7b3847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b815260040161024292919061196b565b600060405180830381600087803b15801561025c57600080fd5b505af1158015610270573d6000803e3d6000fd5b505050508473ffffffffffffffffffffffffffffffffffffffff1663095ea7b3847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b81526004016102cf92919061196b565b600060405180830381600087803b1580156102e957600080fd5b505af11580156102fd573d6000803e3d6000fd5b505050508573ffffffffffffffffffffffffffffffffffffffff1663095ea7b3847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b815260040161035c92919061196b565b600060405180830381600087803b15801561037657600080fd5b505af115801561038a573d6000803e3d6000fd5b505050508673ffffffffffffffffffffffffffffffffffffffff1663095ea7b3847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b81526004016103e992919061196b565b600060405180830381600087803b15801561040357600080fd5b505af1158015610417573d6000803e3d6000fd5b505050508473ffffffffffffffffffffffffffffffffffffffff1663095ea7b3837fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b815260040161047692919061196b565b600060405180830381600087803b15801561049057600080fd5b505af11580156104a4573d6000803e3d6000fd5b505050508373ffffffffffffffffffffffffffffffffffffffff1663095ea7b3837fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b815260040161050392919061196b565b600060405180830381600087803b15801561051d57600080fd5b505af1158015610531573d6000803e3d6000fd5b505050508273ffffffffffffffffffffffffffffffffffffffff16633df0212460016003650da475abf00060006040518563ffffffff1660e01b815260040161057d9493929190611a17565b600060405180830381600087803b15801561059757600080fd5b505af11580156105ab573d6000803e3d6000fd5b5050505060008060008773ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016105ed9190611a5c565b60206040518083038186803b15801561060557600080fd5b505afa158015610619573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061063d9190611aa3565b925060005b60028110156107d5578573ffffffffffffffffffffffffffffffffffffffff16639169558660006001876000426040518663ffffffff1660e01b815260040161068f959493929190611b3f565b600060405180830381600087803b1580156106a957600080fd5b505af11580156106bd573d6000803e3d6000fd5b505050508773ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016106fa9190611a5c565b60206040518083038186803b15801561071257600080fd5b505afa158015610726573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061074a9190611aa3565b92508573ffffffffffffffffffffffffffffffffffffffff16639169558660016000866000426040518663ffffffff1660e01b8152600401610790959493929190611b92565b600060405180830381600087803b1580156107aa57600080fd5b505af11580156107be573d6000803e3d6000fd5b5050505080806107cd90611c14565b915050610642565b508773ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161080f9190611a5c565b60206040518083038186803b15801561082757600080fd5b505afa15801561083b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061085f9190611aa3565b92508473ffffffffffffffffffffffffffffffffffffffff166391695586600060016a0422ca8b0a00a4250000006000426040518663ffffffff1660e01b81526004016108b0959493929190611c98565b600060405180830381600087803b1580156108ca57600080fd5b505af11580156108de573d6000803e3d6000fd5b505050508773ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161091b9190611a5c565b60206040518083038186803b15801561093357600080fd5b505afa158015610947573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061096b9190611aa3565b92508673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016109a69190611a5c565b60206040518083038186803b1580156109be57600080fd5b505afa1580156109d2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109f69190611aa3565b915060005b6002811015610ba4578573ffffffffffffffffffffffffffffffffffffffff166391695586600060016a084595161401484a0000006000426040518663ffffffff1660e01b8152600401610a53959493929190611d26565b600060405180830381600087803b158015610a6d57600080fd5b505af1158015610a81573d6000803e3d6000fd5b50505050828873ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610abf9190611a5c565b60206040518083038186803b158015610ad757600080fd5b505afa158015610aeb573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b0f9190611aa3565b610b199190611d79565b91508573ffffffffffffffffffffffffffffffffffffffff16639169558660016000856000426040518663ffffffff1660e01b8152600401610b5f959493929190611b92565b600060405180830381600087803b158015610b7957600080fd5b505af1158015610b8d573d6000803e3d6000fd5b505050508080610b9c90611c14565b9150506109fb565b508773ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610bde9190611a5c565b60206040518083038186803b158015610bf657600080fd5b505afa158015610c0a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c2e9190611aa3565b92508673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610c699190611a5c565b60206040518083038186803b158015610c8157600080fd5b505afa158015610c95573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610cb99190611aa3565b91508673ffffffffffffffffffffffffffffffffffffffff1663095ea7b3857fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b8152600401610d1692919061196b565b600060405180830381600087803b158015610d3057600080fd5b505af1158015610d44573d6000803e3d6000fd5b505050506000600367ffffffffffffffff811115610d6557610d646116f4565b5b604051908082528060200260200182016040528015610d935781602001602082028036833780820191505090505b5090508473ffffffffffffffffffffffffffffffffffffffff166331cd52b08483426040518463ffffffff1660e01b8152600401610dd393929190611e6b565b600060405180830381600087803b158015610ded57600080fd5b505af1158015610e01573d6000803e3d6000fd5b5050505060008b73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610e409190611a5c565b60206040518083038186803b158015610e5857600080fd5b505afa158015610e6c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e909190611aa3565b905060008b73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610ecd9190611a5c565b60206040518083038186803b158015610ee557600080fd5b505afa158015610ef9573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f1d9190611aa3565b90508873ffffffffffffffffffffffffffffffffffffffff16633df02124600360018960006040518563ffffffff1660e01b8152600401610f619493929190611ea9565b600060405180830381600087803b158015610f7b57600080fd5b505af1158015610f8f573d6000803e3d6000fd5b505050508873ffffffffffffffffffffffffffffffffffffffff16633df02124600060018560006040518563ffffffff1660e01b8152600401610fd59493929190611f1f565b600060405180830381600087803b158015610fef57600080fd5b505af1158015611003573d6000803e3d6000fd5b505050508873ffffffffffffffffffffffffffffffffffffffff16633df02124600260018460006040518563ffffffff1660e01b81526004016110499493929190611f9f565b600060405180830381600087803b15801561106357600080fd5b505af1158015611077573d6000803e3d6000fd5b5050505060008e73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016110b69190611a5c565b60206040518083038186803b1580156110ce57600080fd5b505afa1580156110e2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111069190611aa3565b9050505050508a73ffffffffffffffffffffffffffffffffffffffff1663095ea7b38e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b815260040161116792919061196b565b600060405180830381600087803b15801561118157600080fd5b505af1158015611195573d6000803e3d6000fd5b505050508b73ffffffffffffffffffffffffffffffffffffffff1663d8aed1456000650da475abf0006040518363ffffffff1660e01b81526004016111db9291906118f2565b600060405180830381600087803b1580156111f557600080fd5b505af1158015611209573d6000803e3d6000fd5b505050505050505050505050505050505050565b6000807359828fdf7ee634aaad3f58b19fdba3b03e2d9d80905060007368b3465833fb72a70ecdf485e0e4c7bd8665fc459050600073a0b86991c6218b36c1d19d4a2e9eb0ce3606eb489050600073c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2905060007363341ba917de90498f3903b199df5699b4a55ac090508473ffffffffffffffffffffffffffffffffffffffff166389b7b7a630886040516020016112c99190611fe4565b6040516020818303038152906040526040518363ffffffff1660e01b81526004016112f5929190612087565b600060405180830381600087803b15801561130f57600080fd5b505af1158015611323573d6000803e3d6000fd5b5050505060008373ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016113629190611a5c565b60206040518083038186803b15801561137a57600080fd5b505afa15801561138e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113b29190611aa3565b90506000600267ffffffffffffffff8111156113d1576113d06116f4565b5b6040519080825280602002602001820160405280156113ff5781602001602082028036833780820191505090505b5090508481600081518110611417576114166120b7565b5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508381600181518110611466576114656120b7565b5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508473ffffffffffffffffffffffffffffffffffffffff1663095ea7b3877fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6040518363ffffffff1660e01b81526004016114fb92919061196b565b600060405180830381600087803b15801561151557600080fd5b505af1158015611529573d6000803e3d6000fd5b505050508573ffffffffffffffffffffffffffffffffffffffff1663472b43f383600084306040518563ffffffff1660e01b815260040161156d94939291906121a4565b600060405180830381600087803b15801561158757600080fd5b505af115801561159b573d6000803e3d6000fd5b5050505060008473ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016115da9190611a5c565b60206040518083038186803b1580156115f257600080fd5b505afa158015611606573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061162a9190611aa3565b90508473ffffffffffffffffffffffffffffffffffffffff1663a9059cbb85836040518363ffffffff1660e01b815260040161166792919061196b565b602060405180830381600087803b15801561168157600080fd5b505af1158015611695573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116b99190612228565b50505050505050505050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61172c826116e3565b810181811067ffffffffffffffff8211171561174b5761174a6116f4565b5b80604052505050565b600061175e6116c5565b905061176a8282611723565b919050565b600067ffffffffffffffff82111561178a576117896116f4565b5b611793826116e3565b9050602081019050919050565b82818337600083830152505050565b60006117c26117bd8461176f565b611754565b9050828152602081018484840111156117de576117dd6116de565b5b6117e98482856117a0565b509392505050565b600082601f830112611806576118056116d9565b5b81356118168482602086016117af565b91505092915050565b600060208284031215611835576118346116cf565b5b600082013567ffffffffffffffff811115611853576118526116d4565b5b61185f848285016117f1565b91505092915050565b6000819050919050565b6000819050919050565b6000819050919050565b60006118a161189c61189784611868565b61187c565b611872565b9050919050565b6118b181611886565b82525050565b6000819050919050565b60006118dc6118d76118d2846118b7565b61187c565b611872565b9050919050565b6118ec816118c1565b82525050565b600060408201905061190760008301856118a8565b61191460208301846118e3565b9392505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006119468261191b565b9050919050565b6119568161193b565b82525050565b61196581611872565b82525050565b6000604082019050611980600083018561194d565b61198d602083018461195c565b9392505050565b6000819050919050565b600081600f0b9050919050565b60006119c66119c16119bc84611994565b61187c565b61199e565b9050919050565b6119d6816119ab565b82525050565b6000819050919050565b6000611a016119fc6119f7846119dc565b61187c565b61199e565b9050919050565b611a11816119e6565b82525050565b6000608082019050611a2c60008301876119cd565b611a396020830186611a08565b611a4660408301856118e3565b611a5360608301846118a8565b95945050505050565b6000602082019050611a71600083018461194d565b92915050565b611a8081611872565b8114611a8b57600080fd5b50565b600081519050611a9d81611a77565b92915050565b600060208284031215611ab957611ab86116cf565b5b6000611ac784828501611a8e565b91505092915050565b600060ff82169050919050565b6000611af8611af3611aee84611868565b61187c565b611ad0565b9050919050565b611b0881611add565b82525050565b6000611b29611b24611b1f84611994565b61187c565b611ad0565b9050919050565b611b3981611b0e565b82525050565b600060a082019050611b546000830188611aff565b611b616020830187611b30565b611b6e604083018661195c565b611b7b60608301856118a8565b611b88608083018461195c565b9695505050505050565b600060a082019050611ba76000830188611b30565b611bb46020830187611aff565b611bc1604083018661195c565b611bce60608301856118a8565b611bdb608083018461195c565b9695505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000611c1f82611872565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415611c5257611c51611be5565b5b600182019050919050565b6000819050919050565b6000611c82611c7d611c7884611c5d565b61187c565b611872565b9050919050565b611c9281611c67565b82525050565b600060a082019050611cad6000830188611aff565b611cba6020830187611b30565b611cc76040830186611c89565b611cd460608301856118a8565b611ce1608083018461195c565b9695505050505050565b6000819050919050565b6000611d10611d0b611d0684611ceb565b61187c565b611872565b9050919050565b611d2081611cf5565b82525050565b600060a082019050611d3b6000830188611aff565b611d486020830187611b30565b611d556040830186611d17565b611d6260608301856118a8565b611d6f608083018461195c565b9695505050505050565b6000611d8482611872565b9150611d8f83611872565b925082821015611da257611da1611be5565b5b828203905092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b611de281611872565b82525050565b6000611df48383611dd9565b60208301905092915050565b6000602082019050919050565b6000611e1882611dad565b611e228185611db8565b9350611e2d83611dc9565b8060005b83811015611e5e578151611e458882611de8565b9750611e5083611e00565b925050600181019050611e31565b5085935050505092915050565b6000606082019050611e80600083018661195c565b8181036020830152611e928185611e0d565b9050611ea1604083018461195c565b949350505050565b6000608082019050611ebe6000830187611a08565b611ecb60208301866119cd565b611ed8604083018561195c565b611ee560608301846118a8565b95945050505050565b6000611f09611f04611eff84611868565b61187c565b61199e565b9050919050565b611f1981611eee565b82525050565b6000608082019050611f346000830187611f10565b611f4160208301866119cd565b611f4e604083018561195c565b611f5b60608301846118a8565b95945050505050565b6000819050919050565b6000611f89611f84611f7f84611f64565b61187c565b61199e565b9050919050565b611f9981611f6e565b82525050565b6000608082019050611fb46000830187611f90565b611fc160208301866119cd565b611fce604083018561195c565b611fdb60608301846118a8565b95945050505050565b6000602082019050611ff9600083018461195c565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561203957808201518184015260208101905061201e565b83811115612048576000848401525b50505050565b600061205982611fff565b612063818561200a565b935061207381856020860161201b565b61207c816116e3565b840191505092915050565b600060408201905061209c600083018561194d565b81810360208301526120ae818461204e565b90509392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b61211b8161193b565b82525050565b600061212d8383612112565b60208301905092915050565b6000602082019050919050565b6000612151826120e6565b61215b81856120f1565b935061216683612102565b8060005b8381101561219757815161217e8882612121565b975061218983612139565b92505060018101905061216a565b5085935050505092915050565b60006080820190506121b9600083018761195c565b6121c660208301866118a8565b81810360408301526121d88185612146565b90506121e7606083018461194d565b95945050505050565b60008115159050919050565b612205816121f0565b811461221057600080fd5b50565b600081519050612222816121fc565b92915050565b60006020828403121561223e5761223d6116cf565b5b600061224c84828501612213565b9150509291505056fea2646970667358221220d1267adb6e6119309752763f4baf1206110caf58b8825b3a2dd1bd8723e1ffee64736f6c63430008090033";

	const resetMocks = () => {
		mockGetTransactionReceipt.mockReset()
		mockGetEthersProvider.mockReset()
		mockGetEthersForkProvider.mockReset()
		mockEthersProvider.getCode.mockReset()
		mockEthersForkProvider.getBalance.mockReset()
		mockEthersForkProvider.getTransactionReceipt.mockReset()
		mockGuessFunction.mockReset()
	}

	beforeEach(() => {
		resetMocks()
		mockGetTransactionReceipt.mockReturnValue(mockTransactionReceipt)
		mockGetEthersProvider.mockReturnValue(mockEthersProvider)
		mockGetEthersForkProvider.mockReturnValue(mockEthersForkProvider)
		mockEthersProvider.getCode.mockReturnValue(mockCode)
		mockEthersForkProvider.getBalance.mockReturnValue(ethers.utils.parseEther("1"))
		mockGuessFunction.mockReturnValue(mockGuess)
	})

	it("returns a finding for Saddle Finance attack", async () => {
		mockEthersForkProvider.getTransactionReceipt
			.mockReturnValueOnce(mockForkTransactionReceipt)
			.mockReturnValue(mockForkTransactionReceipt2)

		const findings = await agent.provideHandleTransaction(
			mockGetTransactionReceipt,
			mockGetEthersProvider,
			mockGetEthersForkProvider,
			mockGuessFunction
		)(mockTransaction);

		const expectedFinding = Finding.fromObject({
			name: "Suspicious contract function",
			description: "Invoking function 0xa15db5c5 of contract 0x7336f819775b1d31ea472681d70ce7a903482191 will transfer 3375.672900685060401652 WETH to the contract creator 0x63341ba917de90498f3903b199df5699b4a55ac0",
			alertId: "FORTA-1",
			severity: FindingSeverity.High,
			type: FindingType.Suspicious,
			metadata: {
				"calldata": "0xaf8271f7",
				"contract": "0x7336f819775b1d31ea472681d70ce7a903482191",
				"creator": "0x63341ba917de90498f3903b199df5699b4a55ac0",
				"function": "0xa15db5c5",
			},
		})
		expect(findings).toStrictEqual([expectedFinding])
	})

	it("returns no finding if no transfer", async () => {
		mockEthersForkProvider.getTransactionReceipt
			.mockReturnValue(mockForkTransactionReceipt2)

		const findings = await agent.provideHandleTransaction(
			mockGetTransactionReceipt,
			mockGetEthersProvider,
			mockGetEthersForkProvider,
			mockGuessFunction
		)(mockTransaction);

		expect(findings).toStrictEqual([])
	})
})