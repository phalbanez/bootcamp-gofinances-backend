import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (!title) {
      throw new AppError('Title not informed.');
    }

    if (!type || (type !== 'income' && type !== 'outcome')) {
      throw new AppError('Invalid informed type.');
    }

    if (!value || value <= 0) {
      throw new AppError('Invalid informed value.');
    }

    if (!categoryTitle) {
      throw new AppError('Category title not informed.');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance.');
    }

    let category = await categoriesRepository.findOne({
      where: {
        title: categoryTitle,
      },
    });

    if (!category) {
      category = await categoriesRepository.create({
        title: categoryTitle,
      });

      await categoriesRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
