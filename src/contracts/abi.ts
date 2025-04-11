// src/contracts/abi.ts

export const CHALLENGE_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_challengeId",
				"type": "uint256"
			},
			{
				"internalType": "uint256[6]",
				"name": "_acceptingTeam",
				"type": "uint256[6]"
			}
		],
		"name": "acceptChallenge",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_matchIdPredefined",
				"type": "uint256"
			},
			{
				"internalType": "uint256[6]",
				"name": "_challengingTeam",
				"type": "uint256[6]"
			},
			{
				"internalType": "uint256",
				"name": "_requiredStartTime",
				"type": "uint256"
			}
		],
		"name": "createChallenge",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_initialFeeRecipient",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "challengeId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "captain2",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256[6]",
				"name": "acceptingTeam",
				"type": "uint256[6]"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "stake",
				"type": "uint256"
			}
		],
		"name": "ChallengeAccepted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "challengeId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "captain1",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "matchIdPredefined",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256[6]",
				"name": "challengingTeam",
				"type": "uint256[6]"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "stake",
				"type": "uint256"
			}
		],
		"name": "ChallengeCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldRecipient",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newRecipient",
				"type": "address"
			}
		],
		"name": "FeeRecipientChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "challengeId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "verifier",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "winnerCaptain",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "winningTeamIndex",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "prizeAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeAmount",
				"type": "uint256"
			}
		],
		"name": "MatchVerifiedAndPaid",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newFeeRecipient",
				"type": "address"
			}
		],
		"name": "setFeeRecipient",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_challengeId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_matchIdFromApi",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_startTimeFromApi",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "_winningTeamIndexFromApi",
				"type": "uint8"
			},
			{
				"internalType": "uint256[6]",
				"name": "_apiTeam0PlayerIds",
				"type": "uint256[6]"
			},
			{
				"internalType": "uint256[6]",
				"name": "_apiTeam1PlayerIds",
				"type": "uint256[6]"
			}
		],
		"name": "verifyMatchOutcomeAndPay",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "CHALLENGE_STAKE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "challengeCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "challenges",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "captain1",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "captain2",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "matchIdPredefined",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "requiredStartTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "creationTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "acceptTime",
				"type": "uint256"
			},
			{
				"internalType": "enum DeadlockChallengeNative.Status",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "amountStaked",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "winningTeamIndex",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "paidMatchId",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "FEE_PERCENT",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feeRecipient",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_challengeId",
				"type": "uint256"
			}
		],
		"name": "getChallenge",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "captain1",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "captain2",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "matchIdPredefined",
						"type": "uint256"
					},
					{
						"internalType": "uint256[6]",
						"name": "challengingTeam",
						"type": "uint256[6]"
					},
					{
						"internalType": "uint256[6]",
						"name": "acceptingTeam",
						"type": "uint256[6]"
					},
					{
						"internalType": "uint256",
						"name": "requiredStartTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "creationTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "acceptTime",
						"type": "uint256"
					},
					{
						"internalType": "enum DeadlockChallengeNative.Status",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "amountStaked",
						"type": "uint256"
					},
					{
						"internalType": "uint8",
						"name": "winningTeamIndex",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "paidMatchId",
						"type": "uint256"
					}
				],
				"internalType": "struct DeadlockChallengeNative.Challenge",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "matchIdUsed",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const; // <--- SOLO UN CORCHETE AQUÍ, seguido de 'as const'