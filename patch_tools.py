import re

tools = ['mindmap.ts', 'orgchart.ts', 'architecture.ts', 'flowchart.ts', 'export.ts']
schemas = {
    'mindmap.ts': 'MindmapInputSchema, validateMindmapGuardrails',
    'orgchart.ts': 'OrgchartInputSchema',
    'architecture.ts': 'ArchitectureInputSchema',
    'flowchart.ts': 'FlowchartInputSchema',
    'export.ts': 'ExportInputSchema'
}
schema_names = {
    'mindmap.ts': 'MindmapInputSchema',
    'orgchart.ts': 'OrgchartInputSchema',
    'architecture.ts': 'ArchitectureInputSchema',
    'flowchart.ts': 'FlowchartInputSchema',
    'export.ts': 'ExportInputSchema'
}

for tool in tools:
    try:
        with open(f'src/tools/{tool}', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Skipping {tool} as it was not found.")
        continue

    # Import Zod schema
    import_str = f"import {{ {schemas[tool]} }} from '../utils/validation.js';"
    if tool == 'export.ts':
        content = f"{import_str}\n" + content
    else:
        # insert after first import
        content = content.replace("import", f"{import_str}\nimport", 1)

    # Add Zod validation at start of execute function
    fn_name_match = re.search(r'export (async )?function execute[A-Za-z]+\(input: (.*?)\)', content)
    if not fn_name_match:
        fn_name_match = re.search(r'export (async )?function execute[A-Za-z]+\(args: (.*?)\)', content)

    if fn_name_match:
        full_match = fn_name_match.group(0)
        is_async = fn_name_match.group(1) or ""
        input_type = fn_name_match.group(2)
        var_name = "input" if "input:" in full_match else "args"

        replacement = f"{full_match} {{\n  // Validate input with Zod\n  const validData = {schema_names[tool]}.parse({var_name}) as {input_type};"

        # for mindmap, add the guardrail
        if tool == 'mindmap.ts':
             replacement += "\n  // Check guardrails\n  validateMindmapGuardrails(validData.branches);"

        # replace the variable name internally to use validData
        # instead of a massive string replace, let's just reassign
        replacement += f"\n  {var_name} = validData;"
        content = content.replace(f"{full_match} {{", replacement, 1)

    with open(f'src/tools/{tool}', 'w', encoding='utf-8') as f:
        f.write(content)
