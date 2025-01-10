import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  getAllCategories() {
    return this.categoryService.getAllCategories();
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoryService.getCategoryById(id);
  }

  @Get('byTenantId/:tenantId')
  getCategoryByTenantId(@Param('tenantId') tenantId: string) {
    return this.categoryService.getCategoryByTenantId(tenantId);
  }

  @Post()
  createCategory(@Body() data: { name: string; description?: string; tenantId: string }) {
    return this.categoryService.createCategory(data);
  }

  @Put(':id')
  updateCategory(
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string },
  ) {
    return this.categoryService.updateCategory(id, data);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
