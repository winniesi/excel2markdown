'use client';

import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';

type TableData = (string | number)[][];

type AlignMode = 'left' | 'center' | 'right' | 'none';

export default function Home() {
  const [tableData, setTableData] = useState<TableData>([]);
  const [markdown, setMarkdown] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [alignMode, setAlignMode] = useState<AlignMode>('left');
  const [boldHeader, setBoldHeader] = useState<boolean>(true);
  const [pasteText, setPasteText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMarkdown = useCallback((data: TableData): string => {
    if (data.length === 0) return '';

    const maxCols = Math.max(...data.map(row => row.length));
    const paddedData = data.map(row => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      return padded;
    });

    const colWidths = Array(maxCols).fill(0).map((_, colIdx) => {
      return Math.max(...paddedData.map(row => String(row[colIdx] || '').length), 3);
    });

    const escapeMarkdown = (text: string | number): string => {
      let str = String(text ?? '');
      str = str.replace(/\|/g, '\\|');
      return str;
    };

    const padCell = (text: string, width: number, align: AlignMode): string => {
      const textLen = text.length;
      if (textLen >= width) return text;
      const diff = width - textLen;
      switch (align) {
        case 'left':
          return text + ' '.repeat(diff);
        case 'right':
          return ' '.repeat(diff) + text;
        case 'center':
          const left = Math.floor(diff / 2);
          return ' '.repeat(left) + text + ' '.repeat(diff - left);
        default:
          return text;
      }
    };

    const lines: string[] = [];

    const headerRow = paddedData[0].map((cell, i) => {
      const text = boldHeader ? `**${escapeMarkdown(cell)}**` : escapeMarkdown(cell);
      return padCell(text, boldHeader ? colWidths[i] + 4 : colWidths[i], alignMode);
    });
    lines.push(`| ${headerRow.join(' | ')} |`);

    const separatorRow = Array(maxCols).fill(0).map((_, i) => {
      const baseWidth = Math.max(colWidths[i], boldHeader ? colWidths[i] + 4 : 3);
      switch (alignMode) {
        case 'left':
          return `:${'-'.repeat(baseWidth - 1)}`;
        case 'right':
          return `${'-'.repeat(baseWidth - 1)}:`;
        case 'center':
          return `:${'-'.repeat(baseWidth - 2)}:`;
        default:
          return '-'.repeat(baseWidth);
      }
    });
    lines.push(`| ${separatorRow.join(' | ')} |`);

    for (let i = 1; i < paddedData.length; i++) {
      const row = paddedData[i].map((cell, j) => {
        return padCell(escapeMarkdown(cell), boldHeader ? colWidths[j] + 4 : colWidths[j], alignMode);
      });
      lines.push(`| ${row.join(' | ')} |`);
    }

    return lines.join('\n');
  }, [alignMode, boldHeader]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result;
      const wb = XLSX.read(data, { type: 'binary' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setActiveSheet(wb.SheetNames[0]);

      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });
      setTableData(jsonData);
      setMarkdown(generateMarkdown(jsonData));
    };

    reader.readAsBinaryString(file);
  }, [generateMarkdown]);

  const handleSheetChange = useCallback((sheetName: string) => {
    if (!workbook) return;
    setActiveSheet(sheetName);
    const ws = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 });
    setTableData(jsonData);
    setMarkdown(generateMarkdown(jsonData));
  }, [workbook, generateMarkdown]);

  const parseTableText = useCallback((text: string): TableData => {
    let rows: (string | number)[][];

    if (text.includes('\t')) {
      rows = text.split('\n').map(row => row.split('\t'));
    } else if (text.includes('|')) {
      const lines = text.split('\n').filter(line => line.trim());
      rows = lines.map(line =>
        line.split('|')
          .map(cell => cell.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
      );
      if (rows.length > 1 && rows[1].every(cell => /^-+$/.test(String(cell)) || /^:-+:$/.test(String(cell)) || /^:-+$/.test(String(cell)) || /^-+:$/.test(String(cell)))) {
        rows.splice(1, 1);
      }
    } else {
      rows = text.split('\n').map(row => [row]);
    }

    return rows.filter(row => row.some(cell => String(cell).trim() !== ''));
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = parseTableText(text);
      setTableData(data);
      setMarkdown(generateMarkdown(data));
      setFileName('');
      setSheetNames([]);
      setWorkbook(null);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }, [parseTableText, generateMarkdown]);

  const handleTextInput = useCallback((text: string) => {
    setPasteText(text);
    if (text.trim()) {
      const data = parseTableText(text);
      setTableData(data);
      setMarkdown(generateMarkdown(data));
      setFileName('');
      setSheetNames([]);
      setWorkbook(null);
    } else {
      setTableData([]);
      setMarkdown('');
    }
  }, [parseTableText, generateMarkdown]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.(xlsx|xls|xlsm)$/i, '') + '.md' || 'table.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, fileName]);

  const handleClear = useCallback(() => {
    setTableData([]);
    setMarkdown('');
    setFileName('');
    setSheetNames([]);
    setActiveSheet('');
    setWorkbook(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleAlignChange = useCallback((mode: AlignMode) => {
    setAlignMode(mode);
    setMarkdown(generateMarkdown(tableData));
  }, [tableData, generateMarkdown]);

  const handleBoldHeaderChange = useCallback(() => {
    setBoldHeader(!boldHeader);
    setMarkdown(generateMarkdown(tableData));
  }, [boldHeader, tableData, generateMarkdown]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Excel to Markdown</h1>
            </div>
            <p className="text-sm text-gray-500">All conversions done locally, no data uploaded</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section aria-labelledby="intro-heading" className="mb-8 text-center">
          <h2 id="intro-heading" className="text-2xl font-bold text-gray-900 mb-2">Free Excel to Markdown Table Converter</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert Excel files (.xlsx, .xls, .xlsm) or clipboard table data to standard Markdown format instantly.
            Support for left, center, right alignment options, customizable bold headers, all conversions done locally to protect your data privacy.
          </p>
        </section>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 rounded-xl bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Upload File</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Excel
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports .xlsx, .xls, .xlsm formats</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl bg-white">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Paste Text</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handlePaste}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Paste from Clipboard
                  </button>
                  {pasteText && (
                    <button
                      onClick={() => handleTextInput('')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => handleTextInput(e.target.value)}
                  placeholder="Paste table data copied from Excel, Word, web pages...&#10;Supports Tab-separated, Markdown table formats"
                  className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center mt-4">
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sheet:</span>
                <select
                  value={activeSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {tableData.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            )}
          </div>

          {fileName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{fileName}</span>
              <span className="text-gray-400">·</span>
              <span>{tableData.length} rows</span>
            </div>
          )}
        </div>

        {tableData.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Format Options</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Alignment:</span>
                {(['left', 'center', 'right', 'none'] as AlignMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleAlignChange(mode)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      alignMode === mode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'left' ? 'Left' : mode === 'center' ? 'Center' : mode === 'right' ? 'Right' : 'None'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={boldHeader}
                    onChange={handleBoldHeaderChange}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">Bold Header</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Table Preview</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
              {tableData.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Upload Excel file or paste table data</p>
                  <p className="text-sm text-gray-400 mt-1">Whichever action was performed last will take effect</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {tableData[0]?.map((cell, i) => (
                          <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap">
                            {String(cell ?? '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                          {row.map((cell, colIdx) => (
                            <td key={colIdx} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">Markdown Output</h2>
              {markdown && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-100 border border-emerald-400 text-emerald-700'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {copied ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
              {markdown ? (
                <pre className="p-4 text-sm font-mono text-gray-700 bg-gray-50 overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
                  {markdown}
                </pre>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Markdown will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <section aria-labelledby="features-heading" className="mt-12 mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <h2 id="features-heading" className="text-xl font-bold text-gray-900 mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">🔒 Privacy First</h3>
              <p className="text-sm text-gray-600">All file conversions happen locally in your browser, no data is ever uploaded to any server</p>
            </article>
            <article className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">⚡ Multiple Input Methods</h3>
              <p className="text-sm text-gray-600">Support uploading Excel files (.xlsx, .xls, .xlsm) or pasting directly from clipboard</p>
            </article>
            <article className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">🎨 Custom Formatting</h3>
              <p className="text-sm text-gray-600">Support left, center, right, or no alignment options with toggleable bold header styles</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Excel to Markdown Converter · Runs entirely locally, your data stays private</p>
        </div>
      </footer>
    </div>
  );
}
