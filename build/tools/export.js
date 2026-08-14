import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function executeExport(input) {
    const outDir = path.join(process.cwd(), 'output');
    // Resolve source path
    let sourcePath = input.source_path;
    if (!path.isAbsolute(sourcePath)) {
        sourcePath = path.resolve(outDir, sourcePath);
    }
    // Anti-path traversal for source
    if (!sourcePath.startsWith(outDir) && !sourcePath.startsWith(process.cwd())) {
        throw new Error('Source path must be within the allowed directories.');
    }
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
    }
    // Determine target path
    let targetPath = input.target_path;
    if (!targetPath) {
        const ext = path.extname(sourcePath);
        targetPath = sourcePath.replace(new RegExp(`${ext}$`), `.${input.target_format}`);
    }
    else if (!path.isAbsolute(targetPath)) {
        targetPath = path.resolve(outDir, targetPath);
    }
    // Anti-path traversal for target
    if (!targetPath.startsWith(outDir)) {
        throw new Error('Path traversal detected. Output must be within the output directory.');
    }
    // Build mmdc command
    // mmdc -i <input> -o <output>
    let cmd = `npx mmdc -i "${sourcePath}" -o "${targetPath}"`;
    if (input.options?.width)
        cmd += ` -w ${input.options.width}`;
    if (input.options?.height)
        cmd += ` -H ${input.options.height}`;
    if (input.options?.scale)
        cmd += ` -s ${input.options.scale}`;
    if (input.options?.background)
        cmd += ` -b "${input.options.background}"`;
    try {
        await execAsync(cmd);
        return {
            file_path: targetPath,
            format: input.target_format
        };
    }
    catch (err) {
        throw new Error(`Failed to export diagram: ${err.message}`);
    }
}
