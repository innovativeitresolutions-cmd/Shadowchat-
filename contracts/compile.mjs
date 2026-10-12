import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const here = path.dirname(fileURLToPath(import.meta.url));
export function compileContract() {
  const source = fs.readFileSync(path.join(here, "SkyLaunchToken.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "SkyLaunchToken.sol": { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (output.errors || []).filter((e) => e.severity === "error");
  if (fatal.length) throw new Error(fatal.map((x) => x.formattedMessage).join("\n"));
  const artifact = output.contracts?.["SkyLaunchToken.sol"]?.SkyLaunchToken;
  if (!artifact?.abi?.length || !/^[0-9a-f]+$/i.test(artifact.evm?.bytecode?.object || ""))
    throw new Error("Compiler did not produce a valid deployment artifact.");
  return { abi: artifact.abi, bytecode: "0x" + artifact.evm.bytecode.object, compiler: solc.version(), audited: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const compiled = compileContract();
  const dest = path.join(here, "artifacts");
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, "SkyLaunchToken.json"), JSON.stringify(compiled, null, 2) + "\n");
  console.log("Compiled ERC-20 testnet artifact; bytecode length:", compiled.bytecode.length);
}
