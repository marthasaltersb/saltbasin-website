import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath = process.argv[2];
if (!workbookPath) throw new Error('workbook path required');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const summary = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 20000,
  tableMaxRows: 8,
  tableMaxCols: 40,
  tableMaxCellChars: 160,
});
console.log(summary.ndjson);
