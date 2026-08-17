"""
ArchView Tkinter - Bridge para Motor Node.js / MCP
"""

import os
import json
import subprocess

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def run_node_eval(script_code: str) -> dict:
    try:
        full_code = f"""
        (async () => {{
          try {{
            {script_code}
          }} catch (err) {{
            console.error(err);
            process.exit(1);
          }}
        }})();
        """
        out = subprocess.check_output(
            ['node', '--import', 'tsx', '--input-type=module', '-e', full_code],
            cwd=REPO_ROOT,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in out.strip().split('\n'):
            line = line.strip()
            if line.startswith('{') and line.endswith('}'):
                try:
                    return json.loads(line)
                except Exception:
                    continue
        return json.loads(out.strip())
    except subprocess.CalledProcessError as err:
        return {'success': False, 'error': err.output}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def run_linter_bridge(target_path: str) -> dict:
    code = f"""
    const {{ executeLintArchitecture }} = await import('./src/tools/lint-architecture.ts');
    const res = executeLintArchitecture({{ path: '{target_path}' }});
    console.log(JSON.stringify(res));
    """
    return run_node_eval(code)

def run_diff_bridge(before_path: str, after_path: str) -> dict:
    code = f"""
    const {{ compareTopologies }} = await import('./src/engine/architecture-diff.ts');
    const {{ scanCodebase }} = await import('./src/engine/universal-scanner.ts');
    const b = scanCodebase('{before_path}');
    const a = scanCodebase('{after_path}');
    const diff = compareTopologies(b, a);
    console.log(JSON.stringify(diff));
    """
    return run_node_eval(code)

def run_compress_bridge(target_path: str) -> dict:
    code = f"""
    const {{ executeCompressForLlm }} = await import('./src/tools/compress-llm.ts');
    const res = executeCompressForLlm({{ path: '{target_path}' }});
    console.log(JSON.stringify(res));
    """
    return run_node_eval(code)
