"""
ArchView Tkinter - Bridge para Motor Node.js / MCP
"""

import os
import json
import subprocess

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def run_node_eval(script_code: str) -> dict:
    try:
        out = subprocess.check_output(
            ['npx', 'tsx', '-e', script_code],
            cwd=REPO_ROOT,
            stderr=subprocess.STDOUT,
            text=True
        )
        return json.loads(out)
    except subprocess.CalledProcessError as err:
        return {'success': False, 'error': err.output}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def run_linter_bridge(target_path: str) -> dict:
    code = f"""
    import {{ executeLintArchitecture }} from './src/tools/lint-architecture.js';
    const res = executeLintArchitecture({{ path: '{target_path}' }});
    console.log(JSON.stringify(res, null, 2));
    """
    return run_node_eval(code)

def run_diff_bridge(before_path: str, after_path: str) -> dict:
    code = f"""
    import {{ compareTopologies }} from './src/engine/architecture-diff.js';
    import {{ scanCodebase }} from './src/engine/universal-scanner.js';
    const b = scanCodebase('{before_path}');
    const a = scanCodebase('{after_path}');
    const diff = compareTopologies(b, a);
    console.log(JSON.stringify(diff, null, 2));
    """
    return run_node_eval(code)

def run_compress_bridge(target_path: str) -> dict:
    code = f"""
    import {{ executeCompressForLlm }} from './src/tools/compress-llm.js';
    const res = executeCompressForLlm({{ path: '{target_path}' }});
    console.log(JSON.stringify(res, null, 2));
    """
    return run_node_eval(code)
