// Regrava os arquivos de referência desta pasta a partir do motor atual.
// Rode só quando o comportamento dos protocolos mudar de propósito:
//   node tests/js/golden/gerar.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROTOCOLOS, gerarGolden } from "./percurso.mjs";

const pasta = path.dirname(fileURLToPath(import.meta.url));
for (const entrada of PROTOCOLOS) {
  const golden = gerarGolden(entrada);
  fs.writeFileSync(path.join(pasta, entrada.slug + ".json"), JSON.stringify(golden, null, 1) + "\n");
  const n = Object.keys(golden.texto.cheio).length + Object.keys(golden.texto.vazio).length;
  console.log(entrada.slug + ": " + n + " percursos, " + Object.keys(golden.amostras).length + " amostras .md");
}
