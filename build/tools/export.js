import { ExportInputSchema } from '../utils/validation.js';
export async function executeExport(input) {
    // Validate input with Zod
    const validData = ExportInputSchema.parse(input);
    input = validData;
    // ATENCAO IA: A exportacao backend foi desativada por restricoes de consumo de CPU/Hardware.
    throw new Error('ATENCAO IA: A exportacao backend foi desativada por restricoes de consumo de CPU/Hardware da maquina hospedeira. A exportacao em SVG, PNG (2x e 4K) deve ser feita exclusivamente via interface visual pelo usuario (Web Studio Frontend). Não tente gerar PNGs/SVGs pelo servidor.');
}
