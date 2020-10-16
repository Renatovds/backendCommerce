import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIDs = products.map(product => product.id);
    const existentProducts = await this.ormRepository.find({
      where: {
        id: In(productsIDs),
      },
    });
    return existentProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIDs = products.map(product => product.id);
    const existentProducts = await this.ormRepository.find({
      where: {
        id: In(productsIDs),
      },
    });
    const updatedProducts = existentProducts.map(existentProduct => {
      const newProduct = existentProduct;

      const findedProduct = products.find(
        product => product.id === existentProduct.id,
      );

      if (findedProduct) {
        newProduct.quantity -= findedProduct.quantity;
      }

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;