import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.category.findMany();
  }

  async getCategoryById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { tours: true },
    });
  }

  async createCategory(data: { name: string; description?: string }) {
    return this.prisma.category.create({ data });
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string },
  ) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
