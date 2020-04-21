import csvParse from 'csv-parse';
import fs from 'fs';
import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, categoryTitle] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !categoryTitle) return;

      transactions.push({ title, type, value, categoryTitle });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const importedTransactions: Transaction[] = [];
    const createTransaction = new CreateTransactionService();

    /**
     * Usei esta abordagem para economizar codigo e centralizar a criacao
     * das transacoes, vi outras abordagens mas neste caso achei esta melhor
     * ja que performance nesta importacao nao e tao importante.
     */
    // eslint-disable-next-line no-restricted-syntax
    for (const transaction of transactions) {
      // eslint-disable-next-line no-await-in-loop
      const importedTransaction = await createTransaction.execute(transaction);

      importedTransactions.push(importedTransaction);
    }

    await fs.promises.unlink(filePath);

    return importedTransactions;
  }
}
export default ImportTransactionsService;
