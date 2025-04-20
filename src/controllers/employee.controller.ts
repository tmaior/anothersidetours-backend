import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Post('register')
  async register(@Body() body) {
    const { name, email, password, roleIds, phone } = body;
    try {
      const newEmployee = await this.employeeService.create(
        name,
        email,
        password,
        roleIds,
        phone,
      );
      return { message: 'Employee registered successfully', newEmployee };
    } catch (error) {
      console.error('Error registering employee:', error);
      throw new BadRequestException('Failed to register employee');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllEmployee(){
    return this.employeeService.getAllEmployee()
  }

  @UseGuards(JwtAuthGuard)
  @Get(':employeeId')
  async getEmployee(@Param('employeeId') employeeId: string){
    return this.employeeService.getEmployee(employeeId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('')
  async update(@Body() body: { id: string; name: string; email: string; roleIds?: string[]; phone?: string }) {
    const { id, name, email, roleIds, phone } = body;
    return this.employeeService.update(id, name, email, roleIds, phone);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deactivate')
  async deactivate(@Body() body: { id: string }) {
    const { id } = body;
    return this.employeeService.deactivate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  async updatePassword(@Body() body) {
    const { id, currentPassword ,password } = body;
    return this.employeeService.updatePassword(id, currentPassword,password);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin-reset-password')
  async resetPasswordByAdmin(@Body() body: { userId: string; password: string }) {
    const { userId, password } = body;
    
    if (!userId || !password) {
      throw new BadRequestException('User ID and password are required');
    }
    
    try {
      await this.employeeService.resetPasswordByAdmin(userId, password);
      return { message: 'Password has been reset successfully', userId };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new BadRequestException('Failed to reset password: ' + error.message);
    }
  }
}
