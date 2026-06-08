// ============================================================
// lib/contracts/create-deal-abi.ts
//
// AUTO-GENERATED. createDeal function (from src/contracts/factory/abi.json)
// + the UNION of every error def across the qbridge-smart-contracts
// artifacts, so a createDeal revert from any cluster contract/library
// (token, oracle, compliance, identity, distribution, capital-call, libs,
// OZ) decodes to a named error instead of a raw selector.
//
// createDeal is excluded from the codegen manifest (its nested DealConfig
// tuple would produce a useless form), so the generated FACTORY_ABI omits
// it; useCreateDeal encodes against this fragment.
//
// Regenerate: node script over <contracts>/out (see git history of this file).
// ============================================================

export const CREATE_DEAL_ABI = [
  {
    "type": "function",
    "name": "createDeal",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct SingleSpvRealEstateFactory.DealConfig",
        "components": [
          {
            "name": "dealId",
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
            "internalType": "struct SingleSpvRealEstateFactory.TokenInitParamsForFactory",
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
                "name": "spvLegalEntity",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "dealMetadataURI",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "unitPriceAtIssuance",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "classes",
                "type": "tuple[]",
                "internalType": "struct SingleSpvRealEstateToken.ClassInitConfig[]",
                "components": [
                  {
                    "name": "shareClass",
                    "type": "uint8",
                    "internalType": "enum SingleSpvRealEstateToken.ShareClass"
                  },
                  {
                    "name": "classMintCap",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "subscribable",
                    "type": "bool",
                    "internalType": "bool"
                  },
                  {
                    "name": "managerMintOnly",
                    "type": "bool",
                    "internalType": "bool"
                  },
                  {
                    "name": "holdPeriodDays",
                    "type": "uint16",
                    "internalType": "uint16"
                  },
                  {
                    "name": "subTiers",
                    "type": "tuple[]",
                    "internalType": "struct SingleSpvRealEstateToken.SubTierConfig[]",
                    "components": [
                      {
                        "name": "tierId",
                        "type": "uint8",
                        "internalType": "uint8"
                      },
                      {
                        "name": "label",
                        "type": "string",
                        "internalType": "string"
                      },
                      {
                        "name": "minimumCommitment",
                        "type": "uint256",
                        "internalType": "uint256"
                      },
                      {
                        "name": "classSplitBps",
                        "type": "uint16",
                        "internalType": "uint16"
                      },
                      {
                        "name": "classBSplitBps",
                        "type": "uint16",
                        "internalType": "uint16"
                      }
                    ]
                  }
                ]
              },
              {
                "name": "combinedCap",
                "type": "tuple",
                "internalType": "struct SingleSpvRealEstateToken.CombinedCapInit",
                "components": [
                  {
                    "name": "cap",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "applicableClasses",
                    "type": "uint8[]",
                    "internalType": "enum SingleSpvRealEstateToken.ShareClass[]"
                  }
                ]
              }
            ]
          },
          {
            "name": "oracleParams",
            "type": "tuple",
            "internalType": "struct SingleSpvRealEstateFactory.OracleInitParamsForFactory",
            "components": [
              {
                "name": "maxNavChangeBps",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "stalenessWarningSeconds",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "initialAttestation",
                "type": "tuple",
                "internalType": "struct ManagerAttestedValuationOracle.InitialAttestation",
                "components": [
                  {
                    "name": "navPerUnitCents",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "asOfTimestamp",
                    "type": "uint64",
                    "internalType": "uint64"
                  },
                  {
                    "name": "reportURIHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                  },
                  {
                    "name": "reportURI",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "methodologyNote",
                    "type": "string",
                    "internalType": "string"
                  }
                ]
              }
            ]
          },
          {
            "name": "complianceParams",
            "type": "tuple",
            "internalType": "struct SingleSpvRealEstateFactory.ComplianceInitParamsForFactory",
            "components": [
              {
                "name": "accreditationValidity",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "holdPeriodClassA",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "holdPeriodClassAA",
                "type": "uint64",
                "internalType": "uint64"
              }
            ]
          },
          {
            "name": "distributionParams",
            "type": "tuple",
            "internalType": "struct SingleSpvRealEstateFactory.DistributionInitParamsForFactory",
            "components": [
              {
                "name": "calculator",
                "type": "address",
                "internalType": "address"
              }
            ]
          },
          {
            "name": "capitalCallParams",
            "type": "tuple",
            "internalType": "struct SingleSpvRealEstateFactory.CapitalCallInitParamsForFactory",
            "components": [
              {
                "name": "executionGracePeriod",
                "type": "uint64",
                "internalType": "uint64"
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
        "internalType": "struct SingleSpvRealEstateFactory.DealRecord",
        "components": [
          {
            "name": "dealId",
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
            "name": "navOracle",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "distributionSettlement",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "capitalCallManager",
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
    "name": "AccessControlBadConfirmation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AccessControlUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "neededRole",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
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
    "name": "AccessManagerAlreadyScheduled",
    "inputs": [
      {
        "name": "operationId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerBadConfirmation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AccessManagerExpired",
    "inputs": [
      {
        "name": "operationId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerInvalidInitialAdmin",
    "inputs": [
      {
        "name": "initialAdmin",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerLockedRole",
    "inputs": [
      {
        "name": "roleId",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerNotReady",
    "inputs": [
      {
        "name": "operationId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerNotScheduled",
    "inputs": [
      {
        "name": "operationId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerUnauthorizedAccount",
    "inputs": [
      {
        "name": "msgsender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerUnauthorizedCall",
    "inputs": [
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerUnauthorizedCancel",
    "inputs": [
      {
        "name": "msgsender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "AccessManagerUnauthorizedConsume",
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
    "name": "AmountMismatch",
    "inputs": [
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "AmountSumMismatch",
    "inputs": [
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "computed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ApprovalAlreadyConsumed",
    "inputs": [
      {
        "name": "transferKey",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ApprovalExpired",
    "inputs": [
      {
        "name": "expiresAt",
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
    "name": "ArrayLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AtLeastOneClassRequired",
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
    "name": "BelowMinimumSubscription",
    "inputs": [
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "CalculatorNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CallExpired",
    "inputs": [
      {
        "name": "callId",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "deadline",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "graceEndsAt",
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
    "name": "CallNotAnnounced",
    "inputs": [
      {
        "name": "callId",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum CapitalCallLib.CapitalCallStatus"
      }
    ]
  },
  {
    "type": "error",
    "name": "CallNotFound",
    "inputs": [
      {
        "name": "callId",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "ClassBCannotBeSubscribable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClassBCannotHaveSubTiers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClassBReasonRequired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClassBRequiresManagerMintOnly",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClassConfigNoneShareClass",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClassMintCapExceeded",
    "inputs": [
      {
        "name": "shareClass",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      },
      {
        "name": "cap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "attempted",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ClassMismatch",
    "inputs": [
      {
        "name": "existing",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      },
      {
        "name": "attempted",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      }
    ]
  },
  {
    "type": "error",
    "name": "ClassNotSubscribable",
    "inputs": [
      {
        "name": "shareClass",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      }
    ]
  },
  {
    "type": "error",
    "name": "ClassRequiresManagerMintOnly",
    "inputs": [
      {
        "name": "shareClass",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      }
    ]
  },
  {
    "type": "error",
    "name": "CombinedCapExceeded",
    "inputs": [
      {
        "name": "cap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "attempted",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "CombinedCapNoneShareClass",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CombinedCapRequiresClasses",
    "inputs": []
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
    "name": "ContributorArraysMismatch",
    "inputs": [
      {
        "name": "contributorsLen",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "unitsLen",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ContributorNotCompliant",
    "inputs": [
      {
        "name": "contributor",
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
    "name": "DeadlineInPast",
    "inputs": [
      {
        "name": "deadline",
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
    "name": "DealAlreadyExists",
    "inputs": [
      {
        "name": "dealId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
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
    "name": "DistributionIdAlreadyUsed",
    "inputs": [
      {
        "name": "distributionId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "DuplicateClassInCombinedCap",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DuplicateContributor",
    "inputs": [
      {
        "name": "contributor",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DuplicateSubTier",
    "inputs": [
      {
        "name": "tierId",
        "type": "uint8",
        "internalType": "uint8"
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
    "name": "EmptyAnnouncementURI",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyContributorList",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyMethodologyNote",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyPurpose",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyReasonDetail",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyRecipientList",
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
    "name": "EmptyTransferAgreementHash",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EntityAlreadyBoundToWallet",
    "inputs": [
      {
        "name": "entityId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "EntityNotFound",
    "inputs": [
      {
        "name": "entityId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1155InsufficientBalance",
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
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1155InvalidApprover",
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
    "name": "ERC1155InvalidArrayLength",
    "inputs": [
      {
        "name": "idsLength",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "valuesLength",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1155InvalidOperator",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1155InvalidReceiver",
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
    "name": "ERC1155InvalidSender",
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
    "name": "ERC1155MissingApprovalForAll",
    "inputs": [
      {
        "name": "operator",
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
    "name": "ERC1967InvalidAdmin",
    "inputs": [
      {
        "name": "admin",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1967InvalidBeacon",
    "inputs": [
      {
        "name": "beacon",
        "type": "address",
        "internalType": "address"
      }
    ]
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
    "name": "ERC1967ProxyUninitialized",
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
    "name": "ERC5267ExtensionsNotSupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ERC721IncorrectOwner",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "ERC721InsufficientApproval",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidApprover",
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
    "name": "ERC721InvalidOperator",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidReceiver",
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
    "name": "ERC721InvalidSender",
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
    "name": "ERC721NonexistentToken",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "FailedDeployment",
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
    "name": "GracePeriodTooLong",
    "inputs": [
      {
        "name": "attempted",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "max",
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
    "name": "InsufficientBalance",
    "inputs": [
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
    "name": "InvalidCalculatorSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidExpiry",
    "inputs": [
      {
        "name": "expiresAt",
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
    "name": "InvalidPaymentTimestamp",
    "inputs": [
      {
        "name": "declaration",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "payment",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidShareClass",
    "inputs": [
      {
        "name": "shareClass",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidStatusTransition",
    "inputs": [
      {
        "name": "from",
        "type": "uint8",
        "internalType": "enum IssuerRegistry.IssuerStatus"
      },
      {
        "name": "to",
        "type": "uint8",
        "internalType": "enum IssuerRegistry.IssuerStatus"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSubTier",
    "inputs": [
      {
        "name": "shareClass",
        "type": "uint8",
        "internalType": "enum SingleSpvRealEstateToken.ShareClass"
      },
      {
        "name": "subTier",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSubTierId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTimelockConfiguration",
    "inputs": [
      {
        "name": "reason",
        "type": "string",
        "internalType": "string"
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
    "name": "MethodologyNoteTooLong",
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
    "name": "MissingPrecompile",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NavChangeExceedsBounds",
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
    "name": "NotFactory",
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
    "name": "PurposeTooLong",
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
    "name": "ReasonDetailTooLong",
    "inputs": [
      {
        "name": "length",
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
    "name": "RecipientAmountArrayMismatch",
    "inputs": [
      {
        "name": "recipientsLen",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountsLen",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeCastOverflowedIntDowncast",
    "inputs": [
      {
        "name": "bits",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "value",
        "type": "int256",
        "internalType": "int256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeCastOverflowedIntToUint",
    "inputs": [
      {
        "name": "value",
        "type": "int256",
        "internalType": "int256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeCastOverflowedUintDowncast",
    "inputs": [
      {
        "name": "bits",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeCastOverflowedUintToInt",
    "inputs": [
      {
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "StringsInsufficientHexLength",
    "inputs": [
      {
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "StringsInvalidAddressFormat",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StringsInvalidChar",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SubscribableClassRequiresSubTiers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SubTierMismatch",
    "inputs": [
      {
        "name": "existing",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "attempted",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "SubTierSplitsMustSumTo10000",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TimelockInsufficientDelay",
    "inputs": [
      {
        "name": "delay",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minDelay",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "TimelockInvalidOperationLength",
    "inputs": [
      {
        "name": "targets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "payloads",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "values",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "TimelockUnauthorizedCaller",
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
    "name": "TimelockUnexecutedPredecessor",
    "inputs": [
      {
        "name": "predecessorId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "TimelockUnexpectedOperationState",
    "inputs": [
      {
        "name": "operationId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "expectedStates",
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
    "name": "TokenAlreadyDelisted",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "TokenAlreadyRegistered",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "TokenNotDelisted",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "TokenNotRegistered",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "TooManySubTiers",
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
    "name": "UnitPriceAtIssuanceRequired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "URIHashMismatch",
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
    "name": "WalletAlreadyBoundToEntity",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "entityId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "WrongChainId",
    "inputs": [
      {
        "name": "expected",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "received",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "WrongNonce",
    "inputs": [
      {
        "name": "expected",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "received",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "WrongToken",
    "inputs": [
      {
        "name": "expected",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "received",
        "type": "address",
        "internalType": "address"
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
    "inputs": [
      {
        "name": "recipientIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
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
    "name": "ZeroDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroNav",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroReportURIHash",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroTotalRequested",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroUnits",
    "inputs": []
  }
] as const;
