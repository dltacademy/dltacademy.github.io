"""Roda os testes do motor de protocolos feitos em Node (DOM falso)."""
from __future__ import annotations

import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("node"), "node não está instalado")
class ProtocolEngineNodeTests(unittest.TestCase):
    def test_testes_do_motor_em_node(self) -> None:
        arquivos = sorted(str(p) for p in (ROOT / "tests" / "js").glob("*.test.mjs"))
        self.assertTrue(arquivos, "nenhum teste em tests/js")
        resultado = subprocess.run(
            ["node", "--test", *arquivos],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=300,
        )
        self.assertEqual(resultado.returncode, 0, resultado.stdout[-4000:] + resultado.stderr[-2000:])


if __name__ == "__main__":
    unittest.main()
