const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ledgerPath = path.join(__dirname, "../ledger/materialChain.json");

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function loadChain() {
  if (!fs.existsSync(ledgerPath)) return [];
  return JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
}

function saveChain(chain) {
  fs.writeFileSync(ledgerPath, JSON.stringify(chain, null, 2));
}

function computeBlockHash(block) {
  const baseBlock = {
    index: block.index,
    timestamp: block.timestamp,
    fileName: block.fileName,
    fileHash: block.fileHash,
    previousHash: block.previousHash
  };

  return sha256(JSON.stringify(baseBlock));
}

function addMaterialBlock(fileName, fileContent) {
  const chain = loadChain();

  const previousHash =
    chain.length > 0 ? chain[chain.length - 1].hash : "000000";

  const fileHash = sha256(fileContent);

  const block = {
    index: chain.length + 1,
    timestamp: new Date().toISOString(),
    fileName,
    fileHash,
    previousHash
  };

  block.hash = computeBlockHash(block);

  const gasUsed = 21000 + Math.floor(fileContent.length / 10);
  const gasPrice = 1;
  const gasFee = gasUsed * gasPrice / 1e9;

  block.gasUsed = gasUsed;
  block.gasFee = gasFee + " ETH";

  chain.push(block);
  saveChain(chain);

  return block;
}

function verifyMaterialChain() {
  const chain = loadChain();

  if (chain.length === 0) {
    return {
      valid: true,
      message: "Chain is empty.",
      blocks: 0
    };
  }

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];

    const expectedHash = computeBlockHash(current);
    if (current.hash !== expectedHash) {
      return {
        valid: false,
        message: `Block ${current.index} has been tampered with.`,
        blockIndex: current.index,
        issue: "hash_mismatch"
      };
    }

    if (i === 0) {
      if (current.previousHash !== "000000") {
        return {
          valid: false,
          message: "Genesis block previousHash is invalid.",
          blockIndex: current.index,
          issue: "invalid_genesis_previous_hash"
        };
      }
    } else {
      const previous = chain[i - 1];
      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          message: `Block ${current.index} is not properly linked to the previous block.`,
          blockIndex: current.index,
          issue: "broken_chain_link"
        };
      }
    }
  }

  return {
    valid: true,
    message: "Blockchain integrity verified successfully.",
    blocks: chain.length
  };
}

module.exports = {
  addMaterialBlock,
  verifyMaterialChain
};