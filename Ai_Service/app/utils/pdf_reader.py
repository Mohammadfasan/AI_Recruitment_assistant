"""
PDF Text Extraction Utilities
Extracts clean text from uploaded resume PDFs
"""

import pdfplumber
from pathlib import Path
from loguru import logger
from typing import Optional

def extract_text_from_pdf(file_path: str | Path) -> Optional[str]:
    """
    Extract text from PDF file using pdfplumber
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Extracted text as string, or None if extraction fails
    """
    try:
        file_path = Path(file_path)
        
        if not file_path.exists():
            logger.error(f"PDF file not found: {file_path}")
            return None
        
        text_parts = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                else:
                    logger.warning(f"No text extracted from page {page_num} of {file_path.name}")
        
        full_text = "\n\n".join(text_parts)
        
        if not full_text.strip():
            logger.warning(f"No text content found in PDF: {file_path.name}")
            return None
        
        logger.info(f"Successfully extracted {len(full_text)} characters from {file_path.name}")
        return full_text
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        return None

def extract_text_from_pdf_bytes(file_bytes: bytes) -> Optional[str]:
    """
    Extract text from PDF bytes (for direct upload without saving)
    
    Args:
        file_bytes: PDF file as bytes
        
    Returns:
        Extracted text as string, or None if extraction fails
    """
    try:
        import io
        
        text_parts = []
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        
        full_text = "\n\n".join(text_parts)
        
        if not full_text.strip():
            logger.warning("No text content found in PDF bytes")
            return None
        
        return full_text
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF bytes: {e}")
        return None

def extract_text_from_docx(file_path: str | Path) -> Optional[str]:
    """
    Extract text from DOCX file using standard library zipfile and xml parsing
    
    Args:
        file_path: Path to DOCX file
        
    Returns:
        Extracted text as string, or None if extraction fails
    """
    try:
        with open(file_path, 'rb') as f:
            return extract_text_from_docx_bytes(f.read())
    except Exception as e:
        logger.error(f"Error extracting text from docx file {file_path}: {e}")
        return None

def extract_text_from_docx_bytes(file_bytes: bytes) -> Optional[str]:
    """
    Extract text from DOCX bytes using standard library zipfile and xml parsing
    
    Args:
        file_bytes: DOCX file contents as bytes
        
    Returns:
        Extracted text as string, or None if extraction fails
    """
    try:
        import zipfile
        import xml.etree.ElementTree as ET
        import io
        
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            # Word document main content is in word/document.xml
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            paragraphs = []
            # w:p is paragraph tag under Microsoft Word's openxml namespaces
            # iteration over {http://schemas.openxmlformats.org/wordprocessingml/2006/main}p
            # retrieves text from {http://schemas.openxmlformats.org/wordprocessingml/2006/main}t
            for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            
            full_text = "\n".join(paragraphs)
            
            # Namespace-independent fallback search if first method returns empty
            if not full_text.strip():
                paragraphs = []
                for paragraph in root.findall('.//{*}p'):
                    texts = [node.text for node in paragraph.findall('.//{*}t') if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                full_text = "\n".join(paragraphs)
                
            if not full_text.strip():
                logger.warning("No text content found in DOCX bytes")
                return None
                
            return full_text
            
    except Exception as e:
        logger.error(f"Error extracting text from docx bytes: {e}")
        return None