"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResumePDF = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
/**
 * Extracts raw text from an uploaded PDF file buffer
 * @param pdfBuffer Buffer of the uploaded PDF file
 * @returns Promise resolving to the extracted and trimmed text
 */
const parseResumePDF = async (pdfBuffer) => {
    try {
        const data = await (0, pdf_parse_1.default)(pdfBuffer);
        if (!data || !data.text) {
            throw new Error('No readable text found in PDF');
        }
        // Clean up excessive spacing, control characters, and line breaks
        const cleanedText = data.text
            .replace(/\r\n/g, '\n')
            .replace(/\n+/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
        return cleanedText;
    }
    catch (error) {
        console.error('❌ [pdf-parser-service-error]:', error.message || error);
        throw new Error(`Failed to parse PDF resume: ${error.message || 'Unknown error'}`);
    }
};
exports.parseResumePDF = parseResumePDF;
