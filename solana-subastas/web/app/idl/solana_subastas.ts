/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_subastas.json`.
 */
export type SolanaSubastas = {
  "address": "FgYc9CFaC3KnGniZ7ATrAvSX7PX4AspW225GUkYz8tcj",
  "metadata": {
    "name": "solanaSubastas",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "crearPuja",
      "discriminator": [
        168,
        190,
        185,
        51,
        149,
        172,
        2,
        133
      ],
      "accounts": [
        {
          "name": "subasta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  97,
                  115,
                  116,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "puja",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  106,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "importePuja",
          "type": "u64"
        },
        {
          "name": "ts",
          "type": "u64"
        }
      ]
    },
    {
      "name": "crearSubasta",
      "discriminator": [
        13,
        34,
        70,
        7,
        205,
        125,
        76,
        113
      ],
      "accounts": [
        {
          "name": "subasta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  97,
                  115,
                  116,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "nombre",
          "type": "string"
        },
        {
          "name": "descripcion",
          "type": "string"
        },
        {
          "name": "importeMinimo",
          "type": "u64"
        },
        {
          "name": "fechaInicio",
          "type": "u64"
        },
        {
          "name": "fechaFin",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finalizarSubasta",
      "discriminator": [
        27,
        60,
        244,
        11,
        90,
        2,
        163,
        48
      ],
      "accounts": [
        {
          "name": "subasta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  97,
                  115,
                  116,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        }
      ]
    },
    {
      "name": "iniciarSubasta",
      "discriminator": [
        167,
        176,
        176,
        143,
        128,
        22,
        232,
        81
      ],
      "accounts": [
        {
          "name": "subasta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  97,
                  115,
                  116,
                  97
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "puja",
      "discriminator": [
        103,
        69,
        243,
        232,
        151,
        17,
        244,
        89
      ]
    },
    {
      "name": "subasta",
      "discriminator": [
        236,
        131,
        101,
        31,
        43,
        145,
        20,
        16
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "subastaYaIniciada",
      "msg": "La subasta ya ha sido iniciada"
    },
    {
      "code": 6001,
      "name": "subastaNoActiva",
      "msg": "La subasta no está activa"
    },
    {
      "code": 6002,
      "name": "subastaYaFinalizada",
      "msg": "La subasta ya ha sido finalizada"
    },
    {
      "code": 6003,
      "name": "pujaInsuficiente",
      "msg": "El importe de la puja es insuficiente"
    },
    {
      "code": 6004,
      "name": "soloCreadorPuedeIniciar",
      "msg": "Solo el creador puede iniciar la subasta"
    },
    {
      "code": 6005,
      "name": "soloCreadorPuedeFinalizar",
      "msg": "Solo el creador puede finalizar la subasta"
    },
    {
      "code": 6006,
      "name": "fechaFinInvalida",
      "msg": "La fecha de fin debe ser posterior a la de inicio"
    }
  ],
  "types": [
    {
      "name": "puja",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "importePuja",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "u64"
          },
          {
            "name": "pk",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "subasta",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "nombre",
            "type": "string"
          },
          {
            "name": "descripcion",
            "type": "string"
          },
          {
            "name": "importeMinimo",
            "type": "u64"
          },
          {
            "name": "fechaInicio",
            "type": "u64"
          },
          {
            "name": "fechaFin",
            "type": "u64"
          },
          {
            "name": "estado",
            "type": "u64"
          },
          {
            "name": "creador",
            "type": "pubkey"
          },
          {
            "name": "ganador",
            "type": "pubkey"
          },
          {
            "name": "importeGanador",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
