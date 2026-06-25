// ============================================================
// lib/contracts/create-stablecoin-abi.ts
//
// AUTO-GENERATED. createStablecoin function (from src/contracts/stablecoin-factory/abi.json)
// + the UNION of every error def across the stablecoin contracts
// (factory, token, reserve-oracle, compliance, identity), so a
// createStablecoin revert from any cluster contract decodes to a named
// error instead of a raw selector.
//
// createStablecoin is excluded from the codegen manifest (its nested
// tuple would produce a useless form), so the generated
// STABLECOIN_FACTORY_ABI omits it; useCreateStablecoin encodes against
// this fragment. Regenerate with the node script in git history.
// ============================================================

export const CREATE_STABLECOIN_ABI = [
  {
    "type": "function",
    "name": "createStablecoin",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct StablecoinFactory.StablecoinConfig",
        "components": [
          {
            "name": "stablecoinId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "salt",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "category",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "assetType",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "dealAdmin",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "platformProposer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "issuerExecutor",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "timelockMinDelay",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "tokenParams",
            "type": "tuple",
            "internalType": "struct StablecoinFactory.TokenInitParamsForFactory",
            "components": [
              {
                "name": "name",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "symbol",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "decimals",
                "type": "uint8",
                "internalType": "uint8"
              },
              {
                "name": "description",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "treasury",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "globalMintCap",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "maxReserveAttestationAge",
                "type": "uint64",
                "internalType": "uint64"
              }
            ]
          },
          {
            "name": "reserveOracleParams",
            "type": "tuple",
            "internalType": "struct StablecoinFactory.ReserveOracleInitParamsForFactory",
            "components": [
              {
                "name": "maxReserveChangeBps",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "stalenessWarningSeconds",
                "type": "uint64",
                "internalType": "uint64"
              }
            ]
          },
          {
            "name": "complianceParams",
            "type": "tuple",
            "internalType": "struct StablecoinFactory.ComplianceInitParamsForFactory",
            "components": [
              {
                "name": "transferPolicy",
                "type": "uint8",
                "internalType": "enum StablecoinComplianceChecker.TransferPolicy"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "record",
        "type": "tuple",
        "internalType": "struct StablecoinFactory.StablecoinRecord",
        "components": [
          {
            "name": "stablecoinId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "issuer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "complianceChecker",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "identityRegistry",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "reserveOracle",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "tokenAccessManager",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "timelock",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deployedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "deployedBy",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "error",
    "name": "AccessManagedInvalidAuthority",
    "inputs": [
      {
        "name": "authority",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagedRequiredDelay",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "delay",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagedUnauthorized",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccountIsFrozen",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccountNotFrozen",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ArrayLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AttestationAlreadyRescinded",
    "inputs": [
      {
        "name": "attestationId",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "AttestationNotFound",
    "inputs": [
      {
        "name": "attestationId",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "AttestorNoteTooLong",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLength",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ComplianceCheckFailed",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ContractNotPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ContractPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DescriptionTooLong",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLength",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureLength",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureS",
    "inputs": [
      {
        "name": "s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "EmptyAttestorNote",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyReportURI",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyRescissionReason",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ERC1967InvalidImplementation",
    "inputs": [
      {
        "name": "implementation",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1967NonPayable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ERC20InsufficientAllowance",
    "inputs": [
      {
        "name": "spender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "allowance",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InsufficientBalance",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InvalidApprover",
    "inputs": [
      {
        "name": "approver",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InvalidReceiver",
    "inputs": [
      {
        "name": "receiver",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InvalidSender",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InvalidSpender",
    "inputs": [
      {
        "name": "spender",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC2612ExpiredSignature",
    "inputs": [
      {
        "name": "deadline",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC2612InvalidSigner",
    "inputs": [
      {
        "name": "signer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "FactoryIsPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FutureAsOfTimestamp",
    "inputs": [
      {
        "name": "provided",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "currentTime",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "HashURIMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ImplementationsNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientGasForComplianceCheck",
    "inputs": [
      {
        "name": "remaining",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientHeldBalance",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "requested",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "held",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientSpendableBalance",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "requested",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "spendable",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidAccountNonce",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "currentNonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidInitialization",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidMaxBps",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "max",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "IssuerNotApproved",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "MintCapExceeded",
    "inputs": [
      {
        "name": "attempted",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "cap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currentSupply",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "NonMonotonicAsOfTimestamp",
    "inputs": [
      {
        "name": "previous",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "provided",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "NotAContract",
    "inputs": [
      {
        "name": "parameter",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "provided",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NotInitializing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyToken",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OnlyUpgradeAuthority",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "RecipientNotCompliant",
    "inputs": [
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "reason",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReserveChangeExceedsBounds",
    "inputs": [
      {
        "name": "changeBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReserveOracleNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReservesInsufficient",
    "inputs": [
      {
        "name": "wouldBeSupply",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "attestedReserves",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReservesStale",
    "inputs": [
      {
        "name": "ageSeconds",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "maxAgeSeconds",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "StablecoinAlreadyExists",
    "inputs": [
      {
        "name": "stablecoinId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "TokenAlreadyBound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UUPSUnauthorizedCallContext",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UUPSUnsupportedProxiableUUID",
    "inputs": [
      {
        "name": "slot",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": [
      {
        "name": "parameter",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAsOfTimestamp",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroBytes32",
    "inputs": [
      {
        "name": "parameter",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroReportURIHash",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroReserveAmount",
    "inputs": []
  }
] as const;
