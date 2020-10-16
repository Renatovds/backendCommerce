import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const existCustomer = await this.customersRepository.findById(customer_id);
    if (!existCustomer) {
      throw new AppError('There is no customer with this id.');
    }
    const existentProducts = await this.productsRepository.findAllById(
      products,
    );
    if (!existentProducts.length) {
      throw new AppError('Could not find any product with given Id.');
    }

    const existentProductsIds = existentProducts.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !existentProductsIds.includes(product.id),
    );

    if (checkInexistentProducts.length) {
      const notFindedIds = checkInexistentProducts.map(
        inexistentProduct => inexistentProduct.id,
      );
      throw new AppError(
        `Could not find product(s) of id(s):${notFindedIds.toString()}`,
      );
    }

    const checkQuantityProducts = existentProducts.filter(product => {
      const sameProduct = products.filter(p => p.id === product.id)[0];
      return product.quantity > sameProduct.quantity ? null : product;
    });

    if (checkQuantityProducts.length) {
      throw new AppError(
        `The quantity: ${checkQuantityProducts[0].quantity} is not available for id: ${checkQuantityProducts[0].id}`,
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existentProducts.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: existCustomer,
      products: serializedProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
