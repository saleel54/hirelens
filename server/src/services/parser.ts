import pdf from 'pdf-parse';

/**
 * Extracts raw text from an uploaded PDF file buffer
 * @param pdfBuffer Buffer of the uploaded PDF file
 * @returns Promise resolving to the extracted and trimmed text
 */
export const parseResumePDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(pdfBuffer);
    
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
  } catch (error: any) {
    console.error('❌ [pdf-parser-service-error]:', error.message || error);
    throw new Error(`Failed to parse PDF resume: ${error.message || 'Unknown error'}`);
  }
};
